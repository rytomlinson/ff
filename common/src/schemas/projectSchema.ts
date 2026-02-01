import { z } from 'zod';

export const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  status: z.enum(['active', 'inactive', 'archived']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const newProjectSchema = projectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProjectSchema = newProjectSchema.partial();

export type Project = z.infer<typeof projectSchema>;
export type NewProject = z.infer<typeof newProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
