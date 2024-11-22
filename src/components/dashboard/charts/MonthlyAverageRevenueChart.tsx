import React, { useMemo } from 'react';
import { BookingData } from '../../../types/booking';
import { Line } from 'react-chartjs-2';
import { format, parseISO, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MonthlyAverageRevenueChartProps {
  data: BookingData[];
  comparisonData?: BookingData[];
}

export function MonthlyAverageRevenueChart({ data, comparisonData }: MonthlyAverageRevenueChartProps) {
  const chartData = useMemo(() => {
    // Finde alle einzigartigen Buchungsquellen aus beiden Datensätzen
    const sources = new Set<string>();
    [...data, ...(comparisonData || [])].forEach(booking => {
      const source = booking.bookingSource || 'ABC';
      sources.add(source);
    });

    // Gruppiere Buchungen nach Monat
    const processDataByMonth = (bookings: BookingData[]) => {
      return bookings.reduce((acc, booking) => {
        if (!booking.arrivalDate || !booking.departureDate) {
          return acc;
        }

        const arrivalDate = parseISO(booking.arrivalDate);
        const departureDate = parseISO(booking.departureDate);
        const month = format(arrivalDate, 'MM');
        const revenue = booking.revenue || 0;
        
        // Berechne die Anzahl der Nächte
        const nights = differenceInDays(departureDate, arrivalDate);
        if (nights <= 0) return acc;

        if (!acc[month]) {
          acc[month] = {
            totalRevenue: 0,
            totalNights: 0,
            month: parseInt(month),
          };
        }
        
        acc[month].totalRevenue += revenue;
        acc[month].totalNights += nights;
        
        return acc;
      }, {} as Record<string, { 
        totalRevenue: number;
        totalNights: number;
        month: number;
      }>);
    };

    // Erstelle Arrays für Labels und Werte
    const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    const labels = months.map(month => format(parseISO(`2023-${month}-01`), 'MMMM', { locale: de }));

    // Generiere Farben für die Datensätze
    const colors = [
      { border: 'rgb(75, 192, 192)', background: 'rgba(75, 192, 192, 0.5)' },
      { border: 'rgb(192, 75, 75)', background: 'rgba(192, 75, 75, 0.5)' },
      { border: 'rgb(75, 75, 192)', background: 'rgba(75, 75, 192, 0.5)' },
      { border: 'rgb(192, 192, 75)', background: 'rgba(192, 192, 75, 0.5)' },
    ];
    
    // Erstelle Datensätze für jede Buchungsquelle für beide Jahre
    const datasets = Array.from(sources).flatMap((source, index) => {
      // Aktuelles Jahr
      const currentYearData = data.filter(booking => (booking.bookingSource || 'ABC') === source);
      const currentMonthlyData = processDataByMonth(currentYearData);
      const currentAverages = months.map(month => {
        const monthData = currentMonthlyData[month];
        if (!monthData || monthData.totalNights === 0) return 0;
        return Math.round((monthData.totalRevenue / monthData.totalNights) * 100) / 100;
      });

      const currentYearDataset = {
        label: source,
        data: currentAverages,
        borderColor: colors[index % colors.length].border,
        backgroundColor: colors[index % colors.length].background,
        tension: 0.3,
      };

      // Vergleichsjahr (wenn vorhanden)
      if (comparisonData) {
        const comparisonYearData = comparisonData.filter(booking => (booking.bookingSource || 'ABC') === source);
        const comparisonMonthlyData = processDataByMonth(comparisonYearData);
        const comparisonAverages = months.map(month => {
          const monthData = comparisonMonthlyData[month];
          if (!monthData || monthData.totalNights === 0) return 0;
          return Math.round((monthData.totalRevenue / monthData.totalNights) * 100) / 100;
        });

        const comparisonYearDataset = {
          label: `${source} (Vergleich)`,
          data: comparisonAverages,
          borderColor: colors[index % colors.length].border,
          backgroundColor: colors[index % colors.length].background,
          tension: 0.3,
          borderDash: [5, 5], // gestrichelte Linie für Vergleichsjahr
        };

        return [currentYearDataset, comparisonYearDataset];
      }

      return [currentYearDataset];
    });

    return {
      labels,
      datasets,
    };
  }, [data, comparisonData]);

  return (
    <div className="w-full">
      <Line
        data={chartData}
        options={{
          responsive: true,
          plugins: {
            legend: {
              position: 'top' as const,
            },
            title: {
              display: true,
              text: 'Durchschnittlicher Umsatz pro Nacht nach Buchungsquelle',
            },
            tooltip: {
              callbacks: {
                label: (context: any) => {
                  const value = context.raw.toFixed(2);
                  return `${context.dataset.label}: ${value} €`;
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value: any) => `${value} €`,
              },
            },
          },
        }}
      />
    </div>
  );
}
