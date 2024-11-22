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
  Legend
} from 'recharts';
import { isWithinInterval, parseISO } from 'date-fns';

interface PostalCodeDistributionChartProps {
  data: BookingData[];
  comparisonData?: BookingData[];
  isYearComparison?: boolean;
  filterStartDate: Date | null;
  filterEndDate: Date | null;
  filterType: 'bookingDate' | 'arrivalDate';
}

interface PostalCodeData {
  region: string;
  currentYear: number;
  comparisonYear: number;
  description: string;
}

const POSTAL_REGIONS: { [key: string]: string } = {
  '0': 'Dresden, Erfurt',
  '1': 'Berlin, Leipzig',
  '2': 'Hamburg, Rostock',
  '3': 'Hannover, Braunschweig',
  '4': 'Bremen, Osnabrück',
  '5': 'Köln, Dortmund',
  '6': 'Frankfurt, Kassel',
  '7': 'Stuttgart, Mannheim',
  '8': 'München, Nürnberg',
  '9': 'Nürnberg, Regensburg'
};

export const PostalCodeDistributionChart: React.FC<PostalCodeDistributionChartProps> = ({
  data,
  comparisonData,
  isYearComparison,
  filterStartDate,
  filterEndDate,
  filterType
}) => {
  const chartData = useMemo(() => {
    if (!filterStartDate || !filterEndDate) return [];

    // Initialisiere die Regionen
    const postalData: PostalCodeData[] = Array.from({ length: 10 }, (_, i) => ({
      region: i.toString(),
      currentYear: 0,
      comparisonYear: 0,
      description: POSTAL_REGIONS[i.toString()] || ''
    }));

    // Debug-Logging
    console.log('Sample Data:', data.slice(0, 5).map(b => ({
      zip: b.customerZip,
      booking: b.bookingDate,
      arrival: b.arrivalDate,
      firstDigit: b.customerZip?.charAt(0)
    })));

    // Verarbeite aktuelle Daten
    let totalProcessed = 0;
    data.forEach(booking => {
      if (booking.customerZip && booking.customerZip.trim() !== '') {
        const dateToCheck = filterType === 'bookingDate' ? 
          parseISO(booking.bookingDate) : 
          parseISO(booking.arrivalDate);

        if (isWithinInterval(dateToCheck, { start: filterStartDate, end: filterEndDate })) {
          const firstDigit = booking.customerZip.charAt(0);
          const index = parseInt(firstDigit);
          if (!isNaN(index) && index >= 0 && index <= 9) {
            postalData[index].currentYear++;
            totalProcessed++;
          }
        }
      }
    });
    
    console.log('Total processed bookings:', totalProcessed);
    console.log('Filter dates:', { start: filterStartDate, end: filterEndDate });
    console.log('Processed data:', postalData);

    // Verarbeite Vergleichsdaten wenn vorhanden
    if (isYearComparison && comparisonData) {
      comparisonData.forEach(booking => {
        if (booking.customerZip && booking.customerZip.trim() !== '') {
          const dateToCheck = filterType === 'bookingDate' ? 
            parseISO(booking.bookingDate) : 
            parseISO(booking.arrivalDate);

          if (isWithinInterval(dateToCheck, { start: filterStartDate, end: filterEndDate })) {
            const firstDigit = booking.customerZip.charAt(0);
            const index = parseInt(firstDigit);
            if (!isNaN(index) && index >= 0 && index <= 9) {
              postalData[index].comparisonYear++;
            }
          }
        }
      });
    }

    return postalData;
  }, [data, comparisonData, isYearComparison, filterStartDate, filterEndDate, filterType]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentYearValue = payload[0]?.value || 0;
      const comparisonYearValue = isYearComparison ? (payload[1]?.value || 0) : 0;
      const difference = currentYearValue - comparisonYearValue;
      const differenceText = difference === 0 ? '±0' : 
                           difference > 0 ? `+${difference}` : 
                           `${difference}`;
      const region = chartData.find(d => d.region === label);

      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold mb-1">PLZ-Region {label}</p>
          <p className="text-sm text-gray-600 mb-2">{region?.description}</p>
          <div className="space-y-1">
            <div className="grid grid-cols-[1fr,auto] gap-4 text-sm">
              <span>Aktuelles Jahr:</span>
              <span className="text-blue-600">{currentYearValue}</span>
            </div>
            {isYearComparison && (
              <>
                <div className="grid grid-cols-[1fr,auto] gap-4 text-sm">
                  <span>Vorjahr:</span>
                  <span className="text-gray-600">{comparisonYearValue}</span>
                </div>
                <div className="grid grid-cols-[1fr,auto] gap-4 text-sm">
                  <span>Differenz:</span>
                  <span className={`${
                    difference > 0 ? 'text-green-600' :
                    difference < 0 ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {differenceText}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="region" 
            label={{ 
              value: 'PLZ-Region', 
              position: 'insideBottom',
              offset: -5 
            }}
          />
          <YAxis
            label={{
              value: 'Anzahl Gäste',
              angle: -90,
              position: 'insideLeft',
              offset: 10
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            name="Aktuelles Jahr"
            dataKey="currentYear"
            fill="rgba(59, 130, 246, 0.8)"
            stroke="rgb(59, 130, 246)"
            radius={[4, 4, 0, 0]}
          />
          {isYearComparison && (
            <Bar
              name="Vergleichsjahr"
              dataKey="comparisonYear"
              fill="rgba(156, 163, 175, 0.6)"
              stroke="rgb(156, 163, 175)"
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
