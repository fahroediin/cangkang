import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMapEvents, useMap, Tooltip } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import { Depot } from '../types.ts';

interface MapPickerProps {
  initialLat: number | null;
  initialLng: number | null;
  depots: Depot[];
  onLocationChange: (lat: number, lng: number) => void;
}

// Banten default center (near Cilegon/Serang)
const DEFAULT_CENTER: [number, number] = [-6.05, 106.05];
const DEFAULT_ZOOM = 11;

// Inner component to handle map clicks & center updates
const MapEventsHandler: React.FC<{
  onSelect: (lat: number, lng: number) => void;
}> = ({ onSelect }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const MapPicker: React.FC<MapPickerProps> = ({
  initialLat,
  initialLng,
  depots,
  onLocationChange,
}) => {
  const [pinPosition, setPinPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    initialLat && initialLng ? [initialLat, initialLng] : DEFAULT_CENTER
  );
  const [zoomLevel, setZoomLevel] = useState<number>(initialLat ? 15 : DEFAULT_ZOOM);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);

  const handleSelectLocation = (lat: number, lng: number) => {
    setPinPosition([lat, lng]);
    onLocationChange(lat, lng);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGpsNotice('Izin lokasi ditolak. Ketuk peta di titik rumah Anda.');
      return;
    }

    setGpsLoading(true);
    setGpsNotice(null);

    let hasTimedOut = false;
    const timer = setTimeout(() => {
      hasTimedOut = true;
      setGpsLoading(false);
      setGpsNotice('Lokasi belum ketemu. Ketuk peta di titik rumah Anda.');
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (hasTimedOut) return;
        clearTimeout(timer);
        setGpsLoading(false);

        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);

        setPinPosition([lat, lng]);
        setMapCenter([lat, lng]);
        setZoomLevel(16);
        onLocationChange(lat, lng);

        if (accuracy > 100) {
          setGpsNotice(`Lokasi kurang akurat (sekitar ${accuracy} m). Periksa posisi pin.`);
        } else {
          setGpsNotice(null);
        }
      },
      (err) => {
        if (hasTimedOut) return;
        clearTimeout(timer);
        setGpsLoading(false);
        setGpsNotice('Izin lokasi ditolak. Ketuk peta di titik rumah Anda.');
      },
      { enableHighAccuracy: true, timeout: 9500 }
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">Titik antar di peta</span>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={gpsLoading}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-edge text-xs font-semibold text-ink hover:bg-cream transition-colors"
        >
          <MapPin className="w-4 h-4 text-brand" />
          {gpsLoading ? 'Mencari lokasi...' : 'Pakai lokasi saya'}
        </button>
      </div>

      {gpsNotice && (
        <div className="text-xs text-muted bg-soft p-2 rounded-lg border border-line">
          {gpsNotice}
        </div>
      )}

      <div className="relative w-full h-64 rounded-lg border border-line overflow-hidden bg-gray">
        <MapContainer
          center={mapCenter}
          zoom={zoomLevel}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <MapController center={mapCenter} zoom={zoomLevel} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEventsHandler onSelect={handleSelectLocation} />

          {/* Depot markers: radius 7, fill surface #FFF, stroke brand #704529 2px */}
          {depots.map((depot) => (
            <CircleMarker
              key={depot.id}
              center={[depot.lat, depot.lng]}
              radius={7}
              pathOptions={{
                fillColor: '#FFFFFF',
                fillOpacity: 1,
                color: '#704529',
                weight: 2,
              }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={0.9} permanent={false}>
                <span className="text-xs font-semibold">{depot.name}</span>
              </Tooltip>
            </CircleMarker>
          ))}

          {/* User destination pin: radius 10, fill brand #704529, stroke white 3px */}
          {pinPosition && (
            <CircleMarker
              center={pinPosition}
              radius={10}
              pathOptions={{
                fillColor: '#704529',
                fillOpacity: 1,
                color: '#FFFFFF',
                weight: 3,
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} permanent>
                <span className="text-xs font-semibold">Rumah Anda</span>
              </Tooltip>
            </CircleMarker>
          )}
        </MapContainer>
      </div>
      <p className="text-xs text-muted">
        Ketuk peta di titik rumah Anda.
      </p>
    </div>
  );
};
