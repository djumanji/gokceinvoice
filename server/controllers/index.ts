/**
 * Centralized controller exports
 * Makes it easy to import controllers throughout the application
 */

import * as clientController from './client.controller';
import * as invoiceController from './invoice.controller';
import * as serviceController from './service.controller';
import * as expenseController from './expense.controller';
import * as bankController from './bank.controller';
import * as projectController from './project.controller';
import * as userController from './user.controller';
import * as uploadController from './upload.controller';
import * as chatbotController from './chatbot.controller';

export {
  clientController,
  invoiceController,
  serviceController,
  expenseController,
  bankController,
  projectController,
  userController,
  uploadController,
  chatbotController,
};

