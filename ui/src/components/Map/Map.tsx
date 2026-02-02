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
  initialCenter = [-120.79501231792234, 44.11295410711017],
  initialZoom = 7,
  onMapClick,
}: MapProps) {
  const classes = useStyles();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<globalThis.Map<string, maplibregl.Marker>>(new globalThis.Map());

  // Use refs for callbacks to avoid re-initializing the map
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  const [hoveredWaterName, setHoveredWaterName] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const trips = useAppSelector(fishingTripSelectors.selectItemsArray);
  const selectedId = useAppSelector(fishingTripSelectors.selectSelectedId);

  const handleTripClick = useCallback(
    (tripId: string) => {
      dispatch(fishingTripActions.setSelectedId(tripId));
    },
    [dispatch]
  );

  // Initialize map - only run once
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
      // Add highlight layers for water on hover
      // Polygon source for lakes/water bodies
      map.addSource('water-highlight-polygon', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Line source for rivers/streams
      map.addSource('water-highlight-line', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Fill layer for polygon water bodies
      map.addLayer({
        id: 'water-highlight-fill',
        type: 'fill',
        source: 'water-highlight-polygon',
        paint: {
          'fill-color': WATER_HOVER_COLOR,
          'fill-opacity': 0.4,
        },
      });

      // Outline for polygon water bodies
      map.addLayer({
        id: 'water-highlight-polygon-outline',
        type: 'line',
        source: 'water-highlight-polygon',
        paint: {
          'line-color': WATER_HIGHLIGHT_COLOR,
          'line-width': 2,
        },
      });

      // Thick line for rivers/streams
      map.addLayer({
        id: 'water-highlight-river',
        type: 'line',
        source: 'water-highlight-line',
        paint: {
          'line-color': WATER_HOVER_COLOR,
          'line-width': 6,
          'line-opacity': 0.7,
        },
      });

      // Handle mouse move over water features
      map.on('mousemove', (e: MapMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, { layers: WATER_LAYERS });
        const feature = features[0];

        const polygonSource = map.getSource('water-highlight-polygon') as maplibregl.GeoJSONSource | undefined;
        const lineSource = map.getSource('water-highlight-line') as maplibregl.GeoJSONSource | undefined;

        if (feature) {
          map.getCanvas().style.cursor = 'pointer';

          const geomType = feature.geometry.type;
          const isLine = geomType === 'LineString' || geomType === 'MultiLineString';
          const isPolygon = geomType === 'Polygon' || geomType === 'MultiPolygon';

          // Update appropriate highlight source based on geometry type
          if (isPolygon && polygonSource) {
            polygonSource.setData({
              type: 'FeatureCollection',
              features: [feature as unknown as GeoJSON.Feature],
            });
            lineSource?.setData({ type: 'FeatureCollection', features: [] });
          } else if (isLine && lineSource) {
            lineSource.setData({
              type: 'FeatureCollection',
              features: [feature as unknown as GeoJSON.Feature],
            });
            polygonSource?.setData({ type: 'FeatureCollection', features: [] });
          }

          // Update water name display
          const name = getWaterFeatureName(feature);
          setHoveredWaterName(name);
        } else {
          map.getCanvas().style.cursor = '';

          // Clear both highlights
          polygonSource?.setData({ type: 'FeatureCollection', features: [] });
          lineSource?.setData({ type: 'FeatureCollection', features: [] });

          setHoveredWaterName(null);
        }
      });

      // Handle click on water features
      map.on('click', (e: MapMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, { layers: WATER_LAYERS });

        if (features.length > 0) {
          const feature = features[0];
          if (feature) {
            const waterName = getWaterFeatureName(feature) || 'Unknown Water';

            // Open form with clicked coordinates and water name
            dispatch(fishingTripActions.openForm({
              lat: e.lngLat.lat,
              lng: e.lngLat.lng,
              locationName: waterName,
            }));
            onMapClickRef.current?.(e.lngLat.lng, e.lngLat.lat);
          }
        }
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only initialize once

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
        // Create fish-themed marker with inner element for animation
        // (MapLibre uses transform on outer element for positioning)
        const el = document.createElement('div');
        el.className = 'fishing-trip-marker';

        const inner = document.createElement('span');
        inner.innerHTML = '🐟';
        inner.style.cssText = `
          font-size: 24px;
          display: block;
          cursor: pointer;
          transition: transform 0.2s ease;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        `;
        el.appendChild(inner);

        el.addEventListener('mouseenter', () => {
          inner.style.transform = 'scale(1.3)';
        });
        el.addEventListener('mouseleave', () => {
          inner.style.transform = 'scale(1)';
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

  // Highlight selected marker (without flying - that was causing jumps)
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      const inner = el.querySelector('span') as HTMLElement | null;
      if (id === selectedId) {
        if (inner) inner.style.transform = 'scale(1.5)';
        el.style.zIndex = '100';
      } else {
        if (inner) inner.style.transform = 'scale(1)';
        el.style.zIndex = '1';
      }
    });
  }, [selectedId]);

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
