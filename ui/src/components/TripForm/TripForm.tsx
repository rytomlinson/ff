import { useState, useEffect } from 'react';
import { createUseStyles } from 'react-jss';
import type { PathTheme } from '../../utils/theme.js';
import { useAppSelector, useAppDispatch } from '../../hooks/index.js';
import { fishingTripSelectors, fishingTripActions } from '../../slices/fishingTripSlice.js';
import { trpc } from '../../trpc.js';
import type { WaterConditions, Weather } from '@ff/common/schemas/fishingTripSchema.js';

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
    maxWidth: 480,
    maxHeight: '90vh',
    overflow: 'auto',
    border: `1px solid ${theme.colors.border.primary}`,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.xl,
    fontWeight: 600,
    margin: 0,
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.md,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs,
  },
  label: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.sm,
    fontWeight: 500,
  },
  required: {
    color: theme.colors.status.error,
  },
  input: {
    backgroundColor: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.primary}`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.md,
    '&:focus': {
      outline: 'none',
      borderColor: theme.colors.accent.primary,
    },
    '&::placeholder': {
      color: theme.colors.text.muted,
    },
  },
  select: {
    backgroundColor: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.primary}`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.md,
    cursor: 'pointer',
    '&:focus': {
      outline: 'none',
      borderColor: theme.colors.accent.primary,
    },
  },
  textarea: {
    backgroundColor: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.primary}`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.md,
    resize: 'vertical',
    minHeight: 80,
    fontFamily: 'inherit',
    '&:focus': {
      outline: 'none',
      borderColor: theme.colors.accent.primary,
    },
    '&::placeholder': {
      color: theme.colors.text.muted,
    },
  },
  row: {
    display: 'flex',
    gap: theme.spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  coordinatesHint: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSize.xs,
    fontStyle: 'italic',
  },
  optionalSection: {
    borderTop: `1px solid ${theme.colors.border.primary}`,
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  optionalHeader: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.md,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  button: {
    padding: `${theme.spacing.sm}px ${theme.spacing.lg}px`,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.fontSize.md,
    fontWeight: 500,
    cursor: 'pointer',
    transition: `all ${theme.transitions.fast}`,
    border: 'none',
  },
  cancelButton: {
    backgroundColor: theme.colors.background.tertiary,
    color: theme.colors.text.secondary,
    '&:hover': {
      backgroundColor: theme.colors.background.primary,
    },
  },
  submitButton: {
    backgroundColor: theme.colors.accent.primary,
    color: theme.colors.text.primary,
    '&:hover': {
      backgroundColor: theme.colors.accent.secondary,
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  error: {
    color: theme.colors.status.error,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.sm,
  },
}));

const WATER_CONDITIONS: WaterConditions[] = ['clear', 'murky', 'stained', 'muddy'];
const WEATHER_OPTIONS: Weather[] = ['sunny', 'cloudy', 'overcast', 'rainy', 'stormy'];

export default function TripForm() {
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const formOpen = useAppSelector(fishingTripSelectors.selectFormOpen);
  const pendingCoordinates = useAppSelector(fishingTripSelectors.selectPendingCoordinates);
  const pendingLocationName = useAppSelector(fishingTripSelectors.selectPendingLocationName);

  const [date, setDate] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [waterConditions, setWaterConditions] = useState<WaterConditions | ''>('');
  const [weather, setWeather] = useState<Weather | ''>('');
  const [notes, setNotes] = useState('');
  const [catchCount, setCatchCount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const createMutation = trpc.fishingTrip.create.useMutation({
    onSuccess: () => {
      utils.fishingTrip.list.invalidate();
      dispatch(fishingTripActions.closeForm());
      resetForm();
    },
    onError: (err: { message: string }) => {
      setError(err.message);
    },
  });

  useEffect(() => {
    if (pendingCoordinates) {
      setLatitude(pendingCoordinates.lat.toFixed(6));
      setLongitude(pendingCoordinates.lng.toFixed(6));
    }
  }, [pendingCoordinates]);

  useEffect(() => {
    if (pendingLocationName) {
      setLocationName(pendingLocationName);
    }
  }, [pendingLocationName]);

  useEffect(() => {
    if (formOpen) {
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      if (today) {
        setDate(today);
      }
    }
  }, [formOpen]);

  const resetForm = () => {
    setDate('');
    setLocationName('');
    setLatitude('');
    setLongitude('');
    setWaterConditions('');
    setWeather('');
    setNotes('');
    setCatchCount('');
    setError(null);
  };

  const handleClose = () => {
    dispatch(fishingTripActions.closeForm());
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date || !locationName || !latitude || !longitude) {
      setError('Please fill in all required fields');
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Invalid latitude (must be between -90 and 90)');
      return;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      setError('Invalid longitude (must be between -180 and 180)');
      return;
    }

    createMutation.mutate({
      date: new Date(date),
      locationName,
      latitude: lat,
      longitude: lng,
      waterConditions: waterConditions || null,
      weather: weather || null,
      notes: notes || null,
      catchCount: catchCount ? parseInt(catchCount, 10) : null,
    });
  };

  if (!formOpen) {
    return null;
  }

  return (
    <div className={classes['overlay']} onClick={handleClose}>
      <div className={classes['modal']} onClick={(e) => e.stopPropagation()}>
        <div className={classes['header']}>
          <h2 className={classes['title']}>New Fishing Trip</h2>
          <button className={classes['closeButton']} onClick={handleClose}>
            &times;
          </button>
        </div>

        <form className={classes['form']} onSubmit={handleSubmit}>
          <div className={classes['fieldGroup']}>
            <label className={classes['label']}>
              Date <span className={classes['required']}>*</span>
            </label>
            <input
              type="date"
              className={classes['input']}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className={classes['fieldGroup']}>
            <label className={classes['label']}>
              Location Name <span className={classes['required']}>*</span>
            </label>
            <input
              type="text"
              className={classes['input']}
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g., Clear Creek, Blue River"
              required
            />
          </div>

          <div className={classes['row']}>
            <div className={`${classes['fieldGroup']} ${classes['halfWidth']}`}>
              <label className={classes['label']}>
                Latitude <span className={classes['required']}>*</span>
              </label>
              <input
                type="number"
                step="any"
                className={classes['input']}
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="39.7392"
                required
              />
            </div>
            <div className={`${classes['fieldGroup']} ${classes['halfWidth']}`}>
              <label className={classes['label']}>
                Longitude <span className={classes['required']}>*</span>
              </label>
              <input
                type="number"
                step="any"
                className={classes['input']}
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="-104.9903"
                required
              />
            </div>
          </div>
          <span className={classes['coordinatesHint']}>
            Tip: Click on the map to auto-fill coordinates
          </span>

          <div className={classes['optionalSection']}>
            <div className={classes['optionalHeader']}>Optional Details</div>

            <div className={classes['row']}>
              <div className={`${classes['fieldGroup']} ${classes['halfWidth']}`}>
                <label className={classes['label']}>Water Conditions</label>
                <select
                  className={classes['select']}
                  value={waterConditions}
                  onChange={(e) => setWaterConditions(e.target.value as WaterConditions | '')}
                >
                  <option value="">Select...</option>
                  {WATER_CONDITIONS.map((wc) => (
                    <option key={wc} value={wc}>
                      {wc.charAt(0).toUpperCase() + wc.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className={`${classes['fieldGroup']} ${classes['halfWidth']}`}>
                <label className={classes['label']}>Weather</label>
                <select
                  className={classes['select']}
                  value={weather}
                  onChange={(e) => setWeather(e.target.value as Weather | '')}
                >
                  <option value="">Select...</option>
                  {WEATHER_OPTIONS.map((w) => (
                    <option key={w} value={w}>
                      {w.charAt(0).toUpperCase() + w.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={classes['fieldGroup']}>
              <label className={classes['label']}>Catch Count</label>
              <input
                type="number"
                min="0"
                className={classes['input']}
                value={catchCount}
                onChange={(e) => setCatchCount(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className={classes['fieldGroup']}>
              <label className={classes['label']}>Notes</label>
              <textarea
                className={classes['textarea']}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes about the trip..."
              />
            </div>
          </div>

          {error && <div className={classes['error']}>{error}</div>}

          <div className={classes['actions']}>
            <button
              type="button"
              className={`${classes['button']} ${classes['cancelButton']}`}
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${classes['button']} ${classes['submitButton']}`}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : 'Save Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
