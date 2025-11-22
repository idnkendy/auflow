
import React from 'react';
import { ImageResolution } from '../../types';

interface ResolutionSelectorProps {
  value: ImageResolution;
  onChange: (value: ImageResolution) => void;
  disabled?: boolean;
}

const options: { value: ImageResolution; label: string; badge?: string; cost: number; desc: string }[] = [
    { value: 'Standard', label: 'Tiêu chuẩn', badge: 'Nhanh', cost: 5, desc: 'Nano Flash' },
    { value: '1K', label: 'HD (1K)', badge: 'Chi tiết', cost: 15, desc: 'Nano Pro' },
    { value: '2K', label: '2K QHD', badge: 'Sắc nét', cost: 20, desc: 'Nano Pro' },
    { value: '4K', label: '4K UHD', badge: 'Siêu thực', cost: 30, desc: 'Nano Pro' },
];

const ResolutionSelector: React.FC<ResolutionSelectorProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="w-full">
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">Chất lượng ảnh & Độ phân giải</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {options.map(option => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    disabled={disabled}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 text-left ${
                        value === option.value
                            ? 'bg-[#7f13ec]/10 border-[#7f13ec] shadow-md'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                    {option.badge && (
                        <span className={`absolute -top-2 -right-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${
                            value === option.value ? 'bg-[#7f13ec] text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                        }`}>
                            {option.badge}
                        </span>
                    )}
                    
                    <div className="flex flex-col items-center w-full">
                        <span className={`text-sm font-bold ${value === option.value ? 'text-[#7f13ec]' : 'text-text-primary dark:text-white'}`}>
                            {option.label}
                        </span>
                        <span className="text-[10px] text-text-secondary dark:text-gray-400 mt-0.5">
                            {option.desc}
                        </span>
                        <div className="mt-2 flex items-center gap-1 bg-white dark:bg-black/20 px-2 py-1 rounded-md border border-gray-100 dark:border-gray-600/50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z" clipRule="evenodd" />
                            </svg>
                            <span className={`text-xs font-bold ${value === option.value ? 'text-text-primary dark:text-white' : 'text-text-secondary dark:text-gray-400'}`}>
                                {option.cost}
                            </span>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    </div>
  );
};

export default ResolutionSelector;
