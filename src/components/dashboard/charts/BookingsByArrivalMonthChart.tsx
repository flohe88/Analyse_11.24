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
import { parseISO, format, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';

interface BookingsByArrivalMonthChartProps {
  data: BookingData[];
  filterStartDate: Date | null;
  filterEndDate: Date | null;
}

interface MonthData {
  name: string;
  [key: string]: string | number; // Für dynamische Monatswerte
}

const COLORS = [
  '#e11d48', // Januar
  '#fb7185', // Februar
  '#f43f5e', // März
  '#4f46e5', // April
  '#6366f1', // Mai
  '#818cf8', // Juni
  '#2dd4bf', // Juli
  '#14b8a6', // August
  '#0d9488', // September
  '#f59e0b', // Oktober
  '#fbbf24', // November
  '#fcd34d'  // Dezember
];

export const BookingsByArrivalMonthChart: React.FC<BookingsByArrivalMonthChartProps> = ({
  data,
  filterStartDate,
  filterEndDate
}) => {
  const chartData = useMemo(() => {

    if (!filterStartDate || !filterEndDate) return [];

    // Initialisiere Monate
    const monthsData: { [key: string]: MonthData } = {};
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    
    // Erstelle für jeden Buchungsmonat einen Eintrag
    months.forEach(month => {
      const monthName = format(new Date(2024, parseInt(month) - 1, 1), 'MMMM', { locale: de });
      monthsData[month] = {
        name: monthName,
        // Initialisiere jeden Anreisemonat mit 0
        ...Object.fromEntries(months.map(m => [`month_${m}`, 0]))
      };
    });

    // Verarbeite die Buchungsdaten
    data.forEach(booking => {
      const bookingDate = parseISO(booking.bookingDate);
      const arrivalDate = parseISO(booking.arrivalDate);
      
      if (isWithinInterval(bookingDate, { start: filterStartDate, end: filterEndDate })) {
        const bookingMonth = format(bookingDate, 'MM');
        const arrivalMonth = format(arrivalDate, 'MM');
        
        // Erhöhe den Zähler für den entsprechenden Anreisemonat
        monthsData[bookingMonth][`month_${arrivalMonth}`] = 
          (monthsData[bookingMonth][`month_${arrivalMonth}`] as number) + 1;
      }
    });

    // Konvertiere in Array und sortiere nach Monatsnummer
    return Object.entries(monthsData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, data]) => data);
  }, [data, filterStartDate, filterEndDate]);

  const renderLegend = () => (
    <div className="flex flex-wrap justify-center gap-2 text-sm">
      {Array.from({ length: 12 }).map((_, index) => {
        const monthName = format(new Date(2024, index, 1), 'MMMM', { locale: de });
        return (
          <div key={index} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-1" 
              style={{ backgroundColor: COLORS[index] }}
            />
            <span>{monthName}</span>
          </div>
        );
      })}
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => {
              if (entry.value > 0) {
                const monthNum = entry.dataKey.split('_')[1];
                const monthName = format(new Date(2024, parseInt(monthNum) - 1, 1), 'MMMM', { locale: de });
                return (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: entry.fill }}
                    />
                    <span>{monthName}: {entry.value} Buchungen</span>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-4">
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            {Array.from({ length: 12 }).map((_, index) => {
              const monthNum = String(index + 1).padStart(2, '0');
              return (
                <Bar
                  key={index}
                  dataKey={`month_${monthNum}`}
                  stackId="a"
                  fill={COLORS[index]}
                  name={format(new Date(2024, index, 1), 'MMMM', { locale: de })}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {renderLegend()}
    </div>
  );
};
