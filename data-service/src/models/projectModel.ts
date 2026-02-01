import { query, queryOne } from '@ff/common';
import {
  projectSchema,
  type Project,
  type NewProject,
  type UpdateProject,
} from '@ff/common/schemas/projectSchema.js';
import { throwDbError, mapRowToCamelCase } from '@ff/common/utils/dbUtils.js';

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

function rowMapper(row: ProjectRow): Project {
  const camelCaseRow = mapRowToCamelCase<{
    id: string;
    name: string;
    description: string | null;
    latitude: number;
    longitude: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }>(row);
  return projectSchema.parse(camelCaseRow);
}

export async function findAll(): Promise<Project[]> {
  try {
    const rows = await query<ProjectRow>(`
      SELECT id, name, description, latitude, longitude, status, created_at, updated_at
      FROM projects
      ORDER BY created_at DESC
    `);
    return rows.map(rowMapper);
  } catch (e) {
    return throwDbError(e);
  }
}

export async function findById(id: string): Promise<Project | null> {
  try {
    const row = await queryOne<ProjectRow>(
      `
      SELECT id, name, description, latitude, longitude, status, created_at, updated_at
      FROM projects
      WHERE id = :id
    `,
      { id }
    );
    return row ? rowMapper(row) : null;
  } catch (e) {
    return throwDbError(e);
  }
}

export async function create(data: NewProject): Promise<Project> {
  try {
    const row = await queryOne<ProjectRow>(
      `
      INSERT INTO projects (name, description, latitude, longitude, status)
      VALUES (:name, :description, :latitude, :longitude, :status)
      RETURNING id, name, description, latitude, longitude, status, created_at, updated_at
    `,
      data
    );
    if (!row) {
      throw new Error('Failed to create project');
    }
    return rowMapper(row);
  } catch (e) {
    return throwDbError(e);
  }
}

export async function update(id: string, data: UpdateProject): Promise<Project | null> {
  try {
    const setClauses: string[] = [];
    const params: Record<string, unknown> = { id };

    if (data.name !== undefined) {
      setClauses.push('name = :name');
      params['name'] = data.name;
    }
    if (data.description !== undefined) {
      setClauses.push('description = :description');
      params['description'] = data.description;
    }
    if (data.latitude !== undefined) {
      setClauses.push('latitude = :latitude');
      params['latitude'] = data.latitude;
    }
    if (data.longitude !== undefined) {
      setClauses.push('longitude = :longitude');
      params['longitude'] = data.longitude;
    }
    if (data.status !== undefined) {
      setClauses.push('status = :status');
      params['status'] = data.status;
    }

    if (setClauses.length === 0) {
      return findById(id);
    }

    setClauses.push('updated_at = NOW()');

    const row = await queryOne<ProjectRow>(
      `
      UPDATE projects
      SET ${setClauses.join(', ')}
      WHERE id = :id
      RETURNING id, name, description, latitude, longitude, status, created_at, updated_at
    `,
      params
    );
    return row ? rowMapper(row) : null;
  } catch (e) {
    return throwDbError(e);
  }
}

export async function remove(id: string): Promise<boolean> {
  try {
    const result = await query<{ id: string }>(
      `
      DELETE FROM projects
      WHERE id = :id
      RETURNING id
    `,
      { id }
    );
    return result.length > 0;
  } catch (e) {
    return throwDbError(e);
  }
}
