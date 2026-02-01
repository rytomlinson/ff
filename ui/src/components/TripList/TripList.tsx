import { useEffect } from 'react';
import { createUseStyles } from 'react-jss';
import type { PathTheme } from '../../utils/theme.js';
import { useAppSelector, useAppDispatch } from '../../hooks/index.js';
import { fishingTripSelectors, fishingTripActions } from '../../slices/fishingTripSlice.js';
import { trpc } from '../../trpc.js';
import type { FishingTrip } from '@ff/common/schemas/fishingTripSchema.js';

// API returns dates as strings, not Date objects
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
    color: theme.colors.text.primary,
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
  item: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    transition: `all ${theme.transitions.fast}`,
    border: `1px solid transparent`,
    '&:hover': {
      borderColor: theme.colors.border.secondary,
    },
  },
  itemSelected: {
    borderColor: theme.colors.accent.primary,
    backgroundColor: theme.colors.background.primary,
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  itemIcon: {
    fontSize: theme.fontSize.lg,
  },
  itemDate: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.md,
    fontWeight: 500,
  },
  itemLocation: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.sm,
  },
  itemMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catchCount: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.xs,
    color: theme.colors.text.muted,
    fontSize: theme.fontSize.sm,
  },
  catchIcon: {
    fontSize: theme.fontSize.md,
  },
  weatherBadge: {
    padding: `${theme.spacing.xs / 2}px ${theme.spacing.sm}px`,
    borderRadius: theme.borderRadius.sm,
    fontSize: theme.fontSize.xs,
    fontWeight: 500,
    textTransform: 'capitalize',
    backgroundColor: `${theme.colors.accent.primary}22`,
    color: theme.colors.accent.primary,
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

interface TripListProps {
  onTripSelect?: (trip: FishingTrip) => void;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TripList({ onTripSelect }: TripListProps) {
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const trips = useAppSelector(fishingTripSelectors.selectItemsArray);
  const selectedId = useAppSelector(fishingTripSelectors.selectSelectedId);
  const loading = useAppSelector(fishingTripSelectors.selectLoading);
  const error = useAppSelector(fishingTripSelectors.selectError);

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
      // Convert date strings to Date objects
      const tripsWithDates = (data as FishingTripApiResponse[]).map((trip) => ({
        ...trip,
        date: new Date(trip.date),
        createdAt: new Date(trip.createdAt),
        updatedAt: new Date(trip.updatedAt),
      }));
      dispatch(fishingTripActions.setItems(tripsWithDates));
    }
  }, [data, dispatch]);

  const handleItemClick = (trip: FishingTrip) => {
    dispatch(fishingTripActions.setSelectedId(trip.id));
    onTripSelect?.(trip);
  };

  const handleNewTrip = () => {
    dispatch(fishingTripActions.openForm());
  };

  if (loading) {
    return (
      <div className={classes['container']}>
        <div className={classes['header']}>
          <h2 className={classes['title']}>Fishing Trips</h2>
        </div>
        <div className={classes['loading']}>Loading trips...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes['container']}>
        <div className={classes['header']}>
          <h2 className={classes['title']}>Fishing Trips</h2>
        </div>
        <div className={classes['error']}>{error}</div>
      </div>
    );
  }

  return (
    <div className={classes['container']}>
      <div className={classes['header']}>
        <h2 className={classes['title']}>Trips ({trips.length})</h2>
        <button className={classes['addButton']} onClick={handleNewTrip}>
          + New Trip
        </button>
      </div>
      <div className={classes['list']}>
        {trips.length === 0 ? (
          <div className={classes['empty']}>No fishing trips yet. Click "New Trip" to add one!</div>
        ) : (
          trips.map((trip) => (
            <div
              key={trip.id}
              className={`${classes['item']} ${
                selectedId === trip.id ? classes['itemSelected'] : ''
              }`}
              onClick={() => handleItemClick(trip)}
            >
              <div className={classes['itemHeader']}>
                <span className={classes['itemIcon']}>🎣</span>
                <span className={classes['itemDate']}>{formatDate(trip.date)}</span>
              </div>
              <div className={classes['itemLocation']}>{trip.locationName}</div>
              <div className={classes['itemMeta']}>
                <span className={classes['catchCount']}>
                  <span className={classes['catchIcon']}>🐟</span>
                  {trip.catchCount ?? 0} fish
                </span>
                {trip.weather && (
                  <span className={classes['weatherBadge']}>{trip.weather}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
