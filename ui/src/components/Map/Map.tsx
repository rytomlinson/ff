import { useRef, useEffect, useCallback } from 'react';
import maplibregl, { type Map as MapLibreMap, type MapMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createUseStyles } from 'react-jss';
import type { PathTheme } from '../../utils/theme.js';
import { useAppSelector, useAppDispatch } from '../../hooks/index.js';
import { projectSelectors, projectActions } from '../../slices/projectSlice.js';
import type { Project } from '@ff/common/schemas/projectSchema.js';

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
  coordinates: {
    position: 'absolute',
    bottom: theme.spacing.md,
    left: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    color: theme.colors.text.secondary,
    padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
    borderRadius: theme.borderRadius.sm,
    fontSize: theme.fontSize.xs,
    fontFamily: 'monospace',
    border: `1px solid ${theme.colors.border.primary}`,
    zIndex: 1,
  },
}));

interface MapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  onMapClick?: (lng: number, lat: number) => void;
}

const MAPTILER_KEY = 'get_your_own_key'; // Replace with your MapTiler key
const STYLE_URL = `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_KEY}`;

export default function Map({
  initialCenter = [-122.4194, 37.7749],
  initialZoom = 10,
  onMapClick,
}: MapProps) {
  const classes = useStyles();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  const dispatch = useAppDispatch();
  const projects = useAppSelector(projectSelectors.selectItemsArray);
  const selectedId = useAppSelector(projectSelectors.selectSelectedId);

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      onMapClick?.(e.lngLat.lng, e.lngLat.lat);
    },
    [onMapClick]
  );

  const handleProjectClick = useCallback(
    (projectId: string) => {
      dispatch(projectActions.setSelectedId(projectId));
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

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl(), 'bottom-right');

    map.on('click', handleMapClick);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [initialCenter, initialZoom, handleMapClick]);

  // Update markers when projects change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentMarkers = markersRef.current;
    const projectIds = new Set(projects.map((p) => p.id));

    // Remove markers for deleted projects
    currentMarkers.forEach((marker, id) => {
      if (!projectIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    });

    // Add or update markers for current projects
    projects.forEach((project: Project) => {
      let marker = currentMarkers.get(project.id);

      if (!marker) {
        const el = document.createElement('div');
        el.className = 'project-marker';
        el.style.cssText = `
          width: 20px;
          height: 20px;
          background-color: #FF6B00;
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.2s ease;
        `;
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
        });
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          handleProjectClick(project.id);
        });

        marker = new maplibregl.Marker({ element: el })
          .setLngLat([project.longitude, project.latitude])
          .setPopup(
            new maplibregl.Popup({ offset: 25 }).setHTML(
              `<strong>${project.name}</strong><br/>${project.description ?? ''}`
            )
          )
          .addTo(map);

        currentMarkers.set(project.id, marker);
      } else {
        marker.setLngLat([project.longitude, project.latitude]);
      }
    });
  }, [projects, handleProjectClick]);

  // Highlight selected marker
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      if (id === selectedId) {
        el.style.backgroundColor = '#FFFFFF';
        el.style.borderColor = '#FF6B00';
        el.style.transform = 'scale(1.3)';
      } else {
        el.style.backgroundColor = '#FF6B00';
        el.style.borderColor = 'white';
        el.style.transform = 'scale(1)';
      }
    });
  }, [selectedId]);

  return (
    <div className={classes.container}>
      <div ref={mapContainerRef} className={classes.map} />
    </div>
  );
}
