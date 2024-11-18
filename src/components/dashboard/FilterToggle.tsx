import React from 'react';

interface FilterToggleProps {
  isYearComparison: boolean;
  onToggle: (value: boolean) => void;
}

export const FilterToggle: React.FC<FilterToggleProps> = ({ isYearComparison, onToggle }) => {
  return (
    <div className="flex items-center space-x-3">
      <span className={`text-sm font-medium ${!isYearComparison ? 'text-blue-600' : 'text-gray-500'}`}>
        Datumsbereich
      </span>
      <button
        type="button"
        onClick={() => onToggle(!isYearComparison)}
        className={`
          relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-all duration-300 ease-in-out focus:outline-none
          ${isYearComparison 
            ? 'bg-blue-600 after:translate-x-7' 
            : 'bg-gray-200 after:translate-x-0'
          }
          after:absolute after:top-0.5 after:left-0.5 
          after:h-5 after:w-5 after:rounded-full after:bg-white 
          after:shadow-md after:transition-all after:duration-300 after:ease-in-out
          hover:${isYearComparison ? 'bg-blue-700' : 'bg-gray-300'}
        `}
        role="switch"
        aria-checked={isYearComparison}
      />
      <span className={`text-sm font-medium ${isYearComparison ? 'text-blue-600' : 'text-gray-500'}`}>
        Jahresvergleich
      </span>
    </div>
  );
};
