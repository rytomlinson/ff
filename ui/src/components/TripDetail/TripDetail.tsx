import { createUseStyles } from 'react-jss';
import type { PathTheme } from '../../utils/theme.js';
import { useAppSelector, useAppDispatch } from '../../hooks/index.js';
import { fishingTripSelectors, fishingTripActions } from '../../slices/fishingTripSlice.js';
import { trpc } from '../../trpc.js';

const useStyles = createUseStyles<string, object, PathTheme>((theme) => ({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 420,
    border: `1px solid ${theme.colors.border.primary}`,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.xl,
    fontWeight: 600,
    margin: 0,
  },
  date: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: theme.colors.text.muted,
    fontSize: theme.fontSize.xl,
    cursor: 'pointer',
    padding: theme.spacing.xs,
    '&:hover': {
      color: theme.colors.text.primary,
    },
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.md,
  },
  row: {
    display: 'flex',
    gap: theme.spacing.lg,
  },
  field: {
    flex: 1,
  },
  label: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: theme.spacing.xs,
  },
  value: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.md,
  },
  notes: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
  },
  coordinates: {
    fontFamily: 'monospace',
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.muted,
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTop: `1px solid ${theme.colors.border.primary}`,
  },
  deleteButton: {
    backgroundColor: theme.colors.status.error,
    color: '#fff',
    border: 'none',
    borderRadius: theme.borderRadius.md,
    padding: `${theme.spacing.sm}px ${theme.spacing.lg}px`,
    fontSize: theme.fontSize.md,
    fontWeight: 500,
    cursor: 'pointer',
    transition: `all ${theme.transitions.fast}`,
    '&:hover': {
      opacity: 0.9,
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  closeButtonSecondary: {
    backgroundColor: theme.colors.background.tertiary,
    color: theme.colors.text.secondary,
    border: 'none',
    borderRadius: theme.borderRadius.md,
    padding: `${theme.spacing.sm}px ${theme.spacing.lg}px`,
    fontSize: theme.fontSize.md,
    fontWeight: 500,
    cursor: 'pointer',
    transition: `all ${theme.transitions.fast}`,
    '&:hover': {
      backgroundColor: theme.colors.background.primary,
    },
  },
  catchCount: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.xs,
    fontSize: theme.fontSize.lg,
  },
}));

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function TripDetail() {
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const selectedTrip = useAppSelector(fishingTripSelectors.selectSelectedItem);

  const utils = trpc.useUtils();

  const deleteMutation = trpc.fishingTrip.delete.useMutation({
    onSuccess: () => {
      if (selectedTrip) {
        dispatch(fishingTripActions.deleteItem(selectedTrip.id));
      }
      dispatch(fishingTripActions.setSelectedId(null));
      utils.fishingTrip.list.invalidate();
    },
  });

  const handleClose = () => {
    dispatch(fishingTripActions.setSelectedId(null));
  };

  const handleDelete = () => {
    if (selectedTrip && confirm('Are you sure you want to delete this trip?')) {
      deleteMutation.mutate({ id: selectedTrip.id });
    }
  };

  if (!selectedTrip) {
    return null;
  }

  return (
    <div className={classes['overlay']} onClick={handleClose}>
      <div className={classes['modal']} onClick={(e) => e.stopPropagation()}>
        <div className={classes['header']}>
          <div>
            <h2 className={classes['title']}>{selectedTrip.locationName}</h2>
            <div className={classes['date']}>{formatDate(selectedTrip.date)}</div>
          </div>
          <button className={classes['closeButton']} onClick={handleClose}>
            &times;
          </button>
        </div>

        <div className={classes['content']}>
          <div className={classes['field']}>
            <div className={classes['label']}>Catch</div>
            <div className={classes['catchCount']}>
              🐟 {selectedTrip.catchCount ?? 0} fish
            </div>
          </div>

          <div className={classes['row']}>
            {selectedTrip.weather && (
              <div className={classes['field']}>
                <div className={classes['label']}>Weather</div>
                <div className={classes['value']}>{capitalize(selectedTrip.weather)}</div>
              </div>
            )}
            {selectedTrip.waterConditions && (
              <div className={classes['field']}>
                <div className={classes['label']}>Water Conditions</div>
                <div className={classes['value']}>{capitalize(selectedTrip.waterConditions)}</div>
              </div>
            )}
          </div>

          {selectedTrip.notes && (
            <div className={classes['field']}>
              <div className={classes['label']}>Notes</div>
              <div className={classes['notes']}>{selectedTrip.notes}</div>
            </div>
          )}

          <div className={classes['field']}>
            <div className={classes['label']}>Coordinates</div>
            <div className={classes['coordinates']}>
              {selectedTrip.latitude.toFixed(6)}, {selectedTrip.longitude.toFixed(6)}
            </div>
          </div>
        </div>

        <div className={classes['actions']}>
          <button
            className={classes['deleteButton']}
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Trip'}
          </button>
          <button className={classes['closeButtonSecondary']} onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
