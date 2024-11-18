export interface BookingData {
  bookingCode: string;
  bookingDate: string;
  bookingTime: string;
  arrivalDate: string;
  departureDate: string;
  accommodation: string;
  apartmentType: string;
  revenue: number;
  commission: number;
  commissionPercent: number;
  nights: number;
  customerZip: string;
  customerCity: string;
  adults: number;
  children: number;
  pets: number;
  bookingSource: string;
  isCancelled: boolean;
  phoneBooking: string;
}

export interface FilterState {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  searchTerm: string;
  filters: Record<string, any>;
}

export interface ChartData {
  date: string;
  revenue: number;
  bookings: number;
  commissions: number;
}

export interface TopAccommodation {
  serviceName: string;
  revenue: number;
  bookings: number;
  averageBookingValue: number;
}
