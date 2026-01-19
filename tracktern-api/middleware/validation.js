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
  body('status').optional().isIn(['pending', 'accepted', 'rejected', 'interviewing', 'offered']),
  body('dateApplied').optional().isISO8601().withMessage('Invalid date format'),
  handleValidationErrors
];

export const validateUpdateApplication = [
  param('id').isInt().withMessage('Invalid application ID'),
  body('companyName').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
  body('companyAddress').optional().trim().notEmpty().withMessage('Company address cannot be empty'),
  handleValidationErrors
];

export const validateUpdateStatus = [
  param('id').isInt().withMessage('Invalid application ID'),
  body('status').isIn(['pending', 'accepted', 'rejected', 'interviewing', 'offered']).withMessage('Invalid status'),
  handleValidationErrors
];

export const validateApplicationId = [
  param('id').isInt().withMessage('Invalid application ID'),
  handleValidationErrors
];

export const validateGetApplications = [
  query('status').optional().isIn(['pending', 'accepted', 'rejected', 'interviewing', 'offered']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  handleValidationErrors
];