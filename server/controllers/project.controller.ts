import type { Request, Response } from 'express';
import { storage } from '../storage';
import { insertProjectSchema, type Project } from '@shared/schema';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { getUserId } from '../middleware/auth.middleware';

/**
 * Project Controller
 * Handles CRUD operations for projects
 * Note: Projects don't have a "list all" endpoint, only "list by client"
 */

/**
 * GET /api/clients/:clientId/projects
 * Get all projects for a specific client
 */
export const listByClient = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { clientId } = req.params;

  const projects = await storage.getProjectsByClient(clientId, userId);
  res.json(projects);
});

/**
 * GET /api/projects/:id
 * Get a specific project by ID
 */
export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;

  const project = await storage.getProject(id, userId);
  if (!project) {
    throw new AppError(404, 'Project not found');
  }

  res.json(project);
});

/**
 * POST /api/projects
 * Create a new project with client validation
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  
  // Verify client belongs to user before creating project
  const client = await storage.getClient(req.body.clientId, userId);
  if (!client) {
    throw new AppError(404, 'Client not found');
  }

  // Body has already been sanitized by middleware
  const data = insertProjectSchema.parse(req.body);
  const project = await storage.createProject(data);
  
  res.status(201).json(project);
});

/**
 * PATCH /api/projects/:id
 * Update an existing project
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;

  // Body has already been sanitized by middleware
  const data = insertProjectSchema.partial().parse(req.body);
  const project = await storage.updateProject(id, userId, data);
  
  if (!project) {
    throw new AppError(404, 'Project not found');
  }

  res.json(project);
});

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;

  const deleted = await storage.deleteProject(id, userId);
  if (!deleted) {
    throw new AppError(404, 'Project not found');
  }

  res.status(204).send();
});

