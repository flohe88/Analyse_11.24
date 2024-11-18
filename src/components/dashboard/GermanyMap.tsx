import React, { useMemo, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps";
import { BookingData } from '../../types/booking';

// TopoJSON für Deutschland
const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/germany/deu-states.json";

interface GermanyMapProps {
  bookings: BookingData[];
}

// PLZ-Bereiche der Bundesländer als Strings
const plzRanges = {
  'BB': { // Brandenburg
    ranges: [
      ['14401', '16949'],
      ['17291', '17291'],
      ['19307', '19357']
    ]
  },
  'BE': { // Berlin
    ranges: [['10115', '14199']]
  },
  'BW': { // Baden-Württemberg
    ranges: [['68001', '79999']]
  },
  'BY': { // Bayern
    ranges: [['80001', '87490'], ['89001', '96479'], ['97001', '97859']]
  },
  'HB': { // Bremen
    ranges: [['27501', '28779']]
  },
  'HE': { // Hessen
    ranges: [['34001', '36399'], ['60001', '65936'], ['68501', '69509']]
  },
  'HH': { // Hamburg
    ranges: [['20001', '22399']]
  },
  'MV': { // Mecklenburg-Vorpommern
    ranges: [['17001', '17199'], ['18001', '19260']]
  },
  'NI': { // Niedersachsen
    ranges: [
      ['21201', '21449'],
      ['26001', '27499'],
      ['28801', '29699'],
      ['30001', '31868'],
      ['37001', '37199'],
      ['37401', '37699'],
      ['38001', '38969'],
      ['48401', '48429'],
      ['48461', '48465'],
      ['48477', '48477'],
      ['48485', '48496'],
      ['48511', '48531'],
      ['49001', '49459']
    ]
  },
  'NW': { // Nordrhein-Westfalen
    ranges: [['32001', '33829'], ['40001', '48399'], ['50001', '53949'], ['57001', '59969']]
  },
  'RP': { // Rheinland-Pfalz
    ranges: [['54290', '56869'], ['65582', '67829'], ['76711', '76891']]
  },
  'SH': { // Schleswig-Holstein
    ranges: [['22401', '25999']]
  },
  'SL': { // Saarland
    ranges: [['66001', '66459']]
  },
  'SN': { // Sachsen
    ranges: [['01001', '09999']]
  },
  'ST': { // Sachsen-Anhalt
    ranges: [['06001', '06929'], ['39001', '39649']]
  },
  'TH': { // Thüringen
    ranges: [['07301', '07980'], ['98501', '99998']]
  }
};

const isPlzInRange = (plz: string, ranges: string[][]) => {
  return ranges.some(([start, end]) => plz >= start && plz <= end);
};

const getStateFromPlz = (plz: string): string | null => {
  for (const [state, { ranges }] of Object.entries(plzRanges)) {
    if (isPlzInRange(plz, ranges)) {
      return state;
    }
  }
  return null;
};

// Funktion zur Berechnung der Farbe basierend auf dem Umsatz
const getColorScale = (value: number, maxValue: number) => {
  const intensity = maxValue > 0 ? (value / maxValue) : 0;
  const green = Math.floor(45 + (intensity * 125)); // Von rgb(45, 125, 50) bis rgb(45, 250, 50)
  return `rgb(45, ${green}, 50)`;
};

export function GermanyMap({ bookings }: GermanyMapProps) {
  const { stateData, maxValue } = useMemo(() => {
    const stateTotals: { [key: string]: { revenue: number; bookings: number } } = {};
    
    // Initialisiere alle Bundesländer mit 0
    Object.keys(plzRanges).forEach(state => {
      stateTotals[state] = { revenue: 0, bookings: 0 };
    });

    // Summiere die Buchungen nach Bundesland
    bookings.forEach(booking => {
      if (!booking.plz) return;
      
      // Stelle sicher, dass die PLZ immer 5 Stellen hat
      const plz = booking.plz.toString().padStart(5, '0');
      const state = getStateFromPlz(plz);
      
      if (state && stateTotals[state]) {
        stateTotals[state].revenue += booking.revenue || 0;
        stateTotals[state].bookings += 1;
      }
    });

    // Finde den höchsten Umsatz für die Farbskalierung
    const maxValue = Math.max(...Object.values(stateTotals).map(data => data.revenue));

    return { stateData: stateTotals, maxValue };
  }, [bookings]);

  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  return (
    <div className="w-full h-[600px] bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-4">Umsatz nach Bundesland</h2>
      <div style={{ width: '100%', height: '500px', position: 'relative' }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            center: [10.4515, 51.1657],
            scale: 3000
          }}
          style={{
            width: '100%',
            height: '100%'
          }}
        >
          <ZoomableGroup center={[10.4515, 51.1657]} zoom={1}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const stateCode = geo.properties.NAME_1?.substring(0, 2).toUpperCase();
                  const data = stateData[stateCode];
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={(e) => {
                        const { clientX, clientY } = e;
                        setTooltipPosition({ x: clientX, y: clientY });
                        setTooltipContent(
                          `${geo.properties.NAME_1}<br/>` +
                          `Umsatz: ${new Intl.NumberFormat('de-DE', {
                            style: 'currency',
                            currency: 'EUR'
                          }).format(data?.revenue || 0)}<br/>` +
                          `Buchungen: ${data?.bookings || 0}`
                        );
                      }}
                      onMouseLeave={() => {
                        setTooltipContent("");
                      }}
                      style={{
                        default: {
                          fill: data ? getColorScale(data.revenue, maxValue) : "#E4E4E4",
                          stroke: "#FFFFFF",
                          strokeWidth: 0.5,
                          outline: "none"
                        },
                        hover: {
                          fill: data ? getColorScale(data.revenue, maxValue) : "#E4E4E4",
                          stroke: "#FFFFFF",
                          strokeWidth: 1,
                          outline: "none",
                          cursor: "pointer"
                        },
                        pressed: {
                          fill: "#E4E4E4",
                          outline: "none"
                        }
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
        {tooltipContent && (
          <div
            className="absolute bg-white p-2 rounded shadow-lg pointer-events-none z-10"
            style={{
              left: tooltipPosition.x + 10,
              top: tooltipPosition.y - 10,
              transform: 'translate(-50%, -100%)'
            }}
            dangerouslySetInnerHTML={{ __html: tooltipContent }}
          />
        )}
      </div>
    </div>
  );
}
