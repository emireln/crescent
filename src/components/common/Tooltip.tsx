import React, { useState, useRef } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  shortcut?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delayMs?: number;
  children: React.ReactElement;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  shortcut,
  position = 'bottom',
  delayMs = 150,
  children,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<number | null>(null);

  const show = () => {
    timerRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, delayMs);
  };

  const hide = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {isVisible && content && (
        <div
          role="tooltip"
          className={`absolute ${positionClasses[position]} z-[100] pointer-events-none flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 text-zinc-100 text-[11px] font-medium rounded-lg shadow-2xl whitespace-nowrap animate-in fade-in duration-100`}
        >
          <span>{content}</span>
          {shortcut && (
            <kbd className="px-1.5 py-0.2 bg-zinc-800 text-[10px] font-mono text-zinc-300 rounded">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
};
