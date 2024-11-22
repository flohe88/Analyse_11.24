import React, { useMemo, useState, useEffect, useRef } from 'react';
import { BookingData } from '../../types/booking';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { differenceInDays, parseISO, isWithinInterval, max, min } from 'date-fns';
import { Link } from 'react-router-dom';

interface TopRevenueTableProps {
  data: BookingData[];
  filterStartDate: Date | null;
  filterEndDate: Date | null;
  comparisonData?: BookingData[];
  isYearComparison?: boolean;
  filterType: 'arrival' | 'booking';
}

interface ApartmentStats {
  apartmentType: string;
  totalRevenue: number;
  totalCommission: number;
  bookingCount: number;
  totalNights: number;
  cancelledCount: number;
  occupancyRate: number;
  bookingSources: { [key: string]: number };
  difference?: {
    revenue: number;
    commission: number;
    bookings: number;
    nights: number;
  };
}

interface AccommodationStats {
  accommodation: string;
  totalRevenue: number;
  totalCommission: number;
  bookingCount: number;
  totalNights: number;
  cancelledCount: number;
  occupancyRate: number;
  bookingSources: { [key: string]: number };
  difference?: {
    revenue: number;
    commission: number;
    bookings: number;
    nights: number;
  };
  apartments?: {
    [key: string]: ApartmentStats;
  };
  apartmentCount: number;
}

// Definiere Farben für verschiedene Buchungsquellen
const sourceColors: { [key: string]: { bg: string; text: string } } = {
  'Booking.com': { bg: 'bg-blue-100', text: 'text-blue-800' },
  'Airbnb': { bg: 'bg-pink-100', text: 'text-pink-800' },
  'Expedia': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  'HomeToGo': { bg: 'bg-green-100', text: 'text-green-800' },
  'Vrbo': { bg: 'bg-purple-100', text: 'text-purple-800' },
  'HRS': { bg: 'bg-red-100', text: 'text-red-800' },
  'ABC': { bg: 'bg-orange-100', text: 'text-orange-800' },
  'default': { bg: 'bg-teal-100', text: 'text-teal-800' }
};

function getSourceColor(source: string) {
  if (!source || source.trim() === '') return sourceColors['ABC'];
  return sourceColors[source] || sourceColors.default;
}

export function TopRevenueTable({ 
  data, 
  filterStartDate, 
  filterEndDate, 
  comparisonData, 
  isYearComparison,
  filterType
}: TopRevenueTableProps) {
  const [expandedAccommodation, setExpandedAccommodation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBookingSource, setSelectedBookingSource] = useState<string>('all');
  const [hasScroll, setHasScroll] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkScroll = () => {
      if (tableRef.current) {
        const hasHorizontalScroll = tableRef.current.scrollWidth > tableRef.current.clientWidth;
        setHasScroll(hasHorizontalScroll);
      }
    };

    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [data]);

  // Sammle alle einzigartigen Buchungsquellen
  const bookingSources = useMemo(() => {
    const sources = new Set<string>();
    let hasEmptySource = false;
    
    const processBookingSource = (booking: BookingData) => {
      if (!booking.bookingSource || booking.bookingSource.trim() === '') {
        hasEmptySource = true;
      } else {
        sources.add(booking.bookingSource);
      }
    };

    data.forEach(processBookingSource);
    if (comparisonData) {
      comparisonData.forEach(processBookingSource);
    }
    
    const sortedSources = Array.from(sources).sort();
    if (hasEmptySource) {
      sortedSources.push('ABC');
    }
    return sortedSources;
  }, [data, comparisonData]);

  const totalDaysInRange = useMemo(() => {
    if (!filterStartDate || !filterEndDate) return 1;
    return differenceInDays(filterEndDate, filterStartDate) + 1; // +1 um den letzten Tag einzuschließen
  }, [filterStartDate, filterEndDate]);

  const calculateNightsInRange = (booking: BookingData, isComparison: boolean = false) => {
    // Stornierte Buchungen ignorieren
    if (booking.isCancelled) return 0;

    let arrival = parseISO(booking.arrivalDate);
    let departure = parseISO(booking.departureDate);

    // Bestimme den relevanten Zeitraum basierend auf dem Filter
    let rangeStart = filterStartDate;
    let rangeEnd = filterEndDate;

    if (!rangeStart || !rangeEnd) return 0;

    // Für den Jahresvergleich den tatsächlichen Zeitraum im jeweiligen Jahr verwenden
    if (isYearComparison) {
      const year = isComparison ? rangeStart.getFullYear() - 1 : rangeStart.getFullYear();
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);

      // Beschränke die Buchungsdaten auf das jeweilige Jahr
      if (arrival < yearStart) arrival = yearStart;
      if (departure > yearEnd) departure = yearEnd;

      // Berechne die Nächte nur innerhalb des Jahres
      const nights = Math.max(0, differenceInDays(departure, arrival));
      return nights;
    }

    // Für normale Vergleiche den gefilterten Zeitraum verwenden
    if (arrival < rangeStart) arrival = rangeStart;
    if (departure > rangeEnd) departure = rangeEnd;

    // Berechne die Nächte nur innerhalb des gefilterten Zeitraums
    const nights = Math.max(0, differenceInDays(departure, arrival));
    return nights;
  };

  const processBookings = (bookings: BookingData[], isComparison: boolean = false) => {
    const stats: { [key: string]: AccommodationStats } = {};

    // Erste Durchlauf: Sammle alle Apartments pro Unterkunft
    const accommodationApartments: { [key: string]: Set<string> } = {};
    bookings.forEach((booking) => {
      const { accommodation, apartmentType = 'ABC' } = booking;
      if (!accommodationApartments[accommodation]) {
        accommodationApartments[accommodation] = new Set();
      }
      accommodationApartments[accommodation].add(apartmentType);
    });

    bookings.forEach((booking) => {
      const { accommodation, bookingSource = '', apartmentType = 'ABC' } = booking;

      if (!stats[accommodation]) {
        stats[accommodation] = {
          accommodation,
          totalRevenue: 0,
          totalCommission: 0,
          bookingCount: 0,
          cancelledCount: 0,
          totalNights: 0,
          bookingSources: {},
          occupancyRate: 0,
          apartments: {},
          apartmentCount: accommodationApartments[accommodation].size,
          difference: isComparison ? undefined : {
            revenue: 0,
            commission: 0,
            bookings: 0,
            nights: 0,
          },
        };
      }

      // Initialisiere Apartment-Statistiken, falls noch nicht vorhanden
      if (!stats[accommodation].apartments![apartmentType]) {
        stats[accommodation].apartments![apartmentType] = {
          apartmentType,
          totalRevenue: 0,
          totalCommission: 0,
          bookingCount: 0,
          cancelledCount: 0,
          totalNights: 0,
          occupancyRate: 0,
          bookingSources: {},
          difference: isComparison ? undefined : {
            revenue: 0,
            commission: 0,
            bookings: 0,
            nights: 0,
          },
        };
      }

      // Setze leere Buchungsquelle auf 'ABC'
      const source = !bookingSource || bookingSource.trim() === '' ? 'ABC' : bookingSource;
      
      if (!stats[accommodation].bookingSources[source]) {
        stats[accommodation].bookingSources[source] = 0;
      }
      stats[accommodation].bookingSources[source]++;

      const nightsInRange = calculateNightsInRange(booking, isComparison);

      // Aktualisiere Unterkunfts-Statistiken
      stats[accommodation].totalRevenue += (booking.revenue || 0);
      stats[accommodation].totalCommission += (booking.commission || 0);
      stats[accommodation].bookingCount += 1;
      stats[accommodation].totalNights += nightsInRange;
      if (booking.isCancelled) {
        stats[accommodation].cancelledCount += 1;
      }

      // Aktualisiere Apartment-Statistiken
      const apartment = stats[accommodation].apartments![apartmentType];
      apartment.totalRevenue += (booking.revenue || 0);
      apartment.totalCommission += (booking.commission || 0);
      apartment.bookingCount += 1;
      apartment.totalNights += nightsInRange;
      if (booking.isCancelled) {
        apartment.cancelledCount += 1;
      }
    });

    // Berechne die Auslastung für jede Unterkunft und ihre Apartments
    Object.values(stats).forEach(stat => {
      // Berechne die Auslastung für die gesamte Unterkunft
      stat.occupancyRate = (stat.totalNights / (totalDaysInRange * stat.apartmentCount)) * 100;

      // Berechne die Auslastung für jedes Apartment
      Object.values(stat.apartments || {}).forEach(apartment => {
        apartment.occupancyRate = (apartment.totalNights / totalDaysInRange) * 100;
      });
    });

    return stats;
  };

  const stats = useMemo(() => {
    const currentStats = processBookings(data);
    const comparisonStats = comparisonData ? processBookings(comparisonData, true) : undefined;

    // Konvertiere das Objekt in ein Array und sortiere es
    let sortedStats = Object.values(currentStats);

    // Filtere nach Suchbegriff und Buchungsquelle
    sortedStats = sortedStats.filter(stat => {
      // Suche nach Unterkunftsname
      const matchesSearch = !searchQuery || 
        stat.accommodation.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter nach Buchungsquelle
      const matchesSource = selectedBookingSource === 'all' || 
        (selectedBookingSource === 'ABC' ? 
          // Bei ABC zeige alle Einträge, die ABC als Quelle haben
          Object.keys(stat.bookingSources).includes('ABC') :
          // Sonst normale Filterung
          Object.keys(stat.bookingSources).includes(selectedBookingSource)
        );

      return matchesSearch && matchesSource;
    });

    // Wenn keine Suche und kein Buchungsquellenfilter aktiv, beschränke auf Top 30
    if (!searchQuery && selectedBookingSource === 'all') {
      sortedStats = sortedStats
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 30);
    }

    // Sortiere die Ergebnisse immer nach Umsatz
    sortedStats = sortedStats.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Füge Vergleichsdaten hinzu, falls vorhanden
    if (comparisonStats) {
      sortedStats = sortedStats.map(stat => {
        const comparisonStat = comparisonStats[stat.accommodation];
        if (comparisonStat) {
          // Füge Vergleichsdaten für die gesamte Unterkunft hinzu
          const updatedStat = {
            ...stat,
            difference: {
              revenue: stat.totalRevenue - comparisonStat.totalRevenue,
              commission: stat.totalCommission - comparisonStat.totalCommission,
              bookings: stat.bookingCount - comparisonStat.bookingCount,
              nights: stat.totalNights - comparisonStat.totalNights
            }
          };

          // Füge Vergleichsdaten für jedes Apartment hinzu
          if (updatedStat.apartments && comparisonStat.apartments) {
            Object.keys(updatedStat.apartments).forEach(apartmentType => {
              const currentApartment = updatedStat.apartments![apartmentType];
              const comparisonApartment = comparisonStat.apartments![apartmentType];
              
              if (comparisonApartment) {
                currentApartment.difference = {
                  revenue: currentApartment.totalRevenue - comparisonApartment.totalRevenue,
                  commission: currentApartment.totalCommission - comparisonApartment.totalCommission,
                  bookings: currentApartment.bookingCount - comparisonApartment.bookingCount,
                  nights: currentApartment.totalNights - comparisonApartment.totalNights
                };
              }
            });
          }

          return updatedStat;
        }
        return stat;
      });
    }

    return sortedStats;
  }, [data, comparisonData, searchQuery, selectedBookingSource, totalDaysInRange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getCancellationColor = (percentage: number) => {
    if (percentage === 0) return 'bg-green-100 text-green-800';
    if (percentage <= 5) return 'bg-yellow-100 text-yellow-800';
    if (percentage <= 10) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-100 text-green-800';
    if (percentage >= 70) return 'bg-lime-100 text-lime-800';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800';
    if (percentage >= 30) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const formatDifference = (value: number, isCurrency: boolean = false) => {
    const prefix = value > 0 ? '+' : '';
    if (isCurrency) {
      return <span className={`${value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : ''}`}>
        {prefix}{formatCurrency(value)}
      </span>;
    }
    return <span className={`${value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : ''}`}>
      {prefix}{value}
    </span>;
  };

  return (
    <div className="relative">
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        {/* Suchfeld */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Nach allen Unterkünften suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Buchungsquellen-Filter */}
        <div className="min-w-[200px]">
          <select
            value={selectedBookingSource}
            onChange={(e) => setSelectedBookingSource(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
          >
            <option value="all">Alle Buchungsquellen</option>
            {bookingSources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="absolute -top-6 right-4 text-gray-400 animate-bounce-x">
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span className="ml-1">Scroll</span>
          </span>
        </div>
        <div 
          ref={tableRef}
          className="relative"
        >
          <div className="min-w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rang
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unterkunft
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wohnung
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gesamtumsatz
                    {isYearComparison && <div className="text-xs normal-case">Differenz zum Vorjahr</div>}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anzahl Buchungen
                    {isYearComparison && <div className="text-xs normal-case">Differenz zum Vorjahr</div>}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anzahl Nächte
                    {isYearComparison && <div className="text-xs normal-case">Differenz zum Vorjahr</div>}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provision
                    {isYearComparison && <div className="text-xs normal-case">Differenz zum Vorjahr</div>}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Storno
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auslastung
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats
                  .map((stat, index) => {
                    const isExpanded = expandedAccommodation === stat.accommodation;
                    const apartments = stat.apartments ? Object.values(stat.apartments).sort((a, b) => b.totalRevenue - a.totalRevenue) : [];
                    
                    return (
                      <React.Fragment key={stat.accommodation}>
                        <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => setExpandedAccommodation(isExpanded ? null : stat.accommodation)}
                                className="flex items-center space-x-2 hover:text-blue-600 focus:outline-none"
                              >
                                {isExpanded ? (
                                  <ChevronUpIcon className="h-4 w-4" />
                                ) : (
                                  <ChevronDownIcon className="h-4 w-4" />
                                )}
                                <span>{stat.accommodation}</span>
                              </button>
                              <Link
                                to={`/accommodation/${encodeURIComponent(stat.accommodation)}`}
                                state={{ bookings: data }}
                                className="ml-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                              >
                                Details
                              </Link>
                            </div>
                            {Object.keys(stat.bookingSources).map((source, index) => (
                              <span key={index} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceColor(source).bg} ${getSourceColor(source).text}`}>
                                {source}
                              </span>
                            ))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"></td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(stat.totalRevenue)}
                            {isYearComparison && stat.difference && (
                              <div className="text-sm">
                                {formatDifference(stat.difference.revenue, true)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {stat.bookingCount}
                            {isYearComparison && stat.difference && (
                              <div className="text-sm">
                                {formatDifference(stat.difference.bookings)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {stat.totalNights}
                            {isYearComparison && stat.difference && (
                              <div className="text-sm">
                                {formatDifference(stat.difference.nights)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(stat.totalCommission)}
                            {isYearComparison && stat.difference && (
                              <div className="text-sm">
                                {formatDifference(stat.difference.commission, true)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {(() => {
                              const percentage = (stat.cancelledCount / stat.bookingCount) * 100;
                              return (
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCancellationColor(percentage)}`}>
                                  {stat.cancelledCount} ({formatPercent(percentage)})
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getOccupancyColor(stat.occupancyRate)}`}>
                              {formatPercent(stat.occupancyRate)}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && apartments.map((apartment, apartmentIndex) => (
                          <tr
                            key={`${stat.accommodation}-${apartment.apartmentType}-${apartmentIndex}`}
                            className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} bg-opacity-50`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"></td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"></td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {apartment.apartmentType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(apartment.totalRevenue)}
                              {isYearComparison && apartment.difference && (
                                <div className="text-sm">
                                  {formatDifference(apartment.difference.revenue, true)}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {apartment.bookingCount}
                              {isYearComparison && apartment.difference && (
                                <div className="text-sm">
                                  {formatDifference(apartment.difference.bookings)}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {apartment.totalNights}
                              {isYearComparison && apartment.difference && (
                                <div className="text-sm">
                                  {formatDifference(apartment.difference.nights)}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(apartment.totalCommission)}
                              {isYearComparison && apartment.difference && (
                                <div className="text-sm">
                                  {formatDifference(apartment.difference.commission, true)}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {(() => {
                                const percentage = (apartment.cancelledCount / apartment.bookingCount) * 100;
                                return (
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCancellationColor(percentage)}`}>
                                    {apartment.cancelledCount} ({formatPercent(percentage)})
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getOccupancyColor(apartment.occupancyRate)}`}>
                                {formatPercent(apartment.occupancyRate)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
        {hasScroll && (
          <div className="text-sm text-gray-500 mt-2 text-right italic">
            ← Nach rechts scrollen für weitere Informationen →
          </div>
        )}
      </div>
    </div>
  );
}
