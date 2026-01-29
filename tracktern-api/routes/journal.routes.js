import express from 'express';
import * as journalController from '../controllers/journal.js';
import { authenticateToken } from '../middleware/auth.js';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateAddEntry = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('date').isISO8601().withMessage('Invalid date format'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('mood').optional().trim(),
  body('tags').optional().isArray(),
  handleValidationErrors
];

const validateUpdateEntry = [
  param('id').isInt().withMessage('Invalid entry ID'),
  body('title').optional().trim().notEmpty(),
  body('date').optional().isISO8601(),
  body('content').optional().trim().notEmpty(),
  body('mood').optional().trim(),
  body('tags').optional().isArray(),
  handleValidationErrors
];

const validateEntryId = [
  param('id').isInt().withMessage('Invalid entry ID'),
  handleValidationErrors
];

const validateEnhanceRequest = [
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('enhanceType').optional().isIn(['improve', 'expand', 'professional', 'summarize']),
  handleValidationErrors
];

// All routes require authentication
router.use(authenticateToken);

// AI enhancement routes (must be before /:id routes)
router.post('/ai/enhance', validateEnhanceRequest, journalController.enhanceEntry);
router.post('/ai/suggest-tags', journalController.suggestTags);

// CRUD routes
router.get('/', journalController.getEntries);
router.get('/:id', validateEntryId, journalController.getEntryById);
router.post('/', validateAddEntry, journalController.addEntry);
router.put('/:id', validateUpdateEntry, journalController.updateEntry);
router.delete('/:id', validateEntryId, journalController.deleteEntry);

export default router;