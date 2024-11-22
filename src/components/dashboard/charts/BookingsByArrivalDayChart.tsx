import React, { useMemo } from 'react';
import { BookingData } from '../../../types/booking';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { parseISO, format } from 'date-fns';
import { de } from 'date-fns/locale';

interface BookingsByArrivalDayChartProps {
  data: BookingData[];
  comparisonData?: BookingData[];
  isYearComparison?: boolean;
}

interface MonthlyData {
  bookingMonth: string;
  currentYear: { [key: string]: number };
  comparisonYear: { [key: string]: number };
}

export const BookingsByArrivalDayChart: React.FC<BookingsByArrivalDayChartProps> = ({
  data,
  comparisonData,
  isYearComparison
}) => {
  const chartData = useMemo(() => {
    if (!isYearComparison || !comparisonData) return [];

    // Initialisiere die Monatsdaten
    const months = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    
    const monthlyData: { [key: string]: MonthlyData } = {};
    months.forEach(month => {
      monthlyData[month] = {
        bookingMonth: month,
        currentYear: {},
        comparisonYear: {}
      };
    });

    // Verarbeite die Buchungsdaten für das aktuelle Jahr
    data.forEach(booking => {
      if (booking.arrivalDate && booking.bookingDate) {
        const arrivalDate = parseISO(booking.arrivalDate);
        const arrivalMonth = format(arrivalDate, 'MMMM', { locale: de });
        const bookingDate = parseISO(booking.bookingDate);
        const bookingMonth = format(bookingDate, 'MMMM', { locale: de });

        if (!monthlyData[bookingMonth].currentYear[arrivalMonth]) {
          monthlyData[bookingMonth].currentYear[arrivalMonth] = 0;
        }
        monthlyData[bookingMonth].currentYear[arrivalMonth]++;
      }
    });

    // Verarbeite die Buchungsdaten für das Vergleichsjahr
    comparisonData.forEach(booking => {
      if (booking.arrivalDate && booking.bookingDate) {
        const arrivalDate = parseISO(booking.arrivalDate);
        const arrivalMonth = format(arrivalDate, 'MMMM', { locale: de });
        const bookingDate = parseISO(booking.bookingDate);
        const bookingMonth = format(bookingDate, 'MMMM', { locale: de });

        if (!monthlyData[bookingMonth].comparisonYear[arrivalMonth]) {
          monthlyData[bookingMonth].comparisonYear[arrivalMonth] = 0;
        }
        monthlyData[bookingMonth].comparisonYear[arrivalMonth]++;
      }
    });

    // Formatiere die Daten für das Chart
    return Object.values(monthlyData)
      .map(monthData => {
        const formattedData = {
          bookingMonth: monthData.bookingMonth,
          currentYearTotal: Object.values(monthData.currentYear).reduce((a, b) => a + b, 0),
          comparisonYearTotal: Object.values(monthData.comparisonYear).reduce((a, b) => a + b, 0),
          currentYearDetails: monthData.currentYear,
          comparisonYearDetails: monthData.comparisonYear
        };
        
        // Nur Monate mit Buchungen zurückgeben
        if (formattedData.currentYearTotal > 0 || formattedData.comparisonYearTotal > 0) {
          return formattedData;
        }
        return null;
      })
      .filter(data => data !== null);
  }, [data, comparisonData, isYearComparison]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const monthData = payload[0].payload;
      const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

      // Erstelle ein kombiniertes Objekt für alle Monate
      const combinedData = months.map(month => {
        const currentValue = monthData.currentYearDetails[month] || 0;
        const comparisonValue = monthData.comparisonYearDetails[month] || 0;
        const difference = currentValue - comparisonValue;
        const differenceText = difference === 0 ? '±0' : 
                             difference > 0 ? `+${difference}` : 
                             `${difference}`;

        return {
          month,
          currentValue,
          difference: differenceText
        };
      }).filter(item => item.currentValue > 0 || item.difference !== '±0');

      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold mb-2">Buchungen im {label}</p>
          <p className="text-sm text-gray-600 mb-2">
            Gesamt aktuelles Jahr: {monthData.currentYearTotal} 
            {monthData.currentYearTotal - monthData.comparisonYearTotal > 0 ? 
              ` (+${monthData.currentYearTotal - monthData.comparisonYearTotal} zum Vorjahr)` :
              monthData.currentYearTotal - monthData.comparisonYearTotal < 0 ?
              ` (${monthData.currentYearTotal - monthData.comparisonYearTotal} zum Vorjahr)` :
              ' (±0 zum Vorjahr)'}
          </p>
          <div className="space-y-1">
            {combinedData.map(({ month, currentValue, difference }) => (
              <div key={month} className="grid grid-cols-[1fr,auto,auto] gap-4 text-sm">
                <span>Anreise {month}:</span>
                <span className="text-blue-600">{currentValue}</span>
                <span className={`${
                  difference.startsWith('+') ? 'text-green-600' :
                  difference.startsWith('-') ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {difference}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (!isYearComparison || !comparisonData) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="bookingMonth" 
              tick={{ fontSize: 12 }}
              label={{ 
                value: 'Buchungsmonat', 
                position: 'insideBottom',
                offset: -5
              }}
            />
            <YAxis 
              label={{ 
                value: 'Anzahl Buchungen', 
                angle: -90, 
                position: 'insideLeft',
                offset: 10
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              name="Aktuelles Jahr"
              dataKey="currentYearTotal"
              fill="rgba(59, 130, 246, 0.8)"
              stroke="rgb(59, 130, 246)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              name="Vergleichsjahr"
              dataKey="comparisonYearTotal"
              fill="rgba(156, 163, 175, 0.6)"
              stroke="rgb(156, 163, 175)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
