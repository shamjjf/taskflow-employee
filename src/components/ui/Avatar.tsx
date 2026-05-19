import { useState } from 'react';
import { cn } from '@/lib/utils';
import { uploadService } from '@/lib/uploadService';

interface AvatarProps {
  initials: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  src?: string;
  className?: string;
}

const sizeStyles = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

export function Avatar({ initials, color = '#5b5bd6', size = 'md', src, className }: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!src && !imgFailed;
  const resolvedSrc = src ? uploadService.getFullUrl(src) : '';

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white shrink-0 overflow-hidden',
        sizeStyles[size],
        className
      )}
      style={{ background: showImage ? 'transparent' : color }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedSrc}
          alt={initials}
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}
