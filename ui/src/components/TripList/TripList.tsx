import { useEffect, useState } from 'react';
import { createUseStyles } from 'react-jss';
import type { PathTheme } from '../../utils/theme.js';
import { useAppSelector, useAppDispatch } from '../../hooks/index.js';
import { fishingTripSelectors, fishingTripActions } from '../../slices/fishingTripSlice.js';
import { trpc } from '../../trpc.js';
import type { FishingTrip } from '@ff/common/schemas/fishingTripSchema.js';

const useStyles = createUseStyles<string, object, PathTheme>((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: theme.colors.background.secondary,
    borderRight: `1px solid ${theme.colors.border.primary}`,
  },
  header: {
    padding: theme.spacing.md,
    borderBottom: `1px solid ${theme.colors.border.primary}`,
    backgroundColor: theme.colors.background.tertiary,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.lg,
    fontWeight: 600,
    margin: 0,
  },
  addButton: {
    backgroundColor: theme.colors.accent.primary,
    color: '#fff',
    border: 'none',
    borderRadius: theme.borderRadius.md,
    padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
    fontSize: theme.fontSize.sm,
    fontWeight: 500,
    cursor: 'pointer',
    transition: `all ${theme.transitions.fast}`,
    '&:hover': {
      backgroundColor: theme.colors.accent.secondary,
    },
  },
  list: {
    flex: 1,
    overflow: 'auto',
    padding: theme.spacing.sm,
  },
  locationGroup: {
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    border: `1px solid transparent`,
    overflow: 'hidden',
    transition: `all ${theme.transitions.fast}`,
  },
  locationHeader: {
    padding: theme.spacing.md,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    '&:hover': {
      backgroundColor: theme.colors.background.primary,
    },
  },
  expandIcon: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.muted,
    transition: `transform ${theme.transitions.fast}`,
    width: 16,
  },
  expandIconOpen: {
    transform: 'rotate(90deg)',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.md,
    fontWeight: 500,
    marginBottom: theme.spacing.xs,
  },
  locationStats: {
    display: 'flex',
    gap: theme.spacing.md,
    color: theme.colors.text.muted,
    fontSize: theme.fontSize.sm,
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  tripsList: {
    borderTop: `1px solid ${theme.colors.border.primary}`,
    backgroundColor: theme.colors.background.primary,
  },
  tripItem: {
    padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
    paddingLeft: theme.spacing.xl,
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `1px solid ${theme.colors.border.primary}`,
    transition: `all ${theme.transitions.fast}`,
    '&:hover': {
      backgroundColor: theme.colors.background.tertiary,
    },
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  tripItemSelected: {
    backgroundColor: theme.colors.background.tertiary,
    borderLeft: `3px solid ${theme.colors.accent.primary}`,
  },
  tripDate: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.sm,
  },
  tripCatch: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSize.sm,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    color: theme.colors.text.muted,
  },
  error: {
    padding: theme.spacing.md,
    color: theme.colors.status.error,
    textAlign: 'center',
  },
  empty: {
    padding: theme.spacing.xl,
    textAlign: 'center',
    color: theme.colors.text.muted,
  },
}));

// API returns dates as strings
interface FishingTripApiResponse {
  id: string;
  date: string;
  locationName: string;
  latitude: number;
  longitude: number;
  waterConditions: 'clear' | 'murky' | 'stained' | 'muddy' | null;
  weather: 'sunny' | 'cloudy' | 'overcast' | 'rainy' | 'stormy' | null;
  notes: string | null;
  catchCount: number | null;
  createdAt: string;
  updatedAt: string;
}

interface LocationGroup {
  locationName: string;
  trips: FishingTrip[];
  totalTrips: number;
  totalFish: number;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupTripsByLocation(trips: FishingTrip[]): LocationGroup[] {
  const groups = new globalThis.Map<string, FishingTrip[]>();

  for (const trip of trips) {
    const existing = groups.get(trip.locationName) || [];
    existing.push(trip);
    groups.set(trip.locationName, existing);
  }

  return Array.from(groups.entries()).map(([locationName, locationTrips]) => ({
    locationName,
    trips: locationTrips.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    totalTrips: locationTrips.length,
    totalFish: locationTrips.reduce((sum, t) => sum + (t.catchCount ?? 0), 0),
  })).sort((a, b) => {
    // Sort by most recent trip date
    const aLatest = new Date(a.trips[0]?.date ?? 0).getTime();
    const bLatest = new Date(b.trips[0]?.date ?? 0).getTime();
    return bLatest - aLatest;
  });
}

export default function TripList() {
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const trips = useAppSelector(fishingTripSelectors.selectItemsArray);
  const selectedId = useAppSelector(fishingTripSelectors.selectSelectedId);
  const loading = useAppSelector(fishingTripSelectors.selectLoading);
  const error = useAppSelector(fishingTripSelectors.selectError);

  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());

  const { data, isLoading, error: queryError } = trpc.fishingTrip.list.useQuery();

  useEffect(() => {
    dispatch(fishingTripActions.setLoading(isLoading));
  }, [isLoading, dispatch]);

  useEffect(() => {
    if (queryError) {
      dispatch(fishingTripActions.setError(queryError.message));
    }
  }, [queryError, dispatch]);

  useEffect(() => {
    if (data) {
      const tripsWithDates = (data as FishingTripApiResponse[]).map((trip) => ({
        ...trip,
        date: new Date(trip.date),
        createdAt: new Date(trip.createdAt),
        updatedAt: new Date(trip.updatedAt),
      }));
      dispatch(fishingTripActions.setItems(tripsWithDates));
    }
  }, [data, dispatch]);

  const toggleLocation = (locationName: string) => {
    setExpandedLocations((prev) => {
      const next = new Set(prev);
      if (next.has(locationName)) {
        next.delete(locationName);
      } else {
        next.add(locationName);
      }
      return next;
    });
  };

  const handleTripClick = (trip: FishingTrip) => {
    dispatch(fishingTripActions.setSelectedId(trip.id));
  };

  const handleNewTrip = () => {
    dispatch(fishingTripActions.openForm());
  };

  const locationGroups = groupTripsByLocation(trips);
  const totalTrips = trips.length;

  if (loading) {
    return (
      <div className={classes['container']}>
        <div className={classes['header']}>
          <h2 className={classes['title']}>Fishing Spots</h2>
        </div>
        <div className={classes['loading']}>Loading trips...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes['container']}>
        <div className={classes['header']}>
          <h2 className={classes['title']}>Fishing Spots</h2>
        </div>
        <div className={classes['error']}>{error}</div>
      </div>
    );
  }

  return (
    <div className={classes['container']}>
      <div className={classes['header']}>
        <h2 className={classes['title']}>
          {locationGroups.length} Spot{locationGroups.length !== 1 ? 's' : ''} · {totalTrips} Trip{totalTrips !== 1 ? 's' : ''}
        </h2>
        <button className={classes['addButton']} onClick={handleNewTrip}>
          + New Trip
        </button>
      </div>
      <div className={classes['list']}>
        {locationGroups.length === 0 ? (
          <div className={classes['empty']}>No fishing trips yet. Click "New Trip" or click on a body of water on the map!</div>
        ) : (
          locationGroups.map((group) => {
            const isExpanded = expandedLocations.has(group.locationName);
            return (
              <div key={group.locationName} className={classes['locationGroup']}>
                <div
                  className={classes['locationHeader']}
                  onClick={() => toggleLocation(group.locationName)}
                >
                  <span className={`${classes['expandIcon']} ${isExpanded ? classes['expandIconOpen'] : ''}`}>
                    ▶
                  </span>
                  <div className={classes['locationInfo']}>
                    <div className={classes['locationName']}>{group.locationName}</div>
                    <div className={classes['locationStats']}>
                      <span className={classes['stat']}>
                        🎣 {group.totalTrips} trip{group.totalTrips !== 1 ? 's' : ''}
                      </span>
                      <span className={classes['stat']}>
                        🐟 {group.totalFish} fish
                      </span>
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <div className={classes['tripsList']}>
                    {group.trips.map((trip) => (
                      <div
                        key={trip.id}
                        className={`${classes['tripItem']} ${selectedId === trip.id ? classes['tripItemSelected'] : ''}`}
                        onClick={() => handleTripClick(trip)}
                      >
                        <span className={classes['tripDate']}>{formatDate(trip.date)}</span>
                        <span className={classes['tripCatch']}>
                          🐟 {trip.catchCount ?? 0}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
