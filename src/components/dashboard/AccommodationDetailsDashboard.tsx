import React from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { BookingData } from '../../types/booking';

export function AccommodationDetailsDashboard() {
  const { accommodationName } = useParams<{ accommodationName: string }>();
  const location = useLocation();
  const bookings = location.state?.bookings || [];

  // Statistiken berechnen
  const stats = React.useMemo(() => {
    if (!bookings.length) return null;

    const accommodationBookings = bookings.filter(
      booking => booking.accommodation === decodeURIComponent(accommodationName || '')
    );

    const totalRevenue = accommodationBookings.reduce((sum, booking) => sum + (booking.revenue || 0), 0);
    const totalBookings = accommodationBookings.length;
    const averageRevenue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    
    const bookingsBySource = accommodationBookings.reduce((acc, booking) => {
      acc[booking.bookingSource] = (acc[booking.bookingSource] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageNights = accommodationBookings.reduce((sum, booking) => {
      const nights = booking.nights || 0;
      return sum + nights;
    }, 0) / totalBookings;

    return {
      totalRevenue,
      totalBookings,
      averageRevenue,
      bookingsBySource,
      averageNights
    };
  }, [bookings, accommodationName]);

  if (!stats) {
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

          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Gesamtumsatz
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalRevenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Anzahl Buchungen
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalBookings}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Durchschnittliche Nächte
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.averageNights.toFixed(2)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Durchschnittlicher Umsatz
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.averageRevenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Buchungsquellen */}
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Buchungsquellen
                </h3>
                <div className="mt-5">
                  <div className="flex flex-wrap gap-4">
                    {Object.entries(stats.bookingsBySource).map(([source, count]) => (
                      <div
                        key={source}
                        className="flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800"
                      >
                        <span className="text-sm font-medium">{source}</span>
                        <span className="ml-2 text-sm">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Platzhalter für zukünftige Erweiterungen */}
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Weitere Analysen folgen...
                </h3>
                <div className="mt-2 text-sm text-gray-500">
                  <p>
                    Hier werden in Zukunft weitere detaillierte Analysen und Visualisierungen erscheinen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}