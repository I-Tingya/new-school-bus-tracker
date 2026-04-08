'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GoogleMap,
  Marker,
  Polyline,
  InfoWindow,
  useJsApiLoader
} from '@react-google-maps/api';
import { BusMarker } from 'shared-types';
import {
  GOOGLE_MAPS_API_KEY,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  BUS_MARKER_ICON
} from '../config/maps';

interface LiveMapProps {
  buses: BusMarker[];
  selectedBusId?: string;
  onBusSelect?: (busId: string) => void;
}

interface SelectedMarker {
  type: 'bus';
  id: string;
  data: BusMarker;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  buses,
  selectedBusId,
  onBusSelect
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['geometry', 'drawing', 'places']
  });

  const mapRef = useRef<GoogleMap>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<SelectedMarker | null>(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_MAP_CENTER);
  const [userInteracted, setUserInteracted] = useState(false);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle user map interactions
  const handleUserInteraction = useCallback(() => {
    setUserInteracted(true);
    // Clear existing timeout
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
    // Reset auto-zoom capability after 15 seconds
    interactionTimeoutRef.current = setTimeout(() => {
      setUserInteracted(false);
    }, 15000);
  }, []);

  // Calculate map bounds based on bus markers with 10km buffer
  const updateMapBounds = useCallback(() => {
    if (!map || buses.length === 0 || userInteracted) return;

    // Calculate center of all buses
    const totalLat = buses.reduce((sum, bus) => sum + bus.latitude, 0);
    const totalLng = buses.reduce((sum, bus) => sum + bus.longitude, 0);
    const centerLat = totalLat / buses.length;
    const centerLng = totalLng / buses.length;

    // 10km ≈ 0.09 degrees latitude (since 1° lat ≈ 111km)
    // For longitude, adjust by cosine of latitude for more accurate distance
    const latBuffer = 0.09; // ~10km
    const lngBuffer = latBuffer / Math.cos(centerLat * Math.PI / 180); // Adjust for latitude

    const bounds = new google.maps.LatLngBounds(
      { lat: centerLat - latBuffer, lng: centerLng - lngBuffer },
      { lat: centerLat + latBuffer, lng: centerLng + lngBuffer }
    );

    map.fitBounds(bounds);
  }, [buses, map, userInteracted]);

  // Update bounds when map loads or data changes (but respect user interaction)
  useEffect(() => {
    updateMapBounds();
  }, [updateMapBounds]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, []);

  // Auto-center on selected bus
  useEffect(() => {
    if (selectedBusId && mapRef.current) {
      const bus = buses.find(b => b.busId === selectedBusId);
      if (bus) {
        setMapCenter({ lat: bus.latitude, lng: bus.longitude });
      }
    }
  }, [selectedBusId, buses]);

  // Format bus info window content
  const formatBusInfo = (bus: BusMarker) => (
    <div style={{ fontSize: '12px', minWidth: '200px' }}>
      <strong>Bus #{bus.busNumber}</strong>
      <div>Driver ID: {bus.driverId}</div>
      <div>Position: {bus.latitude.toFixed(4)}, {bus.longitude.toFixed(4)}</div>
      <div>Last Seen: {new Date(bus.timestamp).toLocaleTimeString()}</div>
    </div>
  );

  if (loadError) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        Error loading Google Maps. Please check your API key in .env.local
      </div>
    );
  }

  if (!isLoaded) {
    return <div style={{ padding: '20px' }}>Loading maps...</div>;
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px' }}>
      <GoogleMap
        ref={mapRef}
        zoom={DEFAULT_MAP_ZOOM}
        center={mapCenter}
        mapContainerStyle={{ width: '100%', height: '100%' }}
        options={{
          mapTypeControl: true,
          zoomControl: true,
          fullscreenControl: true,
          streetViewControl: false
        }}
        onLoad={(mapInstance) => setMap(mapInstance)}
        onZoomChanged={handleUserInteraction}
        onDragEnd={handleUserInteraction}
      >
        {/* Bus Markers */}
        {buses.map(bus => (
          <Marker
            key={`bus-${bus.busId}`}
            position={{ lat: bus.latitude, lng: bus.longitude }}
            icon={{
              ...BUS_MARKER_ICON,
              fillColor: selectedBusId === bus.busId ? '#FF5722' : '#FFA726'
            }}
            title={`Bus #${bus.busNumber}`}
            onClick={() => {
              setSelectedMarker({ type: 'bus', id: bus.busId, data: bus });
              onBusSelect?.(bus.busId);
            }}
          >
            {selectedMarker?.type === 'bus' && selectedMarker?.id === bus.busId && (
              <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                {formatBusInfo(bus) as any}
              </InfoWindow>
            )}
          </Marker>
        ))}
      </GoogleMap>

      {/* Bottom Right Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'white',
          padding: '10px 15px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          fontSize: '12px',
          maxWidth: '200px'
        }}
      >
        <div><strong>Legend:</strong></div>
        <div>🔶 Active Bus (Orange)</div>
        <div style={{ marginTop: '10px' }}>
          <strong>Active Buses:</strong> {buses.length}
        </div>
      </div>
    </div>
  );
};
