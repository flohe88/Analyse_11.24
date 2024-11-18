import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from '@tanstack/react-table'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

interface DataTableProps {
  data: any[]
}

export function DataTable({ data }: DataTableProps) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'arrivalDate', desc: true }
  ])

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: 'Buchungscode',
        accessorKey: 'bookingCode',
      },
      {
        header: 'Buchungsdatum',
        accessorKey: 'bookingDate',
        cell: ({ getValue }) => {
          const date = getValue() as string;
          return date ? format(parseISO(date), 'dd.MM.yyyy', { locale: de }) : '';
        },
        sortingFn: 'datetime',
      },
      {
        header: 'Uhrzeit',
        accessorKey: 'bookingTime',
      },
      {
        header: 'Anreisedatum',
        accessorKey: 'arrivalDate',
        cell: ({ getValue }) => {
          const date = getValue() as string;
          return date ? format(parseISO(date), 'dd.MM.yyyy', { locale: de }) : '';
        },
        sortingFn: 'datetime',
      },
      {
        header: 'Abreisedatum',
        accessorKey: 'departureDate',
        cell: ({ getValue }) => {
          const date = getValue() as string;
          return date ? format(parseISO(date), 'dd.MM.yyyy', { locale: de }) : '';
        },
        sortingFn: 'datetime',
      },
      {
        header: 'Unterkunft',
        accessorKey: 'accommodation',
      },
      {
        header: 'Wohnung',
        accessorKey: 'apartmentType',
      },
      {
        header: 'Umsatz',
        accessorKey: 'revenue',
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return formatCurrency(value);
        },
        sortingFn: 'number',
      },
      {
        header: 'Stornierung',
        accessorKey: 'isCancelled',
        cell: ({ getValue }) => {
          const isCancelled = getValue() as boolean;
          return isCancelled ? 'Ja' : '';
        },
      },
      {
        header: 'Telefonische Buchung',
        accessorKey: 'phoneBooking',
      },
      {
        header: 'Provision',
        accessorKey: 'commission',
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return formatCurrency(value);
        },
        sortingFn: 'number',
      },
      {
        header: 'Provision %',
        accessorKey: 'commissionPercent',
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return value ? `${value}%` : '';
        },
        sortingFn: 'number',
      },
      {
        header: 'Servicepauschale',
        accessorKey: 'serviceFee',
        cell: ({ row }) => {
          const revenue = row.getValue('revenue') as number;
          return revenue > 150 ? formatCurrency(25) : '';
        },
      },
      {
        header: 'Nächte',
        accessorKey: 'nights',
        cell: ({ row }) => {
          const arrivalDate = row.getValue('arrivalDate') as string;
          const departureDate = row.getValue('departureDate') as string;
          
          if (!arrivalDate || !departureDate) return '';
          
          try {
            const arrival = parseISO(arrivalDate);
            const departure = parseISO(departureDate);
            
            const nights = Math.floor((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));
            return nights > 0 ? nights : '';
          } catch (error) {
            console.error('Fehler bei der Nächteberechnung:', error, {
              arrivalDate,
              departureDate
            });
            return '';
          }
        },
        sortingFn: (rowA, rowB) => {
          const getNights = (row: any) => {
            const arrivalDate = row.getValue('arrivalDate') as string;
            const departureDate = row.getValue('departureDate') as string;
            
            if (!arrivalDate || !departureDate) return 0;
            
            try {
              const arrival = parseISO(arrivalDate);
              const departure = parseISO(departureDate);
              
              const nights = Math.floor((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));
              return nights > 0 ? nights : 0;
            } catch {
              return 0;
            }
          };
          
          return getNights(rowA) - getNights(rowB);
        },
      },
      {
        header: 'PLZ',
        accessorKey: 'customerZip',
      },
      {
        header: 'Ort',
        accessorKey: 'customerCity',
      },
      {
        header: 'Erwachsene',
        accessorKey: 'adults',
        sortingFn: 'number',
      },
      {
        header: 'Kinder',
        accessorKey: 'children',
        sortingFn: 'number',
      },
      {
        header: 'Haustiere',
        accessorKey: 'pets',
        sortingFn: 'number',
      },
      {
        header: 'Buchung über',
        accessorKey: 'bookingSource',
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return value?.trim() || 'ABC';
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="mt-4">
      <div className="mb-4">
        <input
          type="text"
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="p-2 border rounded w-full max-w-xs"
          placeholder="Suchen..."
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`
                      px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                      ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                    `}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {{
                      asc: ' 🔼',
                      desc: ' 🔽',
                    }[header.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
