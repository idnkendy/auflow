import React from 'react';
import { AspectRatio } from '../../types';

interface AspectRatioSelectorProps {
  value: AspectRatio;
  onChange: (value: AspectRatio) => void;
  disabled?: boolean;
}

const options: { value: AspectRatio; label: string }[] = [
    { value: '1:1', label: 'Vuông' },
    { value: '4:3', label: 'Ngang' },
    { value: '3:4', label: 'Dọc' },
    { value: '16:9', label: 'Rộng' },
    { value: '9:16', label: 'Story' },
];

const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ value, onChange, disabled }) => {
  return (
    <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">Tỷ lệ khung hình</label>
        <div className="flex flex-wrap gap-2 bg-main-bg dark:bg-gray-700/50 p-2 rounded-lg">
            {options.map(option => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    disabled={disabled}
                    className={`flex-grow py-2 px-3 rounded-md text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface dark:focus:ring-offset-dark-bg focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed ${
                        value === option.value
                            ? 'bg-accent text-white shadow'
                            : 'bg-transparent text-text-secondary dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                    {option.label} ({option.value})
                </button>
            ))}
        </div>
    </div>
  );
};

export default AspectRatioSelector;