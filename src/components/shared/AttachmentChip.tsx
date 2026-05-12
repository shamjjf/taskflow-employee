'use client';

import NextImage from 'next/image';
import { FileText, Image as ImageIcon, FileArchive, Download, X, File as FileIcon } from 'lucide-react';
import { uploadService } from '@/lib/uploadService';

interface AttachmentChipProps {
  fileUrl: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  onRemove?: () => void;
  compact?: boolean;
}

function getFileIcon(fileType?: string, fileName?: string) {
  const type = fileType || '';
  const ext = fileName?.split('.').pop()?.toLowerCase() || '';

  if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    return { Icon: ImageIcon, color: '#8b5cf6', bg: '#f5f3ff' };
  }
  if (type === 'application/pdf' || ext === 'pdf') {
    return { Icon: FileText, color: '#ef4444', bg: '#fef2f2' };
  }
  if (
    type.includes('word') ||
    type.includes('document') ||
    ['doc', 'docx'].includes(ext)
  ) {
    return { Icon: FileText, color: '#3b82f6', bg: '#eff6ff' };
  }
  if (
    type.includes('excel') ||
    type.includes('spreadsheet') ||
    ['xls', 'xlsx', 'csv'].includes(ext)
  ) {
    return { Icon: FileText, color: '#10b981', bg: '#ecfdf5' };
  }
  if (type === 'application/zip' || ext === 'zip') {
    return { Icon: FileArchive, color: '#f59e0b', bg: '#fffbeb' };
  }
  return { Icon: FileIcon, color: '#64748b', bg: '#f1f5f9' };
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentChip({
  fileUrl,
  fileName,
  fileType,
  fileSize,
  onRemove,
  compact = false,
}: AttachmentChipProps) {
  const { Icon, color, bg } = getFileIcon(fileType, fileName);
  const fullUrl = uploadService.getFullUrl(fileUrl);
  const displayName = fileName || fileUrl.split('/').pop() || 'attachment';
  const isImage =
    (fileType || '').startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(displayName.split('.').pop()?.toLowerCase() || '');

  if (isImage && !compact) {
    return (
      <div className="relative inline-block group">
        <a href={fullUrl} target="_blank" rel="noopener noreferrer">
          <NextImage
            src={fullUrl}
            alt={displayName}
            width={200}
            height={200}
            unoptimized
            className="max-w-[200px] max-h-[200px] rounded-md border border-border object-cover"
          />
        </a>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-danger-soft hover:text-danger transition-colors"
            title="Remove"
          >
            <X size={12} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-white border border-border rounded-md max-w-[260px] group">
      <div
        className="w-7 h-7 rounded flex items-center justify-center shrink-0"
        style={{ background: bg, color }}
      >
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-medium truncate">{displayName}</div>
        {fileSize !== undefined && (
          <div className="text-[10.5px] text-[#71717a]">{formatFileSize(fileSize)}</div>
        )}
      </div>
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        download={displayName}
        className="w-7 h-7 rounded flex items-center justify-center text-[#71717a] hover:bg-surface-muted hover:text-[#18181b] transition-colors"
        title="Download"
      >
        <Download size={13} />
      </a>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="w-7 h-7 rounded flex items-center justify-center text-[#71717a] hover:bg-danger-soft hover:text-danger transition-colors"
          title="Remove"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
