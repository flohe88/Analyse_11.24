import React, { useMemo, useState } from 'react'
import { BookingData } from '../../../types/booking'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { parseISO, isWithinInterval } from 'date-fns'

type MetricType = 'revenue' | 'bookings' | 'nights' | 'cancellationRate'

interface TopAccommodationsChartProps {
  data: BookingData[]
  filterStartDate?: Date | null
  filterEndDate?: Date | null
  filterType?: 'booking' | 'arrival'
}

export function TopAccommodationsChart({ 
  data, 
  filterStartDate, 
  filterEndDate, 
  filterType = 'booking' 
}: TopAccommodationsChartProps) {
  const [metric, setMetric] = useState<MetricType>('revenue')

  const chartData = useMemo(() => {
    // Gruppiere und berechne die Statistiken für jede Unterkunft
    const accommodationStats = new Map<string, {
      revenue: number;
      activeBookings: number;
      activeNights: number;
      cancellations: number;
      totalBookings: number;
    }>();

    // Sammle die Daten
    data.forEach(booking => {
      if (!booking.accommodation) return;

      // Prüfe ob die Buchung im Filterzeitraum liegt
      const dateToCheck = filterType === 'arrival' 
        ? parseISO(booking.arrivalDate)
        : parseISO(booking.bookingDate);

      // Wenn Filter aktiv ist und Datum außerhalb des Bereichs, überspringe diese Buchung
      if (filterStartDate && filterEndDate && !isWithinInterval(dateToCheck, {
        start: filterStartDate,
        end: filterEndDate
      })) {
        return;
      }

      const stats = accommodationStats.get(booking.accommodation) || {
        revenue: 0,
        activeBookings: 0,
        activeNights: 0,
        cancellations: 0,
        totalBookings: 0
      };

      // Aktualisiere die Statistiken basierend auf dem Buchungsstatus
      if (booking.isCancelled) {
        stats.cancellations++;
        stats.revenue += booking.revenue;  // Negativer Wert bei Stornierungen
      } else {
        stats.activeBookings++;
        stats.activeNights += booking.nights;
        stats.revenue += booking.revenue;
      }
      stats.totalBookings++;

      accommodationStats.set(booking.accommodation, stats);
    });

    // Konvertiere die Map in ein Array und sortiere nach der ausgewählten Metrik
    const sortedData = Array.from(accommodationStats.entries())
      .map(([accommodation, stats]) => ({
        name: accommodation,
        value: metric === 'revenue' 
          ? stats.revenue 
          : metric === 'bookings'
          ? stats.activeBookings  // Verwende nur aktive Buchungen
          : metric === 'nights'
          ? stats.activeNights    // Verwende nur aktive Nächte
          : (stats.cancellations / stats.totalBookings) * 100,
        revenue: stats.revenue,
        bookings: stats.activeBookings,  // Zeige nur aktive Buchungen an
        nights: stats.activeNights,      // Zeige nur aktive Nächte an
        cancellationRate: ((stats.cancellations / stats.totalBookings) * 100).toFixed(1)
      }))
      .sort((a, b) => {
        switch (metric) {
          case 'revenue':
            return b.revenue - a.revenue;
          case 'bookings':
            return b.bookings - a.bookings;
          case 'nights':
            return b.nights - a.nights;
          case 'cancellationRate':
            return parseFloat(b.cancellationRate) - parseFloat(a.cancellationRate);
          default:
            return b.revenue - a.revenue;
        }
      })
      .slice(0, 30);

    return sortedData;
  }, [data, metric, filterStartDate, filterEndDate, filterType]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getBarDataKey = () => {
    switch (metric) {
      case 'revenue':
        return 'revenue';
      case 'bookings':
        return 'bookings';
      case 'nights':
        return 'nights';
      case 'cancellationRate':
        return 'cancellationRate';
      default:
        return 'revenue';
    }
  };

  const getBarName = () => {
    switch (metric) {
      case 'revenue':
        return 'Umsatz';
      case 'bookings':
        return 'Aktive Buchungen';
      case 'nights':
        return 'Übernachtungen';
      case 'cancellationRate':
        return 'Stornoquote';
      default:
        return 'Umsatz';
    }
  };

  const formatValue = (value: number | string, metricType: MetricType) => {
    switch (metricType) {
      case 'revenue':
        return formatCurrency(Number(value));
      case 'cancellationRate':
        return `${value}%`;
      default:
        return value.toString();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Top 30 Unterkünfte</h3>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as MetricType)}
          className="px-3 py-1 border rounded"
        >
          <option value="revenue">Nach Umsatz</option>
          <option value="bookings">Nach aktiven Buchungen</option>
          <option value="nights">Nach Übernachtungen</option>
          <option value="cancellationRate">Nach Stornoquote</option>
        </select>
      </div>
      <div className="h-[1200px]">
        <ResponsiveContainer width="100%" height={1200}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 220, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis
              type="category"
              dataKey="name"
              width={200}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border rounded shadow-lg">
                      <p className="font-semibold mb-2">{data.name}</p>
                      <div className="space-y-1 text-sm">
                        <p>Umsatz: {formatCurrency(data.revenue)}</p>
                        <p>Buchungen: {data.bookings}</p>
                        <p>Übernachtungen: {data.nights}</p>
                        <p>Stornoquote: {data.cancellationRate}%</p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey={getBarDataKey()}
              name={getBarName()}
              fill="#2563eb"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
