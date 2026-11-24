import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../utils/formatters';

interface CopyableBadgeProps {
  text: string;
  className?: string;
  label?: string;
}

export const CopyableBadge: React.FC<CopyableBadgeProps> = ({ text, className = '', label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <span
      onClick={handleCopy}
      title="Click to copy identifier"
      className={`inline-flex items-center space-x-1 font-mono font-bold cursor-pointer group select-all transition ${
        copied
          ? 'text-emerald-700 bg-emerald-50 border border-emerald-300'
          : 'hover:text-forest-700 hover:bg-cream-100'
      } px-1.5 py-0.5 rounded ${className}`}
    >
      <span>{label || text}</span>
      {copied ? (
        <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
      ) : (
        <Copy className="w-3 h-3 text-charcoal-400 group-hover:text-forest-700 opacity-60 flex-shrink-0" />
      )}
    </span>
  );
};
