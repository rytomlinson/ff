import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, authedProcedure, publicProcedure } from '../trpc.js';
import { newProjectSchema, updateProjectSchema } from '@ff/common/schemas/projectSchema.js';
import * as projectService from '../services/projectService.js';

export const projectRouter = router({
  list: publicProcedure.query(async () => {
    return projectService.getAllProjects();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const project = await projectService.getProjectById(input.id);
      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }
      return project;
    }),

  create: authedProcedure
    .meta({ log: true })
    .input(newProjectSchema)
    .mutation(async ({ input }) => {
      return projectService.createProject(input);
    }),

  update: authedProcedure
    .meta({ log: true })
    .input(
      z.object({
        id: z.string().uuid(),
        data: updateProjectSchema,
      })
    )
    .mutation(async ({ input }) => {
      const project = await projectService.updateProject(input.id, input.data);
      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }
      return project;
    }),

  delete: authedProcedure
    .meta({ log: true })
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const deleted = await projectService.deleteProject(input.id);
      if (!deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }
      return { success: true };
    }),
});
