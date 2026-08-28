import React from 'react';

interface EditorIconProps {
  editor: string;
  size?: number;
  className?: string;
}

export const EditorIcon: React.FC<EditorIconProps> = ({ editor, size = 16, className = '' }) => {
  const e = editor.toLowerCase();

  // 1. Visual Studio Code (Official Ribbon Logo)
  if (e === 'code' || e === 'vscode' || e.includes('visual studio code')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-label="VS Code Logo"
      >
        <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.276A1 1 0 0 0 .3 8.709L4.09 12 .3 15.291a1 1 0 0 0 .026 1.433l1.321 1.217a1 1 0 0 0 1.277.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z" />
      </svg>
    );
  }

  // 2. Cursor AI Editor (Official Isometric Cube Logo)
  if (e === 'cursor' || e.includes('cursor')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-label="Cursor AI Logo"
      >
        <path
          d="M12 1.5L22 7.27v11.46L12 24.5 2 18.73V7.27L12 1.5z"
          fill="currentColor"
          fillOpacity="0.18"
        />
        <path
          d="M12 1.5L22 7.27 12 13.04 2 7.27 12 1.5z"
          fill="currentColor"
          fillOpacity="0.9"
        />
        <path
          d="M12 13.04L22 7.27v11.46L12 24.5V13.04z"
          fill="currentColor"
          fillOpacity="0.5"
        />
        <path
          d="M12 13.04L2 7.27v11.46L12 24.5V13.04z"
          fill="currentColor"
          fillOpacity="0.7"
        />
        <path
          d="M12 1.5L22 7.27v11.46L12 24.5 2 18.73V7.27L12 1.5z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M12 13.04L22 7.27M12 13.04L2 7.27M12 13.04V24.5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // 3. Windsurf AI Editor (Official Codeium Windsurf Wave / Sail Logo)
  if (e === 'windsurf' || e.includes('windsurf')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-label="Windsurf Logo"
      >
        <path d="M12.8 2.2c-.6-.4-1.4 0-1.5.7l-1.8 7.3c-.1.3.1.6.4.7l6.8 1.8c.7.2 1.3-.4 1.1-1.1L12.8 2.2z" />
        <path d="M8.2 11.4l-5.6 1.5c-.7.2-.9 1-.4 1.5l8.1 7.2c.5.4 1.3.1 1.4-.6l1.2-8.5c0-.4-.3-.7-.7-.8l-4-.8z" />
        <path
          d="M15.5 13.2l-3.2-.8c-.3-.1-.6.1-.7.4l-1.1 7.7c-.1.6.5 1.1 1.1.8l9.1-5.1c.6-.3.7-1.1.2-1.6l-5.4-1.4z"
          opacity="0.75"
        />
      </svg>
    );
  }

  // 4. Trae AI Editor (Official ByteDance Trae Logo)
  if (e === 'trae' || e.includes('trae')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-label="Trae AI Logo"
      >
        <path d="M3 4.5h18v4.2H14.5V20.5h-5V8.7H3V4.5z" />
        <path d="M19.5 8.7l-5 5V8.7h5z" opacity="0.7" />
        <path d="M4.5 8.7l5 5V8.7h-5z" opacity="0.7" />
      </svg>
    );
  }

  // 5. Kiro Editor (Official Kiro Monogram Logo)
  if (e === 'kiro' || e.includes('kiro')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-label="Kiro Editor Logo"
      >
        <path d="M5 3.5v17" />
        <path d="M19 5.5L8.5 12 19 18.5" />
        <circle cx="19" cy="5.5" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="19" cy="18.5" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  // 6. Zed Editor (Official Stylized Z Logo)
  if (e === 'zed' || e.includes('zed')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-label="Zed Editor Logo"
      >
        <path d="M3 4.5h18v3.2L8.6 16.3H21v3.2H3v-3.2L15.4 7.7H3V4.5z" />
      </svg>
    );
  }

  // 7. JetBrains / IntelliJ IDEA / WebStorm / PyCharm
  if (e === 'idea' || e === 'intellij' || e === 'jetbrains' || e === 'webstorm' || e === 'pycharm') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-label="JetBrains Logo"
      >
        <path d="M0 0h24v24H0V0zm3.5 3.5v17h17v-17H3.5zm2.5 13.5h6v1.8H6V17zm0-9.5h3.5v6H6v-6zm4.8 0h3.5c1.3 0 2.4 1.1 2.4 2.4s-1.1 2.4-2.4 2.4h-3.5V7.5z" />
      </svg>
    );
  }

  // 8. Sublime Text (Official 3-Fold Ribbon Logo)
  if (e === 'sublime' || e === 'subl' || e.includes('sublime')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-label="Sublime Text Logo"
      >
        <path d="M20.2 5.5l-8.5-4a2.2 2.2 0 0 0-2.4.3L3.8 6.3a1.5 1.5 0 0 0 .3 2.5l8.5 4a2.2 2.2 0 0 0 2.4-.3l5.5-4.5a1.5 1.5 0 0 0-.3-2.5z" />
        <path
          d="M20.2 11.5l-8.5-4a2.2 2.2 0 0 0-2.4.3L3.8 12.3a1.5 1.5 0 0 0 .3 2.5l8.5 4a2.2 2.2 0 0 0 2.4-.3l5.5-4.5a1.5 1.5 0 0 0-.3-2.5z"
          opacity="0.8"
        />
        <path
          d="M20.2 17.5l-8.5-4a2.2 2.2 0 0 0-2.4.3L3.8 18.3a1.5 1.5 0 0 0 .3 2.5l8.5 4a2.2 2.2 0 0 0 2.4-.3l5.5-4.5a1.5 1.5 0 0 0-.3-2.5z"
          opacity="0.6"
        />
      </svg>
    );
  }

  // 9. Neovim (Official Ribbon Logo)
  if (e === 'nvim' || e === 'neovim' || e.includes('neovim')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-label="Neovim Logo"
      >
        <path d="M3.5 4.5l6.5 15V4.5H3.5zm10.5 0v15L20.5 4.5H14zm-4.5 0l7 15h-3.2L6.8 4.5H9.5z" />
      </svg>
    );
  }

  // Generic Code Editor Icon Fallback
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
};
