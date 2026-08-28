import React from 'react';
import { AiProvider } from '../../types';

interface ProviderIconProps {
  provider: AiProvider | string;
  size?: number;
  className?: string;
}

export const ProviderIcon: React.FC<ProviderIconProps> = ({ provider, size = 16, className = '' }) => {
  const p = provider.toLowerCase();

  if (p === 'ollama') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-label="Ollama Logo"
      >
        <path d="M12 2C8.5 2 6 4.5 6 8c0 1.8.7 3.4 1.8 4.6L7 19c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2l-.8-6.4C17.3 11.4 18 9.8 18 8c0-3.5-2.5-6-6-6zm-2.5 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
      </svg>
    );
  }

  if (p === 'gemini') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-label="Google Gemini Logo"
      >
        <path d="M12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24Z" />
      </svg>
    );
  }

  if (p === 'openai') {
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
        aria-label="OpenAI Logo"
      >
        <path d="M20.5 10.5a4.5 4.5 0 0 0-4.1-3.2 4.5 4.5 0 0 0-8.3-2 4.5 4.5 0 0 0-4.6 4.6 4.5 4.5 0 0 0 .5 8.6 4.5 4.5 0 0 0 4.1 3.2 4.5 4.5 0 0 0 8.3 2 4.5 4.5 0 0 0 4.6-4.6 4.5 4.5 0 0 0-.5-8.6Z" />
        <path d="M12 8.5v7" />
        <path d="m8.5 10 7 4" />
        <path d="m15.5 10-7 4" />
      </svg>
    );
  }

  if (p === 'deepseek') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-label="DeepSeek Logo"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12c0 3.84 2.16 7.18 5.34 8.86.3.16.66-.08.66-.42v-2.3c0-.32-.18-.62-.48-.76-2.14-1.04-3.52-3.14-3.52-5.38 0-3.31 2.69-6 6-6s6 2.69 6 6c0 2.24-1.38 4.34-3.52 5.38-.3.14-.48.44-.48.76v2.3c0 .34.36.58.66.42C19.84 19.18 22 15.84 22 12c0-5.52-4.48-10-10-10zm-1 8a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm4 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
      </svg>
    );
  }

  if (p === 'claude') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-label="Anthropic Claude Logo"
      >
        <path d="M12 0L14.4 8.6L23 6L17.4 12.8L24 18.4L15.4 17.6L14 24L9.8 17.6L1.2 20.4L5.6 13.2L0 8.6L8.4 8.2L12 0Z" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
};
