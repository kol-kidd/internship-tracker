import express from 'express';
import * as applicationsController from '../controllers/application.js';
import {
  validateAddApplication,
  validateUpdateApplication,
  validateUpdateStatus,
  validateApplicationId,
  validateGetApplications,
  validateChecklistApplicationId,
  validateAddChecklistItem,
  validateUpdateChecklistItem,
  validateDeleteChecklistItem
} from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET all applications for the authenticated user
router.get('/', validateGetApplications, applicationsController.getApplications);

// Checklist routes for accepted internship workspaces
router.get('/:id/checklist', validateChecklistApplicationId, applicationsController.getApplicationChecklist);
router.post('/:id/checklist', validateAddChecklistItem, applicationsController.addChecklistItem);
router.patch('/:id/checklist/:itemId', validateUpdateChecklistItem, applicationsController.updateChecklistItem);
router.delete('/:id/checklist/:itemId', validateDeleteChecklistItem, applicationsController.deleteChecklistItem);

// GET single application by ID
router.get('/:id', validateApplicationId, applicationsController.getApplicationById);

// POST create new application
router.post('/', validateAddApplication, applicationsController.addApplication);

// PUT update application
router.put('/:id', validateUpdateApplication, applicationsController.updateApplication);

// PATCH update application status
router.patch('/:id/status', validateUpdateStatus, applicationsController.updateApplicationStatus);

// DELETE application
router.delete('/:id', validateApplicationId, applicationsController.deleteApplication);

export default router;
