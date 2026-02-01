import type { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions = {};

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createExtension('uuid-ossp', { ifNotExists: true });

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
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('projects');
  pgm.dropType('project_status');
}
