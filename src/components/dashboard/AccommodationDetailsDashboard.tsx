import React from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { BookingData } from '../../types/booking';
import { MonthlyRevenueChart } from './charts/MonthlyRevenueChart';
import { MonthlyBookingsChart } from './charts/MonthlyBookingsChart';
import { MonthlyNightsChart } from './charts/MonthlyNightsChart';
import { MonthlyCancellationsChart } from './charts/MonthlyCancellationsChart';
import { SourceDistributionChart } from './charts/SourceDistributionChart';
import { ApartmentDistributionChart } from './charts/ApartmentDistributionChart';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface AccommodationDetailsDashboardProps {
  accommodation: string;
  allBookings: BookingData[]; // Alle Buchungen aus dem System
}

export function AccommodationDetailsDashboard() {
  const { accommodationName } = useParams<{ accommodationName: string }>();
  const location = useLocation();
  const allBookings = location.state?.allBookings || [];

  // Filtere alle Buchungen für diese Unterkunft
  const accommodationBookings = React.useMemo(() => {
    return allBookings.filter(booking => booking.accommodation === decodeURIComponent(accommodationName || ''));
  }, [allBookings, accommodationName]);

  // Berechne den gesamten verfügbaren Zeitraum
  const dateRange = React.useMemo(() => {
    if (accommodationBookings.length === 0) return { start: new Date(), end: new Date() };

    const dates = accommodationBookings.map(booking => new Date(booking.bookingDate));
    return {
      start: new Date(Math.min(...dates.map(date => date.getTime()))),
      end: new Date(Math.max(...dates.map(date => date.getTime())))
    };
  }, [accommodationBookings]);

  if (accommodationBookings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Keine Daten verfügbar für {decodeURIComponent(accommodationName || '')}
            </h1>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Zurück zur Übersicht
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              {decodeURIComponent(accommodationName || '')}
            </h1>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Zurück zur Übersicht
            </Link>
          </div>

          <div className="p-4 space-y-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Details für {decodeURIComponent(accommodationName || '')}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Zeitraum: {format(dateRange.start, 'dd.MM.yyyy', { locale: de })} - {format(dateRange.end, 'dd.MM.yyyy', { locale: de })}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Monatlicher Umsatz */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Monatlicher Umsatz</h3>
                <MonthlyRevenueChart bookings={accommodationBookings} />
              </div>

              {/* Monatliche Buchungen */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Monatliche Buchungen</h3>
                <MonthlyBookingsChart bookings={accommodationBookings} />
              </div>

              {/* Monatliche Übernachtungen */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Monatliche Übernachtungen</h3>
                <MonthlyNightsChart bookings={accommodationBookings} />
              </div>

              {/* Monatliche Stornierungen */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Monatliche Stornierungen</h3>
                <MonthlyCancellationsChart bookings={accommodationBookings} />
              </div>

              {/* Verteilung nach Buchungsquelle */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Verteilung nach Buchungsquelle</h3>
                <SourceDistributionChart bookings={accommodationBookings} />
              </div>

              {/* Verteilung nach Apartment */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Verteilung nach Apartment</h3>
                <ApartmentDistributionChart bookings={accommodationBookings} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}