import type { NewProject, Project, UpdateProject } from '@ff/common/schemas/projectSchema.js';
import * as projectModel from '../models/projectModel.js';
import { publishProjectEvent } from '../rabbit/rabbitClient.js';

export async function getAllProjects(): Promise<Project[]> {
  return projectModel.findAll();
}

export async function getProjectById(id: string): Promise<Project | null> {
  return projectModel.findById(id);
}

export async function createProject(data: NewProject): Promise<Project> {
  const project = await projectModel.create(data);
  await publishProjectEvent('project.created', project);
  return project;
}

export async function updateProject(
  id: string,
  data: UpdateProject
): Promise<Project | null> {
  const project = await projectModel.update(id, data);
  if (project) {
    await publishProjectEvent('project.updated', project);
  }
  return project;
}

export async function deleteProject(id: string): Promise<boolean> {
  const deleted = await projectModel.remove(id);
  if (deleted) {
    await publishProjectEvent('project.deleted', { id });
  }
  return deleted;
}
