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
  // Generiere eine Liste von Jahren (aktuelle Jahr bis 10 Jahre zurück)
  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hauptjahr
        </label>
        <select
          value={year1}
          onChange={(e) => onYear1Change(Number(e.target.value))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vergleichsjahr
        </label>
        <select
          value={year2}
          onChange={(e) => onYear2Change(Number(e.target.value))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
