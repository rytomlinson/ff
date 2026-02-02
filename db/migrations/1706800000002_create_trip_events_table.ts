import type { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions = {};

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create event type enum
  pgm.createType('event_type', ['catch', 'hooked', 'miss']);

  // Create trip_events table
  pgm.createTable('trip_events', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    trip_id: {
      type: 'uuid',
      notNull: true,
      references: 'fishing_trips(id)',
      onDelete: 'CASCADE',
    },
    event_type: {
      type: 'event_type',
      notNull: true,
    },
    species: {
      type: 'varchar(100)',
    },
    latitude: {
      type: 'decimal(9,6)',
      notNull: true,
    },
    longitude: {
      type: 'decimal(9,6)',
      notNull: true,
    },
    timestamp: {
      type: 'timestamp with time zone',
      notNull: true,
    },
    notes: {
      type: 'text',
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Create indexes
  pgm.createIndex('trip_events', 'trip_id');
  pgm.createIndex('trip_events', 'event_type');
  pgm.createIndex('trip_events', 'timestamp');
  pgm.createIndex('trip_events', ['latitude', 'longitude']);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('trip_events');
  pgm.dropType('event_type');
}
