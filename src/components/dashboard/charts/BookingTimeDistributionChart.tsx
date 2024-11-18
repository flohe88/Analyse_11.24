import React, { useMemo } from 'react';
import { BookingData } from '../../../types/booking';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { isWithinInterval, parseISO } from 'date-fns';

interface BookingTimeDistributionChartProps {
  data: BookingData[];
  filterStartDate: Date | null;
  filterEndDate: Date | null;
}

interface HourData {
  hour: string;
  count: number;
  displayHour: string;
}

export const BookingTimeDistributionChart: React.FC<BookingTimeDistributionChartProps> = ({
  data,
  filterStartDate,
  filterEndDate
}) => {
  const chartData = useMemo(() => {
    if (!filterStartDate || !filterEndDate) return [];

    // Initialisiere Stunden
    const hoursData: HourData[] = Array.from({ length: 24 }, (_, index) => ({
      hour: index.toString().padStart(2, '0'),
      displayHour: `${index.toString().padStart(2, '0')}:00`,
      count: 0
    }));

    // Verarbeite die Buchungsdaten
    data.forEach(booking => {
      const bookingDate = parseISO(booking.bookingDate);
      
      if (isWithinInterval(bookingDate, { start: filterStartDate, end: filterEndDate })) {
        // Extrahiere die Stunde aus dem bookingTime-Feld (Format: H:MM:SS)
        const timeComponents = booking.bookingTime.split(':');
        const hour = parseInt(timeComponents[0]);
        
        if (!isNaN(hour) && hour >= 0 && hour < 24) {
          hoursData[hour].count++;
        }
      }
    });

    return hoursData;
  }, [data, filterStartDate, filterEndDate]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">{data.displayHour} Uhr</p>
          <p className="text-gray-600">
            {payload[0].value} {payload[0].value === 1 ? 'Buchung' : 'Buchungen'}
          </p>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (hour: number) => {
    if (hour >= 0 && hour < 6) return '#1e293b'; // Nacht
    if (hour >= 6 && hour < 12) return '#60a5fa'; // Morgen
    if (hour >= 12 && hour < 18) return '#f59e0b'; // Nachmittag
    return '#7c3aed'; // Abend
  };

  return (
    <div className="w-full space-y-4">
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="displayHour" 
              tick={{ fontSize: 12 }}
              interval={1}
              angle={-45}
              textAnchor="end"
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count"
              name="Buchungen"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={getBarColor(index)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: '#1e293b' }} />
          <span>Nacht (00:00-05:59)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: '#60a5fa' }} />
          <span>Morgen (06:00-11:59)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: '#f59e0b' }} />
          <span>Nachmittag (12:00-17:59)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: '#7c3aed' }} />
          <span>Abend (18:00-23:59)</span>
        </div>
      </div>
    </div>
  );
};