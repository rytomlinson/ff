import { useState, useEffect } from 'react';
import { createUseStyles } from 'react-jss';
import type { PathTheme } from '../../utils/theme.js';
import { trpc } from '../../trpc.js';
import type { EventType } from '@ff/common/schemas/fishingTripSchema.js';

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
    zIndex: 1001,
  },
  modal: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
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
    fontSize: theme.fontSize.lg,
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
  eventTypeGroup: {
    display: 'flex',
    gap: theme.spacing.sm,
  },
  eventTypeButton: {
    flex: 1,
    padding: theme.spacing.sm,
    border: `1px solid ${theme.colors.border.primary}`,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.primary,
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.sm,
    cursor: 'pointer',
    transition: `all ${theme.transitions.fast}`,
    '&:hover': {
      borderColor: theme.colors.accent.primary,
    },
  },
  eventTypeButtonActive: {
    borderColor: theme.colors.accent.primary,
    backgroundColor: theme.colors.accent.primary,
    color: '#fff',
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
  },
  row: {
    display: 'flex',
    gap: theme.spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  textarea: {
    backgroundColor: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.primary}`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.md,
    resize: 'vertical',
    minHeight: 60,
    fontFamily: 'inherit',
    '&:focus': {
      outline: 'none',
      borderColor: theme.colors.accent.primary,
    },
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
    color: '#fff',
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
  },
}));

interface EventFormProps {
  tripId: string;
  initialCoords?: { lat: number; lng: number };
  onClose: () => void;
  onSuccess: () => void;
}

const EVENT_TYPES: { type: EventType; label: string; emoji: string }[] = [
  { type: 'catch', label: 'Catch', emoji: '🐟' },
  { type: 'hooked', label: 'Hooked', emoji: '🎣' },
  { type: 'miss', label: 'Miss', emoji: '💨' },
];

export default function EventForm({ tripId, initialCoords, onClose, onSuccess }: EventFormProps) {
  const classes = useStyles();

  const [eventType, setEventType] = useState<EventType>('catch');
  const [species, setSpecies] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createMutation = trpc.tripEvent.create.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: { message: string }) => {
      setError(err.message);
    },
  });

  useEffect(() => {
    if (initialCoords) {
      setLatitude(initialCoords.lat.toFixed(6));
      setLongitude(initialCoords.lng.toFixed(6));
    }
    // Set default time to now
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    setTime(timeStr);
  }, [initialCoords]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!latitude || !longitude) {
      setError('Coordinates are required');
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      setError('Invalid coordinates');
      return;
    }

    // Create timestamp from today's date + entered time
    const today = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    today.setHours(hours ?? 0, minutes ?? 0, 0, 0);

    createMutation.mutate({
      tripId,
      eventType,
      species: species || null,
      latitude: lat,
      longitude: lng,
      timestamp: today,
      notes: notes || null,
    });
  };

  return (
    <div className={classes['overlay']} onClick={onClose}>
      <div className={classes['modal']} onClick={(e) => e.stopPropagation()}>
        <div className={classes['header']}>
          <h2 className={classes['title']}>Log Event</h2>
          <button className={classes['closeButton']} onClick={onClose}>
            &times;
          </button>
        </div>

        <form className={classes['form']} onSubmit={handleSubmit}>
          <div className={classes['fieldGroup']}>
            <label className={classes['label']}>What happened?</label>
            <div className={classes['eventTypeGroup']}>
              {EVENT_TYPES.map(({ type, label, emoji }) => (
                <button
                  key={type}
                  type="button"
                  className={`${classes['eventTypeButton']} ${eventType === type ? classes['eventTypeButtonActive'] : ''}`}
                  onClick={() => setEventType(type)}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>
          </div>

          <div className={classes['fieldGroup']}>
            <label className={classes['label']}>Species (optional)</label>
            <input
              type="text"
              className={classes['input']}
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder="e.g., Rainbow Trout, Brown Trout"
            />
          </div>

          <div className={classes['fieldGroup']}>
            <label className={classes['label']}>Time</label>
            <input
              type="time"
              className={classes['input']}
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className={classes['row']}>
            <div className={`${classes['fieldGroup']} ${classes['halfWidth']}`}>
              <label className={classes['label']}>Latitude</label>
              <input
                type="number"
                step="any"
                className={classes['input']}
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="44.1234"
              />
            </div>
            <div className={`${classes['fieldGroup']} ${classes['halfWidth']}`}>
              <label className={classes['label']}>Longitude</label>
              <input
                type="number"
                step="any"
                className={classes['input']}
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="-120.5678"
              />
            </div>
          </div>

          <div className={classes['fieldGroup']}>
            <label className={classes['label']}>Notes (optional)</label>
            <textarea
              className={classes['textarea']}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Fly pattern, technique, etc."
            />
          </div>

          {error && <div className={classes['error']}>{error}</div>}

          <div className={classes['actions']}>
            <button
              type="button"
              className={`${classes['button']} ${classes['cancelButton']}`}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${classes['button']} ${classes['submitButton']}`}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : 'Log Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
