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
}

const OptionSelector: React.FC<OptionSelectorProps> = ({ label, options, value, onChange, disabled, id }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">{label}</label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full bg-main-bg dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 focus:ring-2 focus:ring-accent focus:outline-none transition-all appearance-none pr-10"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary dark:text-gray-400">
           <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 8l4 4 4-4"/></svg>
        </div>
      </div>
    </div>
  );
};

export default OptionSelector;