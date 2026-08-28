import React from 'react';

interface EditorIconProps {
  editor: string;
  size?: number;
  className?: string;
}

export const EditorIcon: React.FC<EditorIconProps> = ({ editor, size = 16, className = '' }) => {
  const e = editor.toLowerCase();

  // Visual Studio Code (Official Ribbon Logo)
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
        <path d="M17.58 2.01L7.54 10.37 3.32 7.15 1.5 8.1l3.52 3.9-3.52 3.9 1.82.95 4.22-3.22 10.04 8.36L22.5 20.3V3.71l-4.92-1.7zm0 4.88v10.22L10.36 12l7.22-5.11z" />
      </svg>
    );
  }

  // Cursor AI Editor (Official Isometric Cube Logo)
  if (e === 'cursor' || e.includes('cursor')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-label="Cursor Editor Logo"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    );
  }

  // Zed Editor (Official Stylized Z Logo)
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
        <path d="M3 4h18v3.5L8.5 17H21v3H3v-3.5L15.5 7H3V4z" />
      </svg>
    );
  }

  // JetBrains / IntelliJ IDEA / WebStorm / PyCharm
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
        <path d="M0 0h24v24H0V0zm3.6 3.6v16.8h16.8V3.6H3.6zm2.4 13.2h6v1.8H6v-1.8zm0-9.6h3.6v6H6v-6zm4.8 0h3.6c1.3 0 2.4 1.1 2.4 2.4s-1.1 2.4-2.4 2.4h-3.6v-4.8z" />
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
