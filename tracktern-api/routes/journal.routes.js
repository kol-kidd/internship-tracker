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

const validateWeeklySummaryRequest = [
  body('entries')
    .isArray({ min: 1 })
    .withMessage('Entries array with at least one entry is required'),
  body('entries.*.title').optional().trim(),
  body('entries.*.date').optional().isISO8601(),
  body('entries.*.content').optional().trim(),
  body('entries.*.mood').optional().trim(),
  body('entries.*.tags').optional().isArray(),
  body('entries.*.time_in').optional().trim(),
  body('entries.*.time_out').optional().trim(),
  body('entries.*.break_time').optional().isInt(),
  handleValidationErrors,
];

const validateJourneySummaryRequest = [
  body('applications')
    .isArray()
    .withMessage('Applications array is required'),
  body('applications.*.date_applied').optional().trim(),
  body('applications.*.company_name').optional().trim(),
  body('applications.*.position').optional().trim(),
  body('applications.*.status').optional().trim(),
  handleValidationErrors,
];

// AI enhancement routes (must be before /:id routes)
router.post('/ai/enhance', validateEnhanceRequest, journalController.enhanceEntry);
router.post('/ai/suggest-tags', journalController.suggestTags);
router.post('/ai/weekly-summary', validateWeeklySummaryRequest, journalController.summarizeWeek);
router.post('/ai/journey-summary', validateJourneySummaryRequest, journalController.journeySummary);

// CRUD routes
router.get('/', journalController.getEntries);
router.get('/:id', validateEntryId, journalController.getEntryById);
router.post('/', validateAddEntry, journalController.addEntry);
router.put('/:id', validateUpdateEntry, journalController.updateEntry);
router.delete('/:id', validateEntryId, journalController.deleteEntry);

export default router;