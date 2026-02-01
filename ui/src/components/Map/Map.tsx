import { useRef, useEffect, useCallback } from 'react';
import maplibregl, { type Map as MapLibreMap, type MapMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createUseStyles } from 'react-jss';
import type { PathTheme } from '../../utils/theme.js';
import { useAppSelector, useAppDispatch } from '../../hooks/index.js';
import { fishingTripSelectors, fishingTripActions } from '../../slices/fishingTripSlice.js';
import type { FishingTrip } from '@ff/common/schemas/fishingTripSchema.js';

const useStyles = createUseStyles<string, object, PathTheme>((theme) => ({
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  clickHint: {
    position: 'absolute',
    top: theme.spacing.md,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: theme.colors.background.secondary,
    color: theme.colors.text.secondary,
    padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.fontSize.sm,
    border: `1px solid ${theme.colors.border.primary}`,
    zIndex: 1,
    pointerEvents: 'none',
  },
}));

interface MapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  onMapClick?: (lng: number, lat: number) => void;
}

// Free OpenStreetMap-based style (no API key required)
const STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Map({
  initialCenter = [-105.0, 39.5],
  initialZoom = 7,
  onMapClick,
}: MapProps) {
  const classes = useStyles();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<globalThis.Map<string, maplibregl.Marker>>(new globalThis.Map());

  const dispatch = useAppDispatch();
  const trips = useAppSelector(fishingTripSelectors.selectItemsArray);
  const selectedId = useAppSelector(fishingTripSelectors.selectSelectedId);

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      // Open form with clicked coordinates
      dispatch(fishingTripActions.openForm({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
      onMapClick?.(e.lngLat.lng, e.lngLat.lat);
    },
    [onMapClick, dispatch]
  );

  const handleTripClick = useCallback(
    (tripId: string) => {
      dispatch(fishingTripActions.setSelectedId(tripId));
    },
    [dispatch]
  );

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: STYLE_URL,
      center: initialCenter,
      zoom: initialZoom,
    });

    map.addControl(new maplibregl.NavigationControl({}), 'top-right');
    map.addControl(new maplibregl.ScaleControl({}), 'bottom-right');

    map.on('click', handleMapClick);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [initialCenter, initialZoom, handleMapClick]);

  // Update markers when trips change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentMarkers = markersRef.current;
    const tripIds = new Set(trips.map((t) => t.id));

    // Remove markers for deleted trips
    currentMarkers.forEach((marker, id) => {
      if (!tripIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    });

    // Add or update markers for current trips
    trips.forEach((trip: FishingTrip) => {
      let marker = currentMarkers.get(trip.id);

      if (!marker) {
        // Create fish-themed marker
        const el = document.createElement('div');
        el.className = 'fishing-trip-marker';
        el.innerHTML = '🐟';
        el.style.cssText = `
          font-size: 24px;
          cursor: pointer;
          transition: transform 0.2s ease;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        `;
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.3)';
        });
        el.addEventListener('mouseleave', () => {
          if (trip.id !== selectedId) {
            el.style.transform = 'scale(1)';
          }
        });
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          handleTripClick(trip.id);
        });

        // Create popup with trip info
        const popupContent = `
          <div style="padding: 8px; min-width: 150px; color: #1A2B33;">
            <div style="font-weight: 600; margin-bottom: 4px;">${trip.locationName}</div>
            <div style="font-size: 12px; color: #4A5D68; margin-bottom: 4px;">${formatDate(trip.date)}</div>
            <div style="display: flex; gap: 8px; font-size: 12px; color: #4A5D68;">
              <span>🐟 ${trip.catchCount ?? 0} fish</span>
              ${trip.weather ? `<span>| ${trip.weather}</span>` : ''}
            </div>
            ${trip.notes ? `<div style="font-size: 11px; color: #7A8D98; margin-top: 4px; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${trip.notes}</div>` : ''}
          </div>
        `;

        marker = new maplibregl.Marker({ element: el })
          .setLngLat([trip.longitude, trip.latitude])
          .setPopup(
            new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(popupContent)
          )
          .addTo(map);

        currentMarkers.set(trip.id, marker);
      } else {
        marker.setLngLat([trip.longitude, trip.latitude]);
      }
    });
  }, [trips, handleTripClick, selectedId]);

  // Highlight selected marker and fly to it
  useEffect(() => {
    const map = mapRef.current;
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      if (id === selectedId) {
        el.style.transform = 'scale(1.5)';
        el.style.zIndex = '100';
        // Fly to selected trip
        if (map) {
          const trip = trips.find((t) => t.id === id);
          if (trip) {
            map.flyTo({
              center: [trip.longitude, trip.latitude],
              zoom: Math.max(map.getZoom(), 10),
              duration: 1000,
            });
          }
        }
      } else {
        el.style.transform = 'scale(1)';
        el.style.zIndex = '1';
      }
    });
  }, [selectedId, trips]);

  return (
    <div className={classes['container']}>
      <div ref={mapContainerRef} className={classes['map']} />
      <div className={classes['clickHint']}>Click anywhere on the map to add a new fishing trip</div>
    </div>
  );
}
