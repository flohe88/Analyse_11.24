import React, { useState } from 'react'
import { CommissionsChart } from './charts/CommissionsChart'
import { ArrivalsChart } from './charts/ArrivalsChart'
import { CSVUploader } from './CSVUploader'
import { ExportTools } from './ExportTools'
import { DateRangePicker } from './DateRangePicker'
import { TopCitiesTable } from './TopCitiesTable'
import { TopRevenueTable } from './TopRevenueTable'
import { DetailedRevenueTable } from './DetailedRevenueTable'
import { startOfDay, endOfDay, isWithinInterval, startOfYear, endOfYear, startOfMonth, endOfMonth, parseISO, isValid, getYear, format } from 'date-fns'
import { KPICards } from './KPICards'
import { YearComparisonPicker } from './YearComparisonPicker'
import { FilterToggle } from './FilterToggle'
import { DataTable } from './DataTable'
import { ArrivalMonthsChart } from './charts/ArrivalMonthsChart'
import { MonthlyCommissionComparison } from './charts/MonthlyCommissionComparison'
import { BookingsByArrivalMonthChart } from './charts/BookingsByArrivalMonthChart'
import { BookingTimeDistributionChart } from './charts/BookingTimeDistributionChart'
import { BookingData } from '../../types/booking'

interface DashboardLayoutProps {
  bookings: BookingData[];
}

type FilterType = 'arrival' | 'booking';

export function DashboardLayout({ bookings }: DashboardLayoutProps) {
  const [data, setData] = React.useState<BookingData[]>([]);
  const [filterStartDate, setFilterStartDate] = React.useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = React.useState<Date | null>(null);
  const [isYearComparison, setIsYearComparison] = React.useState(false);
  const [selectedYear1, setSelectedYear1] = React.useState<number>(new Date().getFullYear());
  const [selectedYear2, setSelectedYear2] = React.useState<number>(new Date().getFullYear() - 1);
  const [filterType, setFilterType] = React.useState<FilterType>('booking');

  // Initialisiere dateRange mit dem aktuellen Monat
  const [dateRange, setDateRange] = React.useState<{
    start: Date;
    end: Date;
  }>(() => {
    const now = new Date();
    return {
      start: startOfMonth(now),
      end: endOfMonth(now)
    };
  });

  const handleDateRangeChange = (newDateRange: { start: Date; end: Date }) => {
    console.log('Neuer Datumsbereich:', newDateRange);
    setDateRange(newDateRange);
  };

  // Handler für Jahresänderungen
  const handleYear1Change = (year: number) => {
    setSelectedYear1(year);
  };

  const handleYear2Change = (year: number) => {
    setSelectedYear2(year);
  };

  const handleDataLoaded = React.useCallback((newData: BookingData[]) => {
    console.log('Neue Daten geladen:', newData);
    setData(newData);
  }, []);

  // Filterfunktion für Buchungen basierend auf Filtertyp
  const filterBookings = (booking: BookingData, compareDate: Date, filterType: FilterType): boolean => {
    try {
      const relevantDate = filterType === 'arrival' 
        ? parseISO(booking.arrivalDate)
        : parseISO(booking.bookingDate);

      if (!isValid(relevantDate)) {
        console.warn('Ungültiges Datum:', filterType === 'arrival' ? booking.arrivalDate : booking.bookingDate);
        return false;
      }

      return getYear(relevantDate) === getYear(compareDate);
    } catch (error) {
      console.error('Fehler beim Filtern der Buchung:', error);
      return false;
    }
  };

  // Gefilterte Daten basierend auf ausgewähltem Zeitraum oder Jahr
  const filteredData = React.useMemo(() => {
    if (!data.length) return [];

    return data.filter((booking) => {
      try {
        const relevantDate = filterType === 'arrival'
          ? parseISO(booking.arrivalDate)
          : parseISO(booking.bookingDate);

        if (!isValid(relevantDate)) {
          console.warn('Ungültiges Datum:', filterType === 'arrival' ? booking.arrivalDate : booking.bookingDate);
          return false;
        }

        if (isYearComparison) {
          const bookingYear = getYear(relevantDate);
          return bookingYear === selectedYear1;
        } else {
          return isWithinInterval(relevantDate, {
            start: startOfDay(dateRange.start),
            end: endOfDay(dateRange.end)
          });
        }
      } catch (error) {
        console.error('Fehler beim Filtern der Buchung:', error);
        return false;
      }
    });
  }, [data, dateRange, isYearComparison, selectedYear1, filterType]);

  // Vergleichsdaten für den Jahresvergleich
  const comparisonData = React.useMemo(() => {
    if (!isYearComparison || !data.length) return undefined;
    
    return data.filter((booking) => {
      try {
        const relevantDate = filterType === 'arrival'
          ? parseISO(booking.arrivalDate)
          : parseISO(booking.bookingDate);

        if (!isValid(relevantDate)) {
          return false;
        }

        const bookingYear = getYear(relevantDate);
        return bookingYear === selectedYear2;
      } catch (error) {
        console.error('Fehler beim Filtern der Vergleichsdaten:', error);
        return false;
      }
    });
  }, [data, isYearComparison, selectedYear2, filterType]);

  const handleYearChange = React.useCallback((year1: number, year2: number) => {
    setSelectedYear1(year1);
    setSelectedYear2(year2);
  }, []);

  // Berechne min/max Datum aus den Daten
  const minDate = React.useMemo(() => {
    if (!data || data.length === 0) return undefined;
    return startOfDay(new Date(Math.min(...data.map(booking => new Date(booking.arrivalDate).getTime()))));
  }, [data]);

  const maxDate = React.useMemo(() => {
    if (!data || data.length === 0) return undefined;
    return endOfDay(new Date(Math.max(...data.map(booking => new Date(booking.arrivalDate).getTime()))));
  }, [data]);

  const hideCharts = filterType === 'booking';

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Buchungsanalyse Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Analysieren Sie Ihre Buchungsdaten und Provisionen
            </p>
          </div>

          {/* Upload Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Daten importieren</h2>
            <CSVUploader onDataLoaded={handleDataLoaded} />
          </div>

          {/* Filter Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">Filter</h2>
              
              {/* Filter Controls Container */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Main Filter Controls */}
                <div className="flex flex-col justify-between h-full">
                  {/* Filter Type Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filtermodus</label>
                    <div className="relative">
                      <select
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
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as FilterType)}
                      >
                        <option value="booking">Nach Buchungsdatum</option>
                        <option value="arrival">Nach Anreisedatum</option>
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
                  </div>

                  {/* Toggle Switch */}
                  <div className="mt-4">
                    <FilterToggle isYearComparison={isYearComparison} onToggle={setIsYearComparison} />
                  </div>
                </div>

                {/* Right Column - Date Controls */}
                <div>
                  {isYearComparison ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Jahresauswahl</label>
                      <YearComparisonPicker
                        year1={selectedYear1}
                        year2={selectedYear2}
                        onYear1Change={handleYear1Change}
                        onYear2Change={handleYear2Change}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Zeitraum</label>
                      <DateRangePicker
                        value={dateRange}
                        onChange={handleDateRangeChange}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <KPICards
            data={filteredData}
            comparisonData={comparisonData}
            isYearComparison={isYearComparison}
            filterType={filterType}
          />

          {/* Charts */}
          {filterType === 'arrival' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Anreisen pro Monat</h2>
              <ArrivalMonthsChart
                data={filteredData}
                comparisonData={comparisonData}
                filterStartDate={dateRange.start}
                filterEndDate={dateRange.end}
                isYearComparison={isYearComparison}
              />
            </div>
          )}

          {filterType === 'booking' && !isYearComparison && (
            <>
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Buchungen nach Anreisemonat</h2>
                <BookingsByArrivalMonthChart
                  data={filteredData}
                  filterStartDate={dateRange.start}
                  filterEndDate={dateRange.end}
                />
              </div>

              <div className="bg-white shadow rounded-lg p-6 mt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Buchungen nach Uhrzeit</h2>
                <BookingTimeDistributionChart
                  data={filteredData}
                  filterStartDate={dateRange.start}
                  filterEndDate={dateRange.end}
                />
              </div>
            </>
          )}

          {isYearComparison && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Provisionsvergleich nach Monat
              </h2>
              <MonthlyCommissionComparison
                data={filteredData}
                comparisonData={comparisonData || []}
                filterType={filterType}
              />
            </div>
          )}

          {/* Tables */}
          <div className="space-y-6">
            {dateRange.start && dateRange.end && !isYearComparison && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Detaillierte Umsatzübersicht</h2>
                <DetailedRevenueTable 
                  bookings={filteredData}
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                />
              </div>
            )}
            
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Top 30 Unterkünfte nach Umsatz</h2>
              <TopRevenueTable 
                data={filteredData} 
                filterStartDate={isYearComparison ? startOfYear(new Date(selectedYear1, 0, 1)) : dateRange.start}
                filterEndDate={isYearComparison ? endOfYear(new Date(selectedYear1, 11, 31)) : dateRange.end}
                comparisonData={comparisonData}
                isYearComparison={isYearComparison}
                filterType={filterType}
              />
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Buchungsübersicht</h2>
              <DataTable 
                data={filteredData} 
                comparisonData={comparisonData}
                isYearComparison={isYearComparison}
                filterType={filterType}
              />
            </div>
          </div>

          {/* Export Tools */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Daten exportieren</h2>
            <ExportTools data={filteredData} />
          </div>
        </div>
      </div>
    </div>
  );
}
