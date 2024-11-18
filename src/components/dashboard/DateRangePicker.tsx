import React from 'react';
import { useState } from 'react';
import { BookingData } from '../../types/booking';
import { startOfDay, endOfDay } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { de } from 'date-fns/locale';

interface DateRangePickerProps {
  value: {
    start: Date;
    end: Date;
  };
  onChange: (dateRange: { start: Date; end: Date }) => void;
}

export function DateRangePicker({
  value,
  onChange,
}: DateRangePickerProps) {
  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      const newStart = startOfDay(date);
      onChange({
        start: newStart,
        end: value.end < newStart ? newStart : value.end,
      });
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      const newEnd = endOfDay(date);
      onChange({
        start: value.start,
        end: newEnd,
      });
    }
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:space-x-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="w-full sm:w-auto">
            <div className="relative">
              <DatePicker
                selected={value.start}
                onChange={handleStartDateChange}
                selectsStart
                startDate={value.start}
                endDate={value.end}
                dateFormat="dd.MM.yyyy"
                locale={de}
                placeholderText="Startdatum"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-medium text-gray-600">
                Von
              </label>
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <div className="relative">
              <DatePicker
                selected={value.end}
                onChange={handleEndDateChange}
                selectsEnd
                startDate={value.start}
                endDate={value.end}
                minDate={value.start}
                dateFormat="dd.MM.yyyy"
                locale={de}
                placeholderText="Enddatum"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-medium text-gray-600">
                Bis
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
