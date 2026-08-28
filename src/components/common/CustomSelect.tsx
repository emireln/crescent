import React, { useState, useRef, useEffect } from 'react';
import { IconChevronDown, IconCheck } from '@tabler/icons-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  icon,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center justify-between gap-2 h-8 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-1.5 truncate">
          {icon && <span className="text-zinc-400 shrink-0">{icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <IconChevronDown
          size={14}
          className={`text-zinc-400 transition-transform duration-150 shrink-0 ${isOpen ? 'rotate-180 text-zinc-200' : ''}`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 min-w-[160px] max-h-64 overflow-y-auto bg-zinc-900 rounded-lg shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100 custom-scrollbar">
          {options.map(option => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-zinc-800 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {option.icon && <span>{option.icon}</span>}
                  <span className="truncate">{option.label}</span>
                </div>
                {isSelected && <IconCheck size={13} className="text-zinc-100 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
