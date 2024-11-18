import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { BookingData } from '../../types/booking';
import { parseISO, differenceInDays } from 'date-fns';

interface CSVUploaderProps {
  onDataLoaded: (data: BookingData[]) => void;
}

export function CSVUploader({ onDataLoaded }: CSVUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const parseGermanDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('.');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const calculateNights = (arrivalDate: string, departureDate: string): number => {
    if (!arrivalDate || !departureDate) return 0;
    try {
      const arrival = parseISO(arrivalDate);
      const departure = parseISO(departureDate);
      const nights = differenceInDays(departure, arrival);
      return nights > 0 ? nights : 0;
    } catch (error) {
      console.error('Fehler bei der Nächteberechnung:', error);
      return 0;
    }
  };

  const processData = useCallback((rawData: any[]) => {
    try {
      console.log('Rohdaten erhalten:', rawData.slice(0, 2));

      const processedData = rawData
        .filter((row: any) => {
          // Mindestanforderung: Buchungsnummer oder Anreisedatum muss vorhanden sein
          return row && (row['Buchungsnummer'] || row['Anreisedatum']);
        })
        .map((row: any) => {
          try {
            // Konvertiere die Daten in ISO-Format
            const arrivalDate = parseGermanDate(row['Anreisedatum']);
            const departureDate = parseGermanDate(row['Abreisedatum']);
            const bookingDate = parseGermanDate(row['Buchungsdatum']);

            // Konvertiere Umsatz und Provision zu Zahlen, berücksichtige NaN-Werte
            let revenue = 0;
            if (row['Gesamtpreis']) {
              const parsedRevenue = parseFloat(row['Gesamtpreis'].replace(/[^0-9,.-]/g, '').replace(',', '.'));
              revenue = isNaN(parsedRevenue) ? 0 : parsedRevenue;
            }

            let commission = 0;
            if (row['Provision']) {
              const parsedCommission = parseFloat(row['Provision'].replace(/[^0-9,.-]/g, '').replace(',', '.'));
              commission = isNaN(parsedCommission) ? 0 : parsedCommission;
            }

            // Berechne die Anzahl der Nächte
            let nights = 0;
            if (row['Nächte']) {
              const parsedNights = parseInt(row['Nächte'].toString(), 10);
              nights = isNaN(parsedNights) ? 0 : parsedNights;
            }

            // Konvertiere Erwachsene, Kinder und Haustiere zu Zahlen
            let adults = 0;
            if (row['Erwachsene']) {
              const parsedAdults = parseInt(row['Erwachsene'].toString(), 10);
              adults = isNaN(parsedAdults) ? 0 : parsedAdults;
            }

            let children = 0;
            if (row['Kinder']) {
              const parsedChildren = parseInt(row['Kinder'].toString(), 10);
              children = isNaN(parsedChildren) ? 0 : parsedChildren;
            }

            let pets = 0;
            if (row['Haustiere']) {
              const parsedPets = parseInt(row['Haustiere'].toString(), 10);
              pets = isNaN(parsedPets) ? 0 : parsedPets;
            }

            // Prüfe ob es eine Stornierung ist (negativer Umsatz)
            const isCancelled = revenue < 0;

            // Verarbeite den Gutscheincode für telefonische Buchungen
            const voucherCode = row['Gutscheincode']?.toString().trim() || '';
            let phoneBooking = '';
            if (voucherCode === 'T Ma') {
              phoneBooking = 'Marquardt';
            } else if (voucherCode === 'T Ro') {
              phoneBooking = 'Rohde';
            }

            // Entferne % Zeichen und konvertiere zu Nummer, berücksichtige NaN-Werte
            let commissionPercent = 0;
            if (row['Provision in %']) {
              const parsedCommissionPercent = parseFloat(row['Provision in %'].replace(/[^0-9,.-]/g, '').replace(',', '.'));
              commissionPercent = isNaN(parsedCommissionPercent) ? 0 : parsedCommissionPercent;
            } else if (commission > 0 && revenue > 0) {
              commissionPercent = (commission / revenue) * 100;
            }

            // Berechne die Anzahl der Kinder basierend auf den Kommas in "Alter der Kinder"
            const childrenAges = row['Alter der Kinder']?.toString().trim() || '';
            const childrenCount = childrenAges 
              ? (childrenAges.match(/,/g) || []).length + 1 
              : 0;

            // Erstelle das BookingData-Objekt mit Standardwerten
            return {
              bookingCode: row['Buchungsnummer']?.toString().trim() || '',
              arrivalDate,
              departureDate,
              accommodation: row['Objekt']?.toString().trim() || '',
              revenue,
              commission,
              nights,
              bookingDate,
              bookingTime: row['Uhrzeit der Buchung']?.toString().trim() || '',
              apartmentType: row['Wohnung']?.toString().trim() || '',
              commissionPercent: Number(commissionPercent.toFixed(2)),
              customerZip: row['PLZ Kunde']?.toString().trim() || '',
              customerCity: row['Ort Kunde']?.toString().trim() || '',
              adults,
              children: childrenCount,
              pets,
              bookingSource: row['Buchung über']?.toString().trim() || '',
              isCancelled,
              phoneBooking,
              // name und vorname werden ignoriert
              // name: row['Name']?.toString().trim() || '',
              // vorname: row['Vorname']?.toString().trim() || '',
            };
          } catch (error) {
            console.error('Fehler beim Verarbeiten einer Zeile:', error, row);
            console.log('Problematische Zeile:', row);
            return null;
          }
        })
        .filter((row: any) => row !== null);

      console.log('Verarbeitete Daten:', {
        total: processedData.length,
        beispiel: processedData.slice(0, 2)
      });

      if (processedData.length === 0) {
        setError('Keine gültigen Daten gefunden');
        return;
      }

      onDataLoaded(processedData);
    } catch (error) {
      console.error('Fehler bei der Datenverarbeitung:', error);
      setError('Fehler bei der Verarbeitung der Daten');
    }
  }, [onDataLoaded]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    setIsProcessing(true);

    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const buffer = reader.result;
          const decoder = new TextDecoder('utf-16le');
          const text = decoder.decode(buffer as ArrayBuffer);

          Papa.parse(text, {
            header: true,
            delimiter: ';',
            skipEmptyLines: true,
            encoding: 'UTF-16LE',
            transformHeader: (header: string) => {
              // Normalisiere die Header-Namen
              const headerMap: { [key: string]: string } = {
                'Datum': 'Buchungsdatum',
                'Uhrzeit': 'Uhrzeit der Buchung',
                'Zimmer/Wohnung/Appartement': 'Wohnung',
                'Prozent': 'Provision in %',
                'PLZ': 'PLZ Kunde',
                'Ort': 'Ort Kunde',
                'Anzahl Erwachsene': 'Erwachsene',
                'Kinderalter': 'Alter der Kinder',
                'Alter Kinder': 'Alter der Kinder',
                'Anzahl Haustiere gross': 'Haustiere',
                'Extern': 'Buchung über'
              };
              return headerMap[header] || header;
            },
            complete: (results) => {
              console.log('CSV-Parsing Ergebnis:', {
                fields: results.meta.fields,
                rowCount: results.data.length,
                beispielDaten: results.data.slice(0, 2)
              });

              if (results && results.data && results.data.length > 0) {
                processData(results.data);
              } else {
                setError('Keine Daten in der CSV-Datei gefunden');
              }
              setIsProcessing(false);
            },
            error: (error) => {
              console.error('Fehler beim Parsen:', error);
              setError('Fehler beim Parsen der CSV-Datei');
              setIsProcessing(false);
            }
          });
        } catch (error) {
          console.error('Fehler beim Lesen der Datei:', error);
          setError('Fehler beim Lesen der Datei');
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        console.error('Fehler beim Lesen der Datei');
        setError('Fehler beim Lesen der Datei');
        setIsProcessing(false);
      };

      reader.readAsArrayBuffer(file);
    }
  }, [processData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}
          ${error ? 'border-red-500 bg-red-50' : ''}`}
      >
        <input {...getInputProps()} />
        {isProcessing ? (
          <p className="text-gray-600">Verarbeite Datei...</p>
        ) : isDragActive ? (
          <p className="text-blue-500">Datei hier ablegen...</p>
        ) : (
          <p className="text-gray-500">
            Ziehen Sie eine CSV-Datei hierher oder klicken Sie zum Auswählen
          </p>
        )}
      </div>
      {error && (
        <p className="mt-2 text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}
