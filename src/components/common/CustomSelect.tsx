import React, { useState, useRef, useEffect } from 'react';
import { IconChevronDown, IconCheck, IconSearch } from '@tabler/icons-react';

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
  searchPlaceholder?: string;
  icon?: React.ReactNode;
  className?: string;
  searchable?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Buscar...',
  icon,
  className = '',
  searchable,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isSearchEnabled = searchable !== undefined ? searchable : options.length > 7;

  const selectedOption = options.find(o => o.value === value);

  const filteredOptions = isSearchEnabled && searchQuery.trim()
    ? options.filter(o => o.label.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : options;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-focus search input if enabled
      if (isSearchEnabled) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    } else {
      setSearchQuery('');
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isSearchEnabled]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

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
        <div className="absolute right-0 top-full mt-1.5 min-w-[180px] bg-zinc-900 rounded-lg shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100 select-none">
          {/* Inline Search Input for large lists */}
          {isSearchEnabled && (
            <div className="p-1 pb-1.5 border-b border-zinc-800/80 mb-1 flex items-center gap-1.5 px-2 bg-zinc-950/80 rounded-md">
              <IconSearch size={13} className="text-zinc-500 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none py-1"
                onClick={e => e.stopPropagation()}
              />
            </div>
          )}

          {/* Options List (capped at 7 items visible with smooth scrollbar) */}
          <div className="max-h-[224px] overflow-y-auto space-y-0.5 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-center text-xs text-zinc-500 italic">
                Nenhum resultado
              </div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
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
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
