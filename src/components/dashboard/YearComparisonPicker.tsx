import React from 'react';

interface YearComparisonPickerProps {
  year1: number;
  year2: number;
  onYear1Change: (year: number) => void;
  onYear2Change: (year: number) => void;
}

export function YearComparisonPicker({
  year1,
  year2,
  onYear1Change,
  onYear2Change,
}: YearComparisonPickerProps) {
  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - i);

  const SelectYear = ({ value, onChange, label }: { value: number; onChange: (year: number) => void; label: string }) => (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="
          appearance-none
          w-full
          bg-white
          border border-gray-200
          text-gray-700
          font-medium
          rounded-lg
          pl-4 pr-10
          py-2.5
          text-sm
          leading-tight
          transition-all
          duration-200
          cursor-pointer
          hover:border-blue-400
          focus:outline-none
          focus:border-blue-500
          focus:ring
          focus:ring-blue-200
          focus:ring-opacity-50
        "
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
        <svg 
          className="h-5 w-5 transition-transform duration-200" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-600">Aktuell</label>
        <SelectYear value={year1} onChange={onYear1Change} label="Jahr 1" />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-600">Vergleich</label>
        <SelectYear value={year2} onChange={onYear2Change} label="Jahr 2" />
      </div>
    </div>
  );
}
