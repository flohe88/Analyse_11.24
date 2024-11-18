import React, { useState } from 'react';
import { BookingData } from '../../types/booking';
import { format, differenceInDays, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';

interface DetailedRevenueTableProps {
  bookings: BookingData[];
  startDate: Date;
  endDate: Date;
}

interface DailyTotal {
  date: Date;
  bookings: number;
  revenue: number;
  commission: number;
}

export function DetailedRevenueTable({ bookings, startDate, endDate }: DetailedRevenueTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const INITIAL_ROWS = 5;

  // Prüfe ob der Zeitraum maximal 31 Tage beträgt
  const daysDifference = differenceInDays(endDate, startDate);
  const isValidDateRange = daysDifference <= 31;

  // Gruppiere Buchungen nach Datum
  const dailyTotals = React.useMemo(() => {
    if (!isValidDateRange) return [];
    
    const totals = new Map<string, DailyTotal>();

    bookings.forEach((booking) => {
      if (!booking?.bookingDate) return;

      try {
        const bookingDate = parseISO(booking.bookingDate);
        if (isNaN(bookingDate.getTime())) return;

        const dateKey = format(bookingDate, 'yyyy-MM-dd');
        const current = totals.get(dateKey) || {
          date: bookingDate,
          bookings: 0,
          revenue: 0,
          commission: 0
        };

        current.bookings += 1;
        current.revenue += booking.revenue;
        current.commission += booking.commission;

        totals.set(dateKey, current);
      } catch (error) {
        console.warn('Fehler beim Verarbeiten des Datums:', booking.bookingDate);
      }
    });

    return Array.from(totals.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [bookings, isValidDateRange]);

  const totals = React.useMemo(() => {
    return dailyTotals.reduce((acc, day) => ({
      bookings: acc.bookings + day.bookings,
      revenue: acc.revenue + day.revenue,
      commission: acc.commission + day.commission
    }), { bookings: 0, revenue: 0, commission: 0 });
  }, [dailyTotals]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return format(date, 'eee, dd.MM.yyyy', { locale: de });
  };

  const visibleRows = isExpanded ? dailyTotals : dailyTotals.slice(0, INITIAL_ROWS);
  const hasMoreRows = dailyTotals.length > INITIAL_ROWS;

  if (!isValidDateRange) {
    return (
      <div className="text-center text-gray-500 py-4">
        Bitte wählen Sie einen Zeitraum von maximal 31 Tagen aus.
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Datum
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Buchungen
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Umsatz
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Provision
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gesamt
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {visibleRows.map((day, index) => (
              <tr key={format(day.date, 'yyyy-MM-dd')} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(day.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                  {day.bookings}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatCurrency(day.revenue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatCurrency(day.commission)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatCurrency(day.revenue + day.commission)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-medium">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                Gesamt
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {totals.bookings}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                {formatCurrency(totals.revenue)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                {formatCurrency(totals.commission)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                {formatCurrency(totals.revenue + totals.commission)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {hasMoreRows && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isExpanded ? (
              <>
                <ChevronUpIcon className="h-5 w-5 mr-2" />
                Weniger anzeigen
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-5 w-5 mr-2" />
                Alle {dailyTotals.length} Tage anzeigen
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
