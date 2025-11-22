
import React from 'react';
import { ImageResolution } from '../../types';

interface ResolutionSelectorProps {
  value: ImageResolution;
  onChange: (value: ImageResolution) => void;
  disabled?: boolean;
}

const options: { value: ImageResolution; label: string; badge?: string }[] = [
    { value: '1K', label: 'Tiêu chuẩn', badge: 'Nhanh' },
    { value: '2K', label: 'Cao (2K)', badge: 'Đẹp' },
    { value: '4K', label: 'Siêu nét (4K)', badge: 'Pro' },
];

const ResolutionSelector: React.FC<ResolutionSelectorProps> = ({ value, onChange, disabled }) => {
  return (
    <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">Chất lượng ảnh</label>
        <div className="flex gap-2 bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#302839] p-1.5 rounded-xl shadow-inner">
            {options.map(option => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    disabled={disabled}
                    className={`flex-1 relative py-2 px-2 rounded-lg text-sm font-bold transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center ${
                        value === option.value
                            ? 'bg-[#7f13ec] text-white shadow-lg shadow-purple-500/20 scale-[1.02]'
                            : 'bg-transparent text-text-secondary dark:text-gray-400 hover:bg-white dark:hover:bg-[#2A2A2A] hover:text-text-primary dark:hover:text-white hover:shadow-sm'
                    }`}
                >
                    <span>{option.label}</span>
                    {option.badge && value !== option.value && (
                        <span className="absolute -top-1 -right-1 text-[8px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1 rounded-full">
                            {option.badge}
                        </span>
                    )}
                </button>
            ))}
        </div>
    </div>
  );
};

export default ResolutionSelector;
