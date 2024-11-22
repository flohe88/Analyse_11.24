import React from 'react';
import { useMemo } from 'react'
import { de } from 'date-fns/locale';
import { parseISO } from 'date-fns';
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/20/solid';

interface BookingData {
  revenue?: number;
  commission?: number;
  arrivalDate?: string;
  departureDate?: string;
  adults?: number;
  children?: number;
  pets?: number;
  phoneBooking?: string;
  isCancelled?: boolean;
  commissionPercent?: number;
  bookingSource?: string;
}

interface KPICardsProps {
  data: BookingData[]
  isYearComparison: boolean
  comparisonData?: BookingData[]
  endDate: string
  comparisonEndDate: string
}

export function KPICards({ data, isYearComparison, comparisonData, endDate, comparisonEndDate }: KPICardsProps) {
  const stats = useMemo(() => {
    const totalRevenue = data.reduce((sum, booking) => {
      const revenue = booking.revenue || 0;
      return sum + revenue;
    }, 0);

    const totalServiceFee = data.reduce((sum, booking) => {
      const revenue = booking.revenue || 0;
      return sum + (revenue > 150 ? 25 : 0);
    }, 0);

    const totalCommission = data.reduce((sum, booking) => {
      const commission = booking.commission || 0;
      return sum + commission;
    }, 0);

    const totalCommissionWithFee = totalCommission + totalServiceFee;

    const totalBookings = data.length;
    
    // Helper function to calculate average nights
    const calculateAverageNights = (bookings: BookingData[]): number => {
      if (!bookings || bookings.length === 0) return 0;

      const validBookings = bookings.filter(booking => 
        booking.arrivalDate && 
        booking.departureDate
      );

      if (validBookings.length === 0) return 0;

      const totalNights = validBookings.reduce((sum, booking) => {
        try {
          const arrival = parseISO(booking.arrivalDate);
          const departure = parseISO(booking.departureDate);
          const nights = (departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24);
          return sum + nights;
        } catch (error) {
          console.error('Error calculating nights for booking:', error);
          return sum;
        }
      }, 0);

      return Number((totalNights / validBookings.length).toFixed(2));
    };

    // Calculate average nights
    let averageNights = calculateAverageNights(data);

    // Calculate total nights
    const totalNights = Math.floor(data.reduce((sum, booking) => {
      if (booking.arrivalDate && booking.departureDate) {
        try {
          const arrival = parseISO(booking.arrivalDate);
          const departure = parseISO(booking.departureDate);
          const nights = (departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24);
          return sum + nights;
        } catch (error) {
          console.error('Error calculating nights for booking:', error);
          return sum;
        }
      }
      return sum;
    }, 0));

    // Calculate average revenue per night
    const averageRevenuePerNight = totalNights > 0 ? Math.round((totalRevenue / totalNights) * 100) / 100 : 0;

    const validBookings = data.filter(booking => 
      booking.arrivalDate && 
      endDate &&
      (() => {
        try {
          const [arrivalDay, arrivalMonth, arrivalYear] = booking.arrivalDate.split('.');
          const arrival = new Date(
            parseInt(arrivalYear),
            parseInt(arrivalMonth) - 1,
            parseInt(arrivalDay)
          );

          const [endDay, endMonth, endYear] = endDate.split('.');
          const filterEnd = new Date(
            parseInt(endYear),
            parseInt(endMonth) - 1,
            parseInt(endDay),
            23, 59, 59
          );

          return arrival <= filterEnd;
        } catch {
          return false;
        }
      })()
    ).length;
    
    const bookingTypes = data.reduce((acc, booking) => {
      const hasChildren = booking.children && booking.children > 0;
      const hasPets = (booking.pets || 0) > 0;
      
      if (hasPets) {
        acc.withPets++;
      }
      if (hasChildren) {
        acc.withChildren++;
      }
      if (!hasChildren && !hasPets) {
        acc.adultsOnly++;
      }
      return acc;
    }, {
      adultsOnly: 0,
      withChildren: 0,
      withPets: 0
    });

    const bookingTypeStats = [
      {
        label: 'Nur Erwachsene',
        count: bookingTypes.adultsOnly,
        percentage: (bookingTypes.adultsOnly / totalBookings) * 100
      },
      {
        label: 'Mit Kindern',
        count: bookingTypes.withChildren,
        percentage: (bookingTypes.withChildren / totalBookings) * 100
      },
      {
        label: 'Mit Haustieren',
        count: bookingTypes.withPets,
        percentage: (bookingTypes.withPets / totalBookings) * 100
      }
    ];

    const phoneBookings = data.reduce((sum, booking) => {
      return sum + (booking.phoneBooking ? 1 : 0);
    }, 0);
    const phoneBookingsPercent = (phoneBookings / totalBookings) * 100;

    const phoneBookingsByPerson = data.reduce((acc, booking) => {
      if (booking.phoneBooking) {
        const person = booking.phoneBooking;
        acc[person] = (acc[person] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const sortedPhoneBookings = Object.entries(phoneBookingsByPerson)
      .sort(([, a], [, b]) => b - a)
      .map(([person, count]) => ({
        person,
        count,
        percentage: (count / phoneBookings) * 100
      }));

    const totalGuests = data.reduce((sum, booking) => {
      const adults = booking.adults || 0;
      const children = booking.children || 0;
      return sum + adults + children;
    }, 0);

    const averageCommissionPercent = data.length > 0 
      ? data.reduce((sum, booking) => {
          const commissionPercent = booking.commissionPercent || 0;
          return sum + commissionPercent;
        }, 0) / data.length 
      : 0;

    // Berechne die Anzahl der stornierten Buchungen
    const cancelledBookings = data.reduce((sum, booking) => {
      return sum + (booking.isCancelled ? 1 : 0);
    }, 0);

    // Berechne die Stornierungsquote als Prozentsatz
    const cancellationRate = data.length > 0 
      ? (cancelledBookings / data.length) * 100
      : 0;

    // Berechne die Anzahl der Buchungen mit Servicepauschale
    const bookingsWithServiceFee = data.reduce((sum, booking) => {
      const revenue = booking.revenue || 0;
      return sum + (revenue > 150 ? 1 : 0);
    }, 0);

    // Berechne den durchschnittlichen Umsatz
    const averageRevenue = data.length > 0 
      ? totalRevenue / data.length
      : 0;

    let comparisonStats = null;
    if (comparisonData) {
      const comparisonRevenue = comparisonData.reduce((sum, booking) => {
        const revenue = booking.revenue || 0;
        return sum + revenue;
      }, 0);

      const comparisonCommission = comparisonData.reduce((sum, booking) => {
        const commission = booking.commission || 0;
        return sum + commission;
      }, 0);

      const comparisonServiceFee = comparisonData.reduce((sum, booking) => {
        const revenue = booking.revenue || 0;
        return sum + (revenue > 150 ? 25 : 0);
      }, 0);

      const comparisonCommissionWithFee = comparisonCommission + comparisonServiceFee;

      const comparisonBookingsWithServiceFee = comparisonData.reduce((sum, booking) => {
        const revenue = booking.revenue || 0;
        return sum + (revenue > 150 ? 1 : 0);
      }, 0);

      const comparisonAverageRevenue = comparisonData.length > 0 
        ? comparisonRevenue / comparisonData.length
        : 0;

      // Calculate comparison total nights
      const comparisonTotalNights = Math.floor(comparisonData.reduce((sum, booking) => {
        if (booking.arrivalDate && booking.departureDate) {
          try {
            const arrival = parseISO(booking.arrivalDate);
            const departure = parseISO(booking.departureDate);
            const nights = (departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24);
            return sum + nights;
          } catch (error) {
            console.error('Error calculating nights for comparison booking:', error);
            return sum;
          }
        }
        return sum;
      }, 0));

      // Calculate comparison average revenue per night
      const comparisonAverageRevenuePerNight = comparisonTotalNights > 0 
        ? Math.round((comparisonRevenue / comparisonTotalNights) * 100) / 100 
        : 0;

      // Calculate comparison booking types
      const comparisonBookingTypes = comparisonData.reduce((acc, booking) => {
        const hasChildren = booking.children && booking.children > 0;
        const hasPets = (booking.pets || 0) > 0;
        
        if (hasPets) {
          acc.withPets++;
        }
        if (hasChildren) {
          acc.withChildren++;
        }
        if (!hasChildren && !hasPets) {
          acc.adultsOnly++;
        }
        return acc;
      }, {
        adultsOnly: 0,
        withChildren: 0,
        withPets: 0
      });

      const comparisonBookingTypeStats = [
        {
          label: 'Nur Erwachsene',
          count: comparisonBookingTypes.adultsOnly,
          percentage: (comparisonBookingTypes.adultsOnly / comparisonData.length) * 100
        },
        {
          label: 'Mit Kindern',
          count: comparisonBookingTypes.withChildren,
          percentage: (comparisonBookingTypes.withChildren / comparisonData.length) * 100
        },
        {
          label: 'Mit Haustieren',
          count: comparisonBookingTypes.withPets,
          percentage: (comparisonBookingTypes.withPets / comparisonData.length) * 100
        }
      ];

      // Calculate comparison phone bookings
      const comparisonPhoneBookings = comparisonData.reduce((sum, booking) => {
        return sum + (booking.phoneBooking ? 1 : 0);
      }, 0);

      const comparisonPhoneBookingsPercent = (comparisonPhoneBookings / comparisonData.length) * 100;

      const comparisonPhoneBookingsByPerson = comparisonData.reduce((acc, booking) => {
        if (booking.phoneBooking) {
          const person = booking.phoneBooking;
          acc[person] = (acc[person] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const comparisonSortedPhoneBookings = Object.entries(comparisonPhoneBookingsByPerson)
        .sort(([, a], [, b]) => b - a)
        .map(([person, count]) => ({
          person,
          count,
          percentage: (count / comparisonPhoneBookings) * 100
        }));

      // Calculate comparison total guests
      const comparisonTotalGuests = comparisonData.reduce((sum, booking) => {
        const adults = booking.adults || 0;
        const children = booking.children || 0;
        return sum + adults + children;
      }, 0);

      // Calculate comparison cancelled bookings
      const comparisonCancelledBookings = comparisonData.reduce((sum, booking) => {
        return sum + (booking.isCancelled ? 1 : 0);
      }, 0);

      const comparisonCancellationRate = (comparisonCancelledBookings / comparisonData.length) * 100;

      comparisonStats = {
        revenue: comparisonRevenue,
        commission: comparisonCommissionWithFee,
        serviceFee: comparisonServiceFee,
        bookings: comparisonData.length,
        averageNights: calculateAverageNights(comparisonData),
        totalNights: comparisonTotalNights,
        averageRevenuePerNight: comparisonAverageRevenuePerNight,
        bookingTypeStats: comparisonBookingTypeStats,
        phoneBookings: comparisonPhoneBookings,
        phoneBookingsPercent: comparisonPhoneBookingsPercent,
        phoneBookingsByPerson: comparisonSortedPhoneBookings,
        totalGuests: comparisonTotalGuests,
        cancellationRate: comparisonCancellationRate,
        cancelledBookings: comparisonCancelledBookings,
        bookingsWithServiceFee: comparisonBookingsWithServiceFee,
        averageRevenue: comparisonAverageRevenue
      };
    }

    return {
      totalRevenue,
      totalCommission: totalCommissionWithFee,
      totalServiceFee,
      totalBookings,
      averageNights,
      totalNights,
      averageRevenuePerNight,
      bookingTypeStats,
      phoneBookings,
      phoneBookingsPercent,
      phoneBookingsByPerson: sortedPhoneBookings,
      totalGuests,
      averageCommissionPercent,
      cancellationRate,
      cancelledBookings, // Füge die absolute Anzahl der Stornierungen hinzu
      comparisonStats,
      bookingsWithServiceFee,
      averageRevenue,
    };
  }, [data, comparisonData, endDate, comparisonEndDate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('de-DE').format(value);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };

  const calculateChange = (current: number, previous?: number): string => {
    if (!previous) return '';
    const change = ((current - previous) / previous) * 100;
    return change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  };

  const getChangeColor = (current: number, previous?: number): string => {
    if (!previous) return '';
    return current >= previous ? 'text-green-600' : 'text-red-600';
  };

  const KPICard = ({ 
    title, 
    value, 
    comparisonValue,
    formatter = formatNumber,
    subtitle,
  }: { 
    title: string; 
    value: number; 
    comparisonValue?: number;
    formatter?: (value: number) => string;
    subtitle?: string;
  }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
      <div className="mt-2">
        <div className="text-2xl font-semibold text-gray-900">
          {formatter(value)}
        </div>
        {subtitle && (
          <div className="text-sm text-gray-500">{subtitle}</div>
        )}
        {isYearComparison && comparisonValue !== undefined && (
          <div className="flex items-baseline">
            <div className="text-sm text-gray-500">Vorjahr: {formatter(comparisonValue)}</div>
            <div className={`ml-2 text-sm ${getChangeColor(value, comparisonValue)}`}>
              {calculateChange(value, comparisonValue)}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const BookingSourceStats: React.FC<{ 
    data: BookingData[],
    comparisonData?: BookingData[],
    isYearComparison?: boolean
  }> = ({ data, comparisonData, isYearComparison }) => {
    const calculateSourceStats = (bookings: BookingData[]) => {
      const stats = bookings.reduce((acc, booking) => {
        const source = booking.bookingSource?.trim() || 'ABC';
        if (!acc[source]) {
          acc[source] = {
            count: 0,
            revenue: 0,
            totalRevenue: 0,
            commission: 0
          };
        }
        acc[source].count += 1;
        acc[source].totalRevenue += parseFloat(booking.revenue || '0');
        acc[source].revenue += (
          parseFloat(booking.revenue || '0') +
          parseFloat(booking.commission || '0')
        );
        acc[source].commission += parseFloat(booking.commission || '0');
        return acc;
      }, {} as Record<string, { count: number; revenue: number; totalRevenue: number; commission: number }>);

      const total = Object.values(stats).reduce((sum, { count }) => sum + count, 0);
      const totalRevenue = Object.values(stats).reduce((sum, { revenue }) => sum + revenue, 0);

      return {
        stats,
        total,
        totalRevenue
      };
    };

    const currentData = calculateSourceStats(data);
    const comparisonData2 = isYearComparison && comparisonData ? calculateSourceStats(comparisonData) : null;

    // Alle Quellen zusammenführen
    const allSources = new Set([
      ...Object.keys(currentData.stats),
      ...(comparisonData2?.stats ? Object.keys(comparisonData2.stats) : [])
    ]);

    const combinedStats = Array.from(allSources).map(source => {
      const current = currentData.stats[source] || { count: 0, revenue: 0, totalRevenue: 0, commission: 0 };
      const comparison = comparisonData2?.stats[source] || { count: 0, revenue: 0, totalRevenue: 0, commission: 0 };

      return {
        source,
        current: {
          count: current.count,
          percentage: (current.count / currentData.total) * 100,
          revenue: current.totalRevenue,
          commission: current.commission
        },
        comparison: {
          count: comparison.count,
          percentage: comparisonData2 ? (comparison.count / comparisonData2.total) * 100 : 0,
          revenue: comparison.totalRevenue,
          commission: comparison.commission
        },
        difference: {
          count: current.count - comparison.count,
          revenue: current.totalRevenue - comparison.totalRevenue,
          commission: current.commission - comparison.commission
        }
      };
    }).sort((a, b) => b.current.count - a.current.count);

    return (
      <div className="mt-4">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Quelle</th>
                    <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Aktuell</th>
                    {isYearComparison && (
                      <>
                        <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Vorjahr</th>
                        <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Differenz</th>
                      </>
                    )}
                    <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Umsatz</th>
                    <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Provision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {combinedStats.map((stat, index) => (
                    <tr key={stat.source} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        {stat.source}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
                        {stat.current.count} ({formatPercent(stat.current.percentage)})
                      </td>
                      {isYearComparison && (
                        <>
                          <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
                            {stat.comparison.count} ({formatPercent(stat.comparison.percentage)})
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-right text-sm">
                            <span className={`inline-flex items-center ${
                              stat.difference.count > 0 ? 'text-green-600' : 
                              stat.difference.count < 0 ? 'text-red-600' : 
                              'text-gray-500'
                            }`}>
                              {stat.difference.count > 0 && '+'}
                              {stat.difference.count}
                              <span className="ml-1">
                                {stat.difference.count > 0 ? (
                                  <ArrowUpIcon className="h-4 w-4" />
                                ) : stat.difference.count < 0 ? (
                                  <ArrowDownIcon className="h-4 w-4" />
                                ) : null}
                              </span>
                            </span>
                          </td>
                        </>
                      )}
                      <td className="whitespace-nowrap px-3 py-4 text-right text-sm">
                        <div className="text-gray-500">
                          {formatCurrency(stat.current.revenue)}
                          {isYearComparison && (
                            <div className="text-xs">
                              <span className={stat.difference.revenue > 0 ? 'text-green-600' : 'text-red-600'}>
                                {stat.difference.revenue > 0 ? '+' : ''}
                                {formatCurrency(stat.difference.revenue)}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-right text-sm">
                        <div className="text-gray-500">
                          {formatCurrency(stat.current.commission)}
                          {isYearComparison && (
                            <div className="text-xs">
                              <span className={stat.difference.commission > 0 ? 'text-green-600' : 'text-red-600'}>
                                {stat.difference.commission > 0 ? '+' : ''}
                                {formatCurrency(stat.difference.commission)}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Sonstiges</h3>
        <div className="space-y-4">
          <KPICard
            title="Gesamtumsatz"
            value={stats.totalRevenue}
            comparisonValue={stats.comparisonStats?.revenue}
            formatter={formatCurrency}
            subtitle={`⌀ ${formatCurrency(stats.averageRevenue)}`}
          />
          <KPICard
            title="Durchschn. Umsatz pro Nacht"
            value={stats.averageRevenuePerNight}
            comparisonValue={stats.comparisonStats?.averageRevenuePerNight}
            formatter={formatCurrency}
          />
          <KPICard
            title="Stornierungsquote"
            value={stats.cancellationRate}
            comparisonValue={stats.comparisonStats?.cancellationRate}
            formatter={(value) => `${value.toFixed(1)}%`}
            subtitle={`${stats.cancelledBookings} von ${stats.totalBookings} Buchungen`}
          />
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Provisionsübersicht</h3>
        <div className="space-y-4">
          <KPICard
            title="Servicepauschale"
            value={stats.totalServiceFee}
            comparisonValue={stats.comparisonStats?.serviceFee}
            formatter={formatCurrency}
            subtitle={`${stats.bookingsWithServiceFee} von ${stats.totalBookings} Buchungen`}
          />
          <KPICard
            title="Provision"
            value={stats.totalCommission - stats.totalServiceFee}
            comparisonValue={stats.comparisonStats?.commission - (stats.comparisonStats?.serviceFee || 0)}
            formatter={formatCurrency}
            subtitle={`Ø ${formatCurrency((stats.totalCommission - stats.totalServiceFee) / stats.totalBookings)}`}
          />
          <KPICard
            title="Gesamt"
            value={stats.totalCommission}
            comparisonValue={stats.comparisonStats?.commission}
            formatter={formatCurrency}
            subtitle={`Ø ${formatCurrency(stats.totalCommission / stats.totalBookings)}`}
          />
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Allgemeine Angaben</h3>
        <div className="space-y-4">
          <div className="bg-white rounded p-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Gesamtbuchungen</span>
              <span className="text-sm text-gray-500">{formatNumber(stats.totalBookings)}</span>
            </div>
          </div>
          <div className="bg-white rounded p-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Gesamtnächte</span>
              <span className="text-sm text-gray-500">{formatNumber(stats.totalNights)}</span>
            </div>
          </div>
          <div className="bg-white rounded p-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Durchschn. Übernachtungen</span>
              <span className="text-sm text-gray-500">{formatNumber(stats.averageNights)} Nächte</span>
            </div>
          </div>
          <div className="bg-white rounded p-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Gesamtanzahl Reisende</span>
              <span className="text-sm text-gray-500">{formatNumber(stats.totalGuests)}</span>
            </div>
          </div>
          {stats.bookingTypeStats.map(({ label, count, percentage }) => (
            <div key={label} className="bg-white rounded p-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-sm text-gray-500">{count} ({formatPercent(percentage)})</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Telefonische Buchungen</h3>
        <div className="space-y-4">
          <KPICard
            title="Anzahl"
            value={stats.phoneBookings}
            comparisonValue={stats.comparisonStats?.phoneBookings}
          />
          <KPICard
            title="Anteil"
            value={stats.phoneBookingsPercent}
            comparisonValue={stats.comparisonStats?.phoneBookingsPercent}
            formatter={formatPercent}
          />
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Aufschlüsselung nach Person</h4>
            <div className="space-y-2">
              {stats.phoneBookingsByPerson.map(({ person, count, percentage }) => (
                <div key={person} className="bg-white rounded p-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{person}</span>
                    <span className="text-sm text-gray-500">{count} ({formatPercent(percentage)})</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Neue Buchungsquellen-Statistik */}
      <div className="col-span-full overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Buchungsquellen Übersicht</h3>
        <BookingSourceStats 
          data={data}
          comparisonData={comparisonData}
          isYearComparison={isYearComparison}
        />
      </div>
    </div>
  );
}
