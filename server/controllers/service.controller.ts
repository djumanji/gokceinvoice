import { BaseCrudController } from './base-crud.controller';
import { storage } from '../storage';
import { insertServiceSchema, type Service } from '@shared/schema';

/**
 * Service Controller
 * Handles CRUD operations for services using base controller pattern
 */
class ServiceController extends BaseCrudController<Service> {
  constructor() {
    super('Service', {
      getAll: (userId) => storage.getServices(userId),
      getOne: (id, userId) => storage.getService(id, userId),
      create: (data) => storage.createService(data),
      update: (id, userId, data) => storage.updateService(id, userId, data),
      delete: (id, userId) => storage.deleteService(id, userId),
    }, insertServiceSchema);
  }
}

// Export controller methods
const controller = new ServiceController();
export const { list, getOne, create, update, remove } = controller;

