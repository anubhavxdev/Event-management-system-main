import { body, validationResult } from 'express-validator';

export const signupValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['attendee', 'organizer'])
    .withMessage('Role must be either attendee or organizer'),
];

export const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const eventValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3 })
    .withMessage('Title must be at least 3 characters long'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['Tech', 'Sports', 'Cultural', 'Workshop', 'Business'])
    .withMessage('Category must be one of: Tech, Sports, Cultural, Workshop, Business'),

  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Please provide a valid ISO8601 date'),

  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required'),

  body('capacity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Capacity must be a non-negative integer'),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
];

export const reviewValidation = [
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),

  body('comment')
    .optional()
    .trim()
    .isString()
    .withMessage('Comment must be a string'),
];

export const coOrganizerValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
];

export const checkInValidation = [
  body('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid User ID format'),
  body('status')
    .optional()
    .trim()
    .isIn(['attended', 'cancelled', 'no-show'])
    .withMessage('Status must be one of: attended, cancelled, no-show'),
];

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

