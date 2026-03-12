import { convertFileSrc } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import { Download, Trash2 } from 'lucide-react';
import { useCallback, useRef } from 'react';
import { assetApi } from '@/lib/api/asset-api';

export function ImageView({
  node,
  updateAttributes,
  deleteNode,
  selected,
  extension,
  getPos,
  editor,
}: NodeViewProps) {
  const { src, alt, title, width } = node.attrs;

  // ProseMirror node attrs are typed as Record<string, unknown>
  let resolvedSrc = src as string;
  const vaultPath =
    (extension.options as { vaultPath?: string }).vaultPath ?? '';
  if (
    src &&
    !src.startsWith('http') &&
    !src.startsWith('asset://') &&
    vaultPath
  ) {
    resolvedSrc = convertFileSrc(`${vaultPath}/${src}`);
  }

  const wrapperRef = useRef<HTMLDivElement>(null);

  const onHandleMouseDown = useCallback(
    (side: 'left' | 'right') => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      // Keep handles visible while dragging even if mouse leaves the wrapper
      wrapper.classList.add('is-resizing');

      const startX = e.clientX;
      const startWidth = wrapper.offsetWidth;
      const container = wrapper.closest('.tiptap-editor-content');
      const containerWidth = container?.clientWidth ?? startWidth;

      const minPx = containerWidth * 0.1;

      const onMouseMove = (ev: MouseEvent) => {
        const delta =
          side === 'right' ? ev.clientX - startX : startX - ev.clientX;
        const newPx = Math.max(
          minPx,
          Math.min(startWidth + delta * 2, containerWidth)
        );
        wrapper.style.width = `${newPx}px`;
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        wrapper.classList.remove('is-resizing');
        const cont = wrapper.closest('.tiptap-editor-content');
        const contWidth = cont?.clientWidth ?? wrapper.offsetWidth;
        const finalPercent = Math.round(
          (wrapper.offsetWidth / contWidth) * 100
        );
        updateAttributes({ width: String(finalPercent) });
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [updateAttributes]
  );

  const onDownload = useCallback(async () => {
    const relativePath = src as string;
    if (!relativePath || relativePath.startsWith('http')) return;

    const ext = relativePath.split('.').pop() ?? 'png';
    const destPath = await save({
      defaultPath: relativePath.split('/').pop() ?? `image.${ext}`,
      filters: [{ name: 'Image', extensions: [ext] }],
    });
    if (!destPath) return;

    await assetApi.exportImage(relativePath, destPath);
  }, [src]);

  const wrapperStyle: React.CSSProperties = width ? { width: `${width}%` } : {};

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className={`image-view-wrapper${selected ? ' ProseMirror-selectednode' : ''}`}
      style={wrapperStyle}
    >
      <img
        src={resolvedSrc}
        alt={(alt ?? '') as string}
        title={(title ?? '') as string}
        draggable={false}
      />
      <div className="image-action-buttons" contentEditable={false}>
        {!(src as string)?.startsWith('http') && (
          <button
            type="button"
            className="image-action-button"
            onClick={onDownload}
          >
            <Download size={14} />
          </button>
        )}
        <button
          type="button"
          className="image-action-button image-action-button--delete"
          onClick={deleteNode}
        >
          <Trash2 size={14} />
        </button>
      </div>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: resize handle controlled by mouse drag */}
      <div
        className="image-resize-handle image-resize-handle-left"
        contentEditable={false}
        onMouseDown={onHandleMouseDown('left')}
      />
      {/* biome-ignore lint/a11y/noStaticElementInteractions: resize handle controlled by mouse drag */}
      <div
        className="image-resize-handle image-resize-handle-right"
        contentEditable={false}
        onMouseDown={onHandleMouseDown('right')}
      />
    </NodeViewWrapper>
  );
}
