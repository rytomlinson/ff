import { useState } from 'react';
import { createUseStyles } from 'react-jss';
import type { PathTheme } from '../../utils/theme.js';
import { useAppSelector, useAppDispatch } from '../../hooks/index.js';
import { fishingTripSelectors, fishingTripActions } from '../../slices/fishingTripSlice.js';
import { trpc } from '../../trpc.js';
import EventForm from '../EventForm/EventForm.js';
import type { TripEvent } from '@ff/common/schemas/fishingTripSchema.js';

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
    maxWidth: 500,
    maxHeight: '90vh',
    overflow: 'auto',
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
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  addEventButton: {
    backgroundColor: theme.colors.accent.primary,
    color: '#fff',
    border: 'none',
    borderRadius: theme.borderRadius.sm,
    padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
    fontSize: theme.fontSize.xs,
    fontWeight: 500,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.colors.accent.secondary,
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
  eventsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm,
  },
  eventItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.md,
    border: `1px solid ${theme.colors.border.primary}`,
  },
  eventIcon: {
    fontSize: theme.fontSize.lg,
    width: 28,
    textAlign: 'center',
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventType: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: 500,
    textTransform: 'capitalize',
  },
  eventTime: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSize.xs,
  },
  eventSpecies: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.sm,
  },
  eventNotes: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.xs,
  },
  eventDelete: {
    backgroundColor: 'transparent',
    border: 'none',
    color: theme.colors.text.muted,
    fontSize: theme.fontSize.sm,
    cursor: 'pointer',
    padding: theme.spacing.xs,
    '&:hover': {
      color: theme.colors.status.error,
    },
  },
  noEvents: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    padding: theme.spacing.md,
  },
  summary: {
    display: 'flex',
    gap: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.md,
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.xs,
    fontSize: theme.fontSize.md,
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

function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getEventIcon(eventType: string): string {
  switch (eventType) {
    case 'catch': return '🐟';
    case 'hooked': return '🎣';
    case 'miss': return '💨';
    default: return '❓';
  }
}

// API response type
interface TripEventApiResponse {
  id: string;
  tripId: string;
  eventType: 'catch' | 'hooked' | 'miss';
  species: string | null;
  latitude: number;
  longitude: number;
  timestamp: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function TripDetail() {
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const selectedTrip = useAppSelector(fishingTripSelectors.selectSelectedItem);
  const [showEventForm, setShowEventForm] = useState(false);

  const utils = trpc.useUtils();

  const { data: eventsData } = trpc.tripEvent.listByTrip.useQuery(
    { tripId: selectedTrip?.id ?? '' },
    { enabled: !!selectedTrip }
  );

  const deleteTripMutation = trpc.fishingTrip.delete.useMutation({
    onSuccess: () => {
      if (selectedTrip) {
        dispatch(fishingTripActions.deleteItem(selectedTrip.id));
      }
      dispatch(fishingTripActions.setSelectedId(null));
      utils.fishingTrip.list.invalidate();
    },
  });

  const deleteEventMutation = trpc.tripEvent.delete.useMutation({
    onSuccess: () => {
      if (selectedTrip) {
        utils.tripEvent.listByTrip.invalidate({ tripId: selectedTrip.id });
      }
    },
  });

  const handleClose = () => {
    dispatch(fishingTripActions.setSelectedId(null));
  };

  const handleDeleteTrip = () => {
    if (selectedTrip && confirm('Are you sure you want to delete this trip and all its events?')) {
      deleteTripMutation.mutate({ id: selectedTrip.id });
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('Delete this event?')) {
      deleteEventMutation.mutate({ id: eventId });
    }
  };

  const handleEventFormSuccess = () => {
    if (selectedTrip) {
      utils.tripEvent.listByTrip.invalidate({ tripId: selectedTrip.id });
    }
  };

  if (!selectedTrip) {
    return null;
  }

  // Convert events to proper types
  const events: TripEvent[] = (eventsData as TripEventApiResponse[] | undefined)?.map(e => ({
    ...e,
    timestamp: new Date(e.timestamp),
    createdAt: new Date(e.createdAt),
    updatedAt: new Date(e.updatedAt),
  })) ?? [];

  // Count events by type
  const catches = events.filter(e => e.eventType === 'catch').length;
  const hooked = events.filter(e => e.eventType === 'hooked').length;
  const misses = events.filter(e => e.eventType === 'miss').length;

  return (
    <>
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

          <div className={classes['section']}>
            <div className={classes['summary']}>
              <div className={classes['summaryItem']}>🐟 {catches} caught</div>
              <div className={classes['summaryItem']}>🎣 {hooked} hooked</div>
              <div className={classes['summaryItem']}>💨 {misses} missed</div>
            </div>
          </div>

          <div className={classes['section']}>
            <div className={classes['sectionHeader']}>
              <span className={classes['sectionTitle']}>Events</span>
              <button
                className={classes['addEventButton']}
                onClick={() => setShowEventForm(true)}
              >
                + Add Event
              </button>
            </div>
            <div className={classes['eventsList']}>
              {events.length === 0 ? (
                <div className={classes['noEvents']}>
                  No events logged yet. Add catches, hooks, and misses!
                </div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className={classes['eventItem']}>
                    <span className={classes['eventIcon']}>
                      {getEventIcon(event.eventType)}
                    </span>
                    <div className={classes['eventContent']}>
                      <div className={classes['eventHeader']}>
                        <span className={classes['eventType']}>{event.eventType}</span>
                        <span className={classes['eventTime']}>{formatTime(event.timestamp)}</span>
                      </div>
                      {event.species && (
                        <div className={classes['eventSpecies']}>{event.species}</div>
                      )}
                      {event.notes && (
                        <div className={classes['eventNotes']}>{event.notes}</div>
                      )}
                    </div>
                    <button
                      className={classes['eventDelete']}
                      onClick={() => handleDeleteEvent(event.id)}
                      title="Delete event"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {(selectedTrip.weather || selectedTrip.waterConditions) && (
            <div className={classes['section']}>
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
            </div>
          )}

          {selectedTrip.notes && (
            <div className={classes['section']}>
              <div className={classes['label']}>Notes</div>
              <div className={classes['notes']}>{selectedTrip.notes}</div>
            </div>
          )}

          <div className={classes['section']}>
            <div className={classes['label']}>Location</div>
            <div className={classes['coordinates']}>
              {selectedTrip.latitude.toFixed(6)}, {selectedTrip.longitude.toFixed(6)}
            </div>
          </div>

          <div className={classes['actions']}>
            <button
              className={classes['deleteButton']}
              onClick={handleDeleteTrip}
              disabled={deleteTripMutation.isPending}
            >
              {deleteTripMutation.isPending ? 'Deleting...' : 'Delete Trip'}
            </button>
            <button className={classes['closeButtonSecondary']} onClick={handleClose}>
              Close
            </button>
          </div>
        </div>
      </div>

      {showEventForm && (
        <EventForm
          tripId={selectedTrip.id}
          initialCoords={{ lat: selectedTrip.latitude, lng: selectedTrip.longitude }}
          onClose={() => setShowEventForm(false)}
          onSuccess={handleEventFormSuccess}
        />
      )}
    </>
  );
}
