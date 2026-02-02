import { useRef, useEffect, useCallback, useState } from 'react';
import maplibregl, { type Map as MapLibreMap, type MapMouseEvent, type MapGeoJSONFeature } from 'maplibre-gl';
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
  waterName: {
    position: 'absolute',
    bottom: theme.spacing.md,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: theme.colors.accent.primary,
    color: '#fff',
    padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.fontSize.md,
    fontWeight: 500,
    zIndex: 1,
    pointerEvents: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
}));

interface MapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  onMapClick?: (lng: number, lat: number) => void;
}

// Free OpenStreetMap-based style (no API key required)
const STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

// Water layer IDs in Carto Positron style
const WATER_LAYERS = ['water', 'waterway'];

// Highlight color for water features
const WATER_HIGHLIGHT_COLOR = '#4A7C8A';
const WATER_HOVER_COLOR = '#5FA3B5';

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getWaterFeatureName(feature: MapGeoJSONFeature): string | null {
  const props = feature.properties;
  if (!props) return null;

  // Try various name properties that might exist
  return props['name'] || props['name_en'] || props['water'] || props['waterway'] || null;
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
  const hoveredFeatureRef = useRef<string | number | null>(null);

  const [hoveredWaterName, setHoveredWaterName] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const trips = useAppSelector(fishingTripSelectors.selectItemsArray);
  const selectedId = useAppSelector(fishingTripSelectors.selectSelectedId);

  const handleWaterClick = useCallback(
    (e: MapMouseEvent) => {
      const map = mapRef.current;
      if (!map) return;

      // Query for water features at click point
      const features = map.queryRenderedFeatures(e.point, { layers: WATER_LAYERS });

      if (features.length > 0) {
        const feature = features[0];
        const waterName = getWaterFeatureName(feature) || 'Unknown Water';

        // Open form with clicked coordinates and water name
        dispatch(fishingTripActions.openForm({
          lat: e.lngLat.lat,
          lng: e.lngLat.lng,
          locationName: waterName,
        }));
        onMapClick?.(e.lngLat.lng, e.lngLat.lat);
      }
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

    // Wait for style to load before adding water interactivity
    map.on('load', () => {
      // Add a highlight layer for water on hover
      map.addSource('water-highlight', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'water-highlight-fill',
        type: 'fill',
        source: 'water-highlight',
        paint: {
          'fill-color': WATER_HOVER_COLOR,
          'fill-opacity': 0.4,
        },
      });

      map.addLayer({
        id: 'water-highlight-line',
        type: 'line',
        source: 'water-highlight',
        paint: {
          'line-color': WATER_HIGHLIGHT_COLOR,
          'line-width': 2,
        },
      });

      // Handle mouse move over water features
      const handleMouseMove = (e: MapMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, { layers: WATER_LAYERS });
        const feature = features[0];

        if (feature) {
          map.getCanvas().style.cursor = 'pointer';

          const featureId = feature.id ?? JSON.stringify(feature.geometry).slice(0, 50);

          // Only update if we're hovering over a different feature
          if (hoveredFeatureRef.current !== featureId) {
            hoveredFeatureRef.current = featureId;

            // Update highlight
            const source = map.getSource('water-highlight') as maplibregl.GeoJSONSource | undefined;
            if (source) {
              source.setData({
                type: 'FeatureCollection',
                features: [feature as unknown as GeoJSON.Feature],
              });
            }

            // Update water name display
            const name = getWaterFeatureName(feature);
            setHoveredWaterName(name);
          }
        } else {
          map.getCanvas().style.cursor = '';
          hoveredFeatureRef.current = null;

          // Clear highlight
          const source = map.getSource('water-highlight') as maplibregl.GeoJSONSource | undefined;
          if (source) {
            source.setData({ type: 'FeatureCollection', features: [] });
          }

          setHoveredWaterName(null);
        }
      };

      map.on('mousemove', handleMouseMove);
      map.on('click', handleWaterClick);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [initialCenter, initialZoom, handleWaterClick]);

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
      <div className={classes['clickHint']}>
        Click on a lake, river, or stream to log a fishing trip
      </div>
      {hoveredWaterName && (
        <div className={classes['waterName']}>{hoveredWaterName}</div>
      )}
    </div>
  );
}
