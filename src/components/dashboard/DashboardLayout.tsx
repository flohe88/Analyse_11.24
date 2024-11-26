import React, { useState } from 'react'
import { CommissionsChart } from './charts/CommissionsChart'
import { ArrivalsChart } from './charts/ArrivalsChart'
import { CSVUploader } from './CSVUploader'
import { ExportTools } from './ExportTools'
import { DateRangePicker } from './DateRangePicker'
import { TopCitiesTable } from './TopCitiesTable'
import { TopRevenueTable } from './TopRevenueTable'
import { DetailedRevenueTable } from './DetailedRevenueTable'
import { startOfDay, endOfDay, isWithinInterval, startOfYear, endOfYear, startOfMonth, endOfMonth, parseISO, isValid, getYear, format, subYears } from 'date-fns'
import { KPICards } from './KPICards'
import { YearComparisonPicker } from './YearComparisonPicker'
import { FilterToggle } from './FilterToggle'
import { DataTable } from './DataTable'
import { MonthlyCommissionComparison } from './charts/MonthlyCommissionComparison'
import { BookingsByArrivalMonthChart } from './charts/BookingsByArrivalMonthChart'
import { BookingTimeDistributionChart } from './charts/BookingTimeDistributionChart'
import { MonthlyAverageRevenueChart } from './charts/MonthlyAverageRevenueChart'
import { BookingsPerMonthChart } from './charts/BookingsPerMonthChart'
import { ArrivalsPerMonthChart } from './charts/ArrivalsPerMonthChart'
import { BookingsByArrivalDayChart } from './charts/BookingsByArrivalDayChart'
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
  const [isCustomRangeComparison, setIsCustomRangeComparison] = React.useState(false);
  const [selectedYear1, setSelectedYear1] = React.useState(new Date().getFullYear());
  const [selectedYear2, setSelectedYear2] = React.useState(new Date().getFullYear() - 1);
  const [accommodationSearch, setAccommodationSearch] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);

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

  // Vergleichszeitraum
  const [compareRange, setCompareRange] = React.useState<{
    start: Date;
    end: Date;
  }>(() => {
    const lastYear = subYears(new Date(), 1);
    return {
      start: startOfMonth(lastYear),
      end: endOfMonth(lastYear)
    };
  });

  const [filterType, setFilterType] = React.useState<FilterType>('booking');

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
        // Unterkunftsfilter
        if (accommodationSearch && !booking.accommodation.toLowerCase().includes(accommodationSearch.toLowerCase())) {
          return false;
        }

        const relevantDate = filterType === 'arrival'
          ? parseISO(booking.arrivalDate)
          : parseISO(booking.bookingDate);

        if (!isValid(relevantDate)) {
          console.warn('Ungültiges Datum:', filterType === 'arrival' ? booking.arrivalDate : booking.bookingDate);
          return false;
        }

        if (isYearComparison) {
          if (isCustomRangeComparison) {
            // Bei Zeitraumvergleich den ausgewählten Hauptzeitraum verwenden
            return isWithinInterval(relevantDate, {
              start: startOfDay(dateRange.start),
              end: endOfDay(dateRange.end)
            });
          } else {
            // Bei Jahresvergleich das ausgewählte Jahr verwenden
            const bookingYear = getYear(relevantDate);
            return bookingYear === selectedYear1;
          }
        } else {
          // Normaler Zeitraumfilter
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
  }, [data, dateRange, isYearComparison, isCustomRangeComparison, selectedYear1, filterType, accommodationSearch]);

  // Vergleichsdaten für den Jahresvergleich oder Zeitraumvergleich
  const comparisonData = React.useMemo(() => {
    if (!isYearComparison || !data.length) return undefined;
    
    return data.filter((booking) => {
      try {
        // Unterkunftsfilter
        if (accommodationSearch && !booking.accommodation.toLowerCase().includes(accommodationSearch.toLowerCase())) {
          return false;
        }

        const relevantDate = filterType === 'arrival'
          ? parseISO(booking.arrivalDate)
          : parseISO(booking.bookingDate);

        if (!isValid(relevantDate)) {
          return false;
        }

        // Wenn Zeitraumvergleich aktiv
        if (isCustomRangeComparison) {
          return isWithinInterval(relevantDate, {
            start: startOfDay(compareRange.start),
            end: endOfDay(compareRange.end)
          });
        }

        // Ansonsten Jahresvergleich
        const bookingYear = getYear(relevantDate);
        return bookingYear === selectedYear2;
      } catch (error) {
        console.error('Fehler beim Filtern der Vergleichsdaten:', error);
        return false;
      }
    });
  }, [data, isYearComparison, isCustomRangeComparison, selectedYear2, compareRange, filterType, accommodationSearch]);

  const handleYearChange = React.useCallback((year1: number, year2: number) => {
    setSelectedYear1(year1);
    setSelectedYear2(year2);
  }, []);

  const handleCompareRangeChange = (newRange: { start: Date; end: Date }) => {
    setCompareRange(newRange);
  };

  const handleComparisonModeChange = (mode: 'year' | 'range') => {
    setIsCustomRangeComparison(mode === 'range');
  };

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

  // Berechne eindeutige Unterkünfte für Vorschläge
  const uniqueAccommodations = React.useMemo(() => {
    if (!data.length) return [];
    return Array.from(new Set(data.map(booking => booking.accommodation)))
      .sort((a, b) => a.localeCompare(b));
  }, [data]);

  // Filtere Vorschläge basierend auf der Eingabe
  const filteredSuggestions = React.useMemo(() => {
    if (!accommodationSearch) return [];
    const searchTerm = accommodationSearch.toLowerCase();
    return uniqueAccommodations
      .filter(acc => acc.toLowerCase().includes(searchTerm))
      .slice(0, 5); // Maximal 5 Vorschläge anzeigen
  }, [accommodationSearch, uniqueAccommodations]);

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

                  {/* Unterkunftsfilter */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unterkunft</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={accommodationSearch}
                        onChange={(e) => setAccommodationSearch(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Unterkunft suchen..."
                        className="
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
                      />
                      {accommodationSearch && (
                        <button
                          onClick={() => {
                            setAccommodationSearch('');
                            setShowSuggestions(false);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Vorschlagsliste */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div 
                        className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200"
                        onMouseDown={(e) => e.preventDefault()} // Verhindert, dass der Fokus verloren geht
                      >
                        {filteredSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            className="
                              w-full
                              text-left
                              px-4
                              py-2
                              text-sm
                              text-gray-700
                              hover:bg-blue-50
                              first:rounded-t-md
                              last:rounded-b-md
                              focus:outline-none
                              focus:bg-blue-50
                            "
                            onClick={() => {
                              setAccommodationSearch(suggestion);
                              setShowSuggestions(false);
                            }}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
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
                      <div className="flex space-x-4 mb-4">
                        <button
                          onClick={() => handleComparisonModeChange('year')}
                          className={`px-4 py-2 rounded-md ${
                            !isCustomRangeComparison
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          Jahresvergleich
                        </button>
                        <button
                          onClick={() => handleComparisonModeChange('range')}
                          className={`px-4 py-2 rounded-md ${
                            isCustomRangeComparison
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          Zeitraumvergleich
                        </button>
                      </div>

                      {isCustomRangeComparison ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Hauptzeitraum</label>
                            <DateRangePicker
                              value={dateRange}
                              onChange={handleDateRangeChange}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Vergleichszeitraum</label>
                            <DateRangePicker
                              value={compareRange}
                              onChange={setCompareRange}
                            />
                          </div>
                        </div>
                      ) : (
                        <YearComparisonPicker
                          year1={selectedYear1}
                          year2={selectedYear2}
                          onYear1Change={handleYear1Change}
                          onYear2Change={handleYear2Change}
                        />
                      )}
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
            <>
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Anreisen pro Monat</h2>
                <ArrivalsPerMonthChart
                  data={filteredData}
                  comparisonData={comparisonData}
                  isYearComparison={isYearComparison}
                />
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Durchschnittlicher Umsatz pro Monat</h2>
                <MonthlyAverageRevenueChart
                  data={filteredData}
                  comparisonData={comparisonData}
                  isYearComparison={isYearComparison}
                />
              </div>
            </>
          )}

          {filterType === 'booking' && (
            <>
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Buchungen pro Monat</h2>
                <BookingsPerMonthChart
                  data={filteredData}
                  comparisonData={comparisonData}
                  isYearComparison={isYearComparison}
                />
              </div>

              {!isYearComparison && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Buchungen nach Anreisemonat</h2>
                  <BookingsByArrivalMonthChart
                    data={filteredData}
                    filterStartDate={dateRange.start}
                    filterEndDate={dateRange.end}
                  />
                </div>
              )}

              {!isYearComparison && (
                <div className="bg-white shadow rounded-lg p-6 mt-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Buchungen nach Uhrzeit</h2>
                  <BookingTimeDistributionChart
                    data={filteredData}
                    filterStartDate={dateRange.start}
                    filterEndDate={dateRange.end}
                  />
                </div>
              )}

              {isYearComparison && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Buchungen nach Anreisetag (Jahresvergleich)</h2>
                  <BookingsByArrivalDayChart
                    data={filteredData}
                    comparisonData={comparisonData}
                    isYearComparison={isYearComparison}
                  />
                </div>
              )}
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
