import express from 'express';
import * as journalController from '../controllers/journal.js';
import * as journalNotesController from '../controllers/journalNotes.js';
import * as journalGalleryController from '../controllers/journalGallery.js';
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

const validateCompileSummaryRequest = [
  body('entries')
    .isArray({ min: 1 })
    .withMessage('Entries array with at least one entry is required'),
  body('entries.*.title').optional({ nullable: true }).trim(),
  body('entries.*.date').optional({ nullable: true }).trim(),
  body('entries.*.content').optional({ nullable: true }).trim(),
  body('entries.*.mood').optional({ nullable: true }).trim(),
  body('entries.*.tags').optional({ nullable: true }).isArray(),
  body('entries.*.time_in').optional({ nullable: true }).trim(),
  body('entries.*.time_out').optional({ nullable: true }).trim(),
  body('entries.*.break_time').optional({ nullable: true }).isInt(),
  body('traineeName').optional({ nullable: true }).trim(),
  body('course').optional({ nullable: true }).trim(),
  body('industryPartner').optional({ nullable: true }).trim(),
  body('department').optional({ nullable: true }).trim(),
  body('dateRange.start').optional({ nullable: true }).trim(),
  body('dateRange.end').optional({ nullable: true }).trim(),
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

const validateAddNote = [
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('time').optional().trim(),
  handleValidationErrors,
];

const validateUpdateNote = [
  param('id').isInt().withMessage('Invalid note ID'),
  body('content').optional().trim().notEmpty(),
  body('date').optional().isISO8601(),
  body('time').optional().trim(),
  handleValidationErrors,
];

const validateNoteId = [
  param('id').isInt().withMessage('Invalid note ID'),
  handleValidationErrors,
];

const validateMergeNotes = [
  body('noteIds')
    .isArray({ min: 1 })
    .withMessage('noteIds array with at least one id is required'),
  body('noteIds.*')
    .custom((v) => Number.isInteger(Number(v)))
    .withMessage('Each noteId must be an integer'),
  body('title').optional().trim(),
  body('date').optional().isISO8601(),
  body('deleteNotesAfterMerge').optional().isBoolean(),
  handleValidationErrors,
];

const validateAddGalleryImage = [
  body('image_url')
    .exists()
    .withMessage('image_url is required')
    .bail()
    .isString()
    .withMessage('image_url must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('image_url cannot be empty'),
  body('caption')
    .exists()
    .withMessage('caption is required')
    .bail()
    .isString()
    .withMessage('caption must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('caption cannot be empty'),
  body('journal_entry_id')
    .exists()
    .withMessage('journal_entry_id is required')
    .bail()
    .custom((val) => Number.isInteger(Number(val)) && Number(val) > 0)
    .withMessage('journal_entry_id must be a positive integer'),
  handleValidationErrors,
];

const validateGalleryImageId = [
  param('id').isInt().withMessage('Invalid image ID'),
  handleValidationErrors,
];

// Notes routes (must be before /:id)
router.get('/notes', journalNotesController.getNotes);
router.post('/notes', validateAddNote, journalNotesController.addNote);
router.post('/notes/merge', validateMergeNotes, journalNotesController.mergeNotes);
router.put('/notes/:id', validateUpdateNote, journalNotesController.updateNote);
router.delete('/notes/:id', validateNoteId, journalNotesController.deleteNote);

// Gallery routes (must be before /:id)
router.get('/gallery', journalGalleryController.getGallery);
router.post('/gallery', validateAddGalleryImage, journalGalleryController.addGalleryImage);
router.delete('/gallery/:id', validateGalleryImageId, journalGalleryController.deleteGalleryImage);

// AI enhancement routes (must be before /:id routes)
router.post('/ai/enhance', validateEnhanceRequest, journalController.enhanceEntry);
router.post('/ai/suggest-tags', journalController.suggestTags);
router.post('/ai/weekly-summary', validateWeeklySummaryRequest, journalController.summarizeWeek);
router.post('/ai/journey-summary', validateJourneySummaryRequest, journalController.journeySummary);
router.post('/ai/compile-summary', validateCompileSummaryRequest, journalController.compileJournal);

// CRUD routes
router.get('/', journalController.getEntries);
router.get('/:id', validateEntryId, journalController.getEntryById);
router.post('/', validateAddEntry, journalController.addEntry);
router.put('/:id', validateUpdateEntry, journalController.updateEntry);
router.delete('/:id', validateEntryId, journalController.deleteEntry);

export default router;