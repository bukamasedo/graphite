import { getCurrentWebview } from '@tauri-apps/api/webview';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useEditorStore } from '@/stores/editor-store';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

const TAURI_DROP_MARKER = 'application/x-tauri-drop';

function isImageFile(path: string): boolean {
  const lower = path.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Workaround for wry macOS coordinate bug (drag_drop.rs):
 * draggingLocation() returns window coords but the Y conversion uses the
 * view's frame height without subtracting the view's origin offset.
 * The missing offset = (outerSize.height - innerSize.height) / dpr.
 */
async function computeYOffset(): Promise<number> {
  const win = getCurrentWindow();
  const [outer, inner] = await Promise.all([win.outerSize(), win.innerSize()]);
  return (outer.height - inner.height) / window.devicePixelRatio;
}

const SYNTHETIC_FLAG = '__synthetic';

function dispatchSynthetic(
  target: HTMLElement,
  type: string,
  clientX: number,
  clientY: number,
  dataKey?: string
) {
  const event = new DragEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
    dataTransfer: new DataTransfer(),
  });
  // Mark as synthetic so suppressNativeDrag can skip it
  (event as unknown as Record<string, unknown>)[SYNTHETIC_FLAG] = true;
  if (dataKey) {
    event.dataTransfer?.setData(dataKey, 'true');
  }
  target.dispatchEvent(event);
}

/**
 * Suppress native dragover/drop events during Tauri-managed drags.
 * We dispatch our own synthetic events with corrected coordinates;
 * native browser events would duplicate and cause incorrect behavior.
 */
function suppressNativeDrag(e: DragEvent) {
  if (SYNTHETIC_FLAG in e) return;
  e.preventDefault();
  e.stopImmediatePropagation();
}

async function handleExternalDrop(
  editor: ReturnType<typeof useEditorStore.getState>['editor'],
  paths: string[],
  clientX: number,
  clientY: number,
  t: (key: string) => string
) {
  if (!editor || !paths.length) return;

  const coords = editor.view.posAtCoords({ left: clientX, top: clientY });
  let insertPos = coords?.pos ?? editor.state.selection.from;

  for (const filePath of paths) {
    if (!isImageFile(filePath)) {
      toast.error(t('toast.imageTypeNotSupported'));
      continue;
    }

    try {
      const relativePath = await useEditorStore.getState().saveImage(filePath);
      editor
        .chain()
        .focus()
        .insertContentAt(insertPos, {
          type: 'image',
          attrs: { src: relativePath },
        })
        .run();
      // Advance position past the inserted node for correct ordering
      const node = editor.state.doc.nodeAt(insertPos);
      if (node) insertPos += node.nodeSize;
    } catch {
      toast.error(t('toast.imageSaveFailed'));
    }
  }
}

export function useImageDrop() {
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | undefined;
    let isExternalDrag = false;
    let rafId: number | null = null;
    let lastDragPos: { x: number; y: number } | null = null;

    async function setup() {
      // Await yOffset before registering Tauri listener to avoid race condition
      const yOffset = await computeYOffset();
      if (cancelled) return;

      const unlistenFn = await getCurrentWebview().onDragDropEvent(
        async (event) => {
          if (cancelled) return;

          const editor = useEditorStore.getState().editor;
          if (!editor) return;

          const dom = editor.view.dom;
          const { type } = event.payload;

          if (type === 'enter') {
            const paths = 'paths' in event.payload ? event.payload.paths : [];
            if (paths.length === 0) return;

            const { x, y } = event.payload.position;
            isExternalDrag = true;
            dom.addEventListener('dragover', suppressNativeDrag, true);
            dom.addEventListener('drop', suppressNativeDrag, true);
            dispatchSynthetic(dom, 'dragenter', x, y + yOffset);
            return;
          }

          if (type === 'over') {
            if (!isExternalDrag) return;

            const { x, y } = event.payload.position;
            lastDragPos = { x, y: y + yOffset };
            if (rafId === null) {
              rafId = requestAnimationFrame(() => {
                if (lastDragPos) {
                  dispatchSynthetic(
                    dom,
                    'dragover',
                    lastDragPos.x,
                    lastDragPos.y
                  );
                }
                rafId = null;
              });
            }
            return;
          }

          if (type === 'leave') {
            if (rafId !== null) {
              cancelAnimationFrame(rafId);
              rafId = null;
            }
            lastDragPos = null;
            dom.removeEventListener('dragover', suppressNativeDrag, true);
            dom.removeEventListener('drop', suppressNativeDrag, true);
            if (isExternalDrag) {
              dispatchSynthetic(dom, 'dragleave', 0, 0);
            }
            isExternalDrag = false;
            return;
          }

          if (type === 'drop') {
            if (rafId !== null) {
              cancelAnimationFrame(rafId);
              rafId = null;
            }
            lastDragPos = null;
            dom.removeEventListener('dragover', suppressNativeDrag, true);
            dom.removeEventListener('drop', suppressNativeDrag, true);

            const { paths, position } = event.payload;
            if (paths.length === 0) {
              isExternalDrag = false;
              return;
            }

            const clientX = position.x;
            const clientY = position.y + yOffset;

            dispatchSynthetic(dom, 'dragleave', 0, 0);
            dispatchSynthetic(dom, 'drop', clientX, clientY, TAURI_DROP_MARKER);
            await handleExternalDrop(editor, paths, clientX, clientY, t);
            isExternalDrag = false;
          }
        }
      );

      if (cancelled) {
        unlistenFn();
      } else {
        unlisten = unlistenFn;
      }
    }

    setup();

    return () => {
      cancelled = true;
      unlisten?.();
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
  }, [t]);
}
