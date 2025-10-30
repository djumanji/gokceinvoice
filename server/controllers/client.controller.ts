import { BaseCrudController } from './base-crud.controller';
import { storage } from '../storage';
import { insertClientSchema, type Client } from '@shared/schema';

/**
 * Client Controller
 * Handles CRUD operations for clients using base controller pattern
 */
class ClientController extends BaseCrudController<Client> {
  constructor() {
    super('Client', {
      getAll: (userId) => storage.getClients(userId),
      getOne: (id, userId) => storage.getClient(id, userId),
      create: (data) => storage.createClient(data),
      update: (id, userId, data) => storage.updateClient(id, userId, data),
      delete: (id, userId) => storage.deleteClient(id, userId),
    }, insertClientSchema);
  }
}

// Export controller methods
const controller = new ClientController();
export const { list, getOne, create, update, remove } = controller;

