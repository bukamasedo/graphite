import type { NodeViewProps } from '@tiptap/react';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { Check, ChevronDown, Copy } from 'lucide-react';
import { useState } from 'react';
import { lowlight } from './lowlight';

const languages = lowlight.listLanguages().sort();

export function CodeBlockView({ node, updateAttributes }: NodeViewProps) {
  const [copied, setCopied] = useState(false);
  const language = (node.attrs.language as string | null) ?? '';
  const displayText = language || 'plain text';
  const selectWidth = `calc(${displayText.length}ch + 28px)`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(node.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateAttributes({ language: e.target.value || null });
  };

  return (
    <NodeViewWrapper className="code-block-wrapper">
      <div className="code-block-header" contentEditable={false}>
        <div className="code-block-lang-wrapper">
          <select
            className="code-block-lang-select"
            value={language}
            onChange={handleLanguageChange}
            style={{ width: selectWidth }}
          >
            <option value="">plain text</option>
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          <ChevronDown size={12} className="code-block-lang-icon" />
        </div>
        <button
          type="button"
          className="code-block-copy"
          onClick={handleCopy}
          title="Copy"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <pre>
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  );
}
