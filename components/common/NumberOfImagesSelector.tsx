import React from 'react';

interface NumberOfImagesSelectorProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const options = [1, 2, 3, 4];

const NumberOfImagesSelector: React.FC<NumberOfImagesSelectorProps> = ({ value, onChange, disabled }) => {
  return (
    <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">Số lượng ảnh</label>
        <div className="flex items-center gap-2 bg-main-bg dark:bg-gray-700/50 p-1 rounded-lg">
            {options.map(option => (
                <button
                    key={option}
                    onClick={() => onChange(option)}
                    disabled={disabled}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface dark:focus:ring-offset-dark-bg focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed ${
                        value === option
                            ? 'bg-accent text-white shadow'
                            : 'bg-transparent text-text-secondary dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                    {option}
                </button>
            ))}
        </div>
    </div>
  );
};

export default NumberOfImagesSelector;