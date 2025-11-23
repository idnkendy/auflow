
import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface OptionSelectorProps {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id: string;
  variant?: 'select' | 'grid'; // Added variant prop
}

const OptionSelector: React.FC<OptionSelectorProps> = ({ label, options, value, onChange, disabled, id, variant = 'select' }) => {
  
  if (variant === 'grid') {
    return (
      <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-3">{label}</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              disabled={disabled}
              className={`
                relative flex items-center justify-center px-3 py-2.5 text-sm rounded-xl border transition-all duration-200 group
                ${value === option.value 
                  ? 'bg-primary/5 border-primary text-primary font-bold shadow-sm dark:bg-primary/10' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-text-secondary dark:text-gray-300 hover:border-primary/50 dark:hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              type="button"
            >
              <span className="truncate w-full text-center">{option.label}</span>
              {value === option.value && (
                <div className="absolute inset-0 rounded-xl ring-1 ring-primary pointer-events-none"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">{label}</label>
      <div className="relative group">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`
            w-full appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
            text-text-primary dark:text-white rounded-xl px-4 py-3 pr-10 
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all cursor-pointer
            disabled:opacity-60 disabled:cursor-not-allowed
            text-sm font-medium shadow-sm
          `}
        >
          {options.map(option => (
            <option key={option.value} value={option.value} className="py-2">
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 group-hover:text-primary transition-colors">
           <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
           </svg>
        </div>
      </div>
    </div>
  );
};

export default OptionSelector;
