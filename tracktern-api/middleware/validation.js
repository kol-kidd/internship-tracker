import { body, param, query, validationResult } from 'express-validator';

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const validateSignUp = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('fullName').optional().trim().isLength({ min: 1 }),
  handleValidationErrors
];

export const validateSignIn = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  handleValidationErrors
];

export const validateEmail = [
  body('email').isEmail().normalizeEmail(),
  handleValidationErrors
];

export const validateAddApplication = [
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('companyAddress').trim().notEmpty().withMessage('Company address is required'),
  body('position').optional().trim(),
  body('applicationUrl').optional({ nullable: true }).trim().isLength({ max: 500 }),
  body('contactName').optional({ nullable: true }).trim().isLength({ max: 160 }),
  body('contactEmail').optional({ nullable: true, checkFalsy: true }).trim().isEmail().withMessage('Contact email must be valid'),
  body('deadlineDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Invalid deadline date'),
  body('interviewDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Invalid interview date'),
  body('followUpDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Invalid follow-up date'),
  body('priority').optional().trim().toLowerCase().isIn(['low', 'normal', 'high']).withMessage('Invalid priority'),
  body('startDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Invalid start date'),
  body('endDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Invalid end date'),
  body('supervisorName').optional({ nullable: true }).trim().isLength({ max: 160 }),
  body('supervisorEmail').optional({ nullable: true, checkFalsy: true }).trim().isEmail().withMessage('Supervisor email must be valid'),
  body('department').optional({ nullable: true }).trim().isLength({ max: 160 }),
  body('stipend')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(['', 'paid', 'unpaid'])
    .withMessage('Stipend must be paid, unpaid, or empty'),
  body('status')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(['applied', 'interviewing', 'offer', 'rejected', 'accepted', 'withdrawn'])
    .withMessage('Invalid status'),
  body('dateApplied').optional().isISO8601().withMessage('Invalid date format'),
  handleValidationErrors
];

export const validateUpdateApplication = [
  param('id').isInt().withMessage('Invalid application ID'),
  body('companyName').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
  body('companyAddress').optional().trim().notEmpty().withMessage('Company address cannot be empty'),
  body('position').optional().trim(),
  body('applicationUrl').optional({ nullable: true }).trim().isLength({ max: 500 }),
  body('contactName').optional({ nullable: true }).trim().isLength({ max: 160 }),
  body('contactEmail').optional({ nullable: true, checkFalsy: true }).trim().isEmail().withMessage('Contact email must be valid'),
  body('deadlineDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Invalid deadline date'),
  body('interviewDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Invalid interview date'),
  body('followUpDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Invalid follow-up date'),
  body('priority').optional().trim().toLowerCase().isIn(['low', 'normal', 'high']).withMessage('Invalid priority'),
  body('startDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Invalid start date'),
  body('endDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Invalid end date'),
  body('supervisorName').optional({ nullable: true }).trim().isLength({ max: 160 }),
  body('supervisorEmail').optional({ nullable: true, checkFalsy: true }).trim().isEmail().withMessage('Supervisor email must be valid'),
  body('department').optional({ nullable: true }).trim().isLength({ max: 160 }),
  body('stipend')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(['', 'paid', 'unpaid'])
    .withMessage('Stipend must be paid, unpaid, or empty'),
  handleValidationErrors
];

export const validateUpdateStatus = [
  param('id').isInt().withMessage('Invalid application ID'),
  body('status')
    .trim()
    .customSanitizer(value => value.toLowerCase().trim())
    .isIn(['applied', 'interviewing', 'offer', 'rejected', 'accepted', 'withdrawn'])
    .withMessage('Invalid status'),
  handleValidationErrors
];

export const validateApplicationId = [
  param('id').isInt().withMessage('Invalid application ID'),
  handleValidationErrors
];

export const validateGetApplications = [
  query('status').optional().isIn(['applied', 'interviewing', 'offer', 'rejected', 'accepted', 'withdrawn']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  handleValidationErrors
];

export const validateChecklistApplicationId = [
  param('id').isInt().withMessage('Invalid application ID'),
  handleValidationErrors
];

export const validateAddChecklistItem = [
  param('id').isInt().withMessage('Invalid application ID'),
  body('label').trim().notEmpty().withMessage('Checklist label is required').isLength({ max: 180 }),
  handleValidationErrors
];

export const validateUpdateChecklistItem = [
  param('id').isInt().withMessage('Invalid application ID'),
  param('itemId').isInt().withMessage('Invalid checklist item ID'),
  body('label').optional().trim().notEmpty().withMessage('Checklist label cannot be empty').isLength({ max: 180 }),
  body('completed').optional().isBoolean().withMessage('completed must be boolean'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('sortOrder must be a positive integer'),
  handleValidationErrors
];

export const validateDeleteChecklistItem = [
  param('id').isInt().withMessage('Invalid application ID'),
  param('itemId').isInt().withMessage('Invalid checklist item ID'),
  handleValidationErrors
];
