import type { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions = {};

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create enums for fishing trips
  pgm.createType('water_conditions', ['clear', 'murky', 'stained', 'muddy']);
  pgm.createType('weather', ['sunny', 'cloudy', 'overcast', 'rainy', 'stormy']);

  // Create fishing_trips table
  pgm.createTable('fishing_trips', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    date: {
      type: 'date',
      notNull: true,
    },
    location_name: {
      type: 'varchar(255)',
      notNull: true,
    },
    latitude: {
      type: 'decimal(9,6)',
      notNull: true,
    },
    longitude: {
      type: 'decimal(9,6)',
      notNull: true,
    },
    water_conditions: {
      type: 'water_conditions',
    },
    weather: {
      type: 'weather',
    },
    notes: {
      type: 'text',
    },
    catch_count: {
      type: 'integer',
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
  pgm.createIndex('fishing_trips', 'date');
  pgm.createIndex('fishing_trips', ['latitude', 'longitude']);
  pgm.createIndex('fishing_trips', 'created_at');

  // Drop old projects table and type
  pgm.dropTable('projects');
  pgm.dropType('project_status');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Recreate projects table
  pgm.createType('project_status', ['active', 'inactive', 'archived']);

  pgm.createTable('projects', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    latitude: {
      type: 'decimal(9,6)',
      notNull: true,
    },
    longitude: {
      type: 'decimal(9,6)',
      notNull: true,
    },
    status: {
      type: 'project_status',
      notNull: true,
      default: 'active',
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

  pgm.createIndex('projects', 'status');
  pgm.createIndex('projects', ['latitude', 'longitude']);
  pgm.createIndex('projects', 'created_at');

  // Drop fishing_trips table and enums
  pgm.dropTable('fishing_trips');
  pgm.dropType('water_conditions');
  pgm.dropType('weather');
}
