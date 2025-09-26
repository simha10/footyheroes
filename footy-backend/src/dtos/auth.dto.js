const Joi = require('joi');

// Register validation schema
const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters'
    }),
  
  username: Joi.string()
    .trim()
    .lowercase()
    .min(3)
    .max(20)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required()
    .messages({
      'string.empty': 'Username is required',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 20 characters',
      'string.pattern.base': 'Username can only contain letters, numbers, and underscores'
    }),
  
  email: Joi.string()
    .email()
    .lowercase()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address'
    }),
  
  password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters',
      'string.max': 'Password cannot exceed 100 characters'
    }),
  
  position: Joi.string()
    .valid('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST')
    .required()
    .messages({
      'any.only': 'Position must be one of: GK, CB, LB, RB, CDM, CM, CAM, LM, RM, LW, RW, ST'
    }),
  
  skillLevel: Joi.string()
    .valid('Beginner', 'Intermediate', 'Advanced', 'Semi-Pro', 'Professional')
    .default('Beginner')
    .messages({
      'any.only': 'Skill level must be one of: Beginner, Intermediate, Advanced, Semi-Pro, Professional'
    }),
  
  location: Joi.object({
    coordinates: Joi.array()
      .items(Joi.number().min(-180).max(180))
      .length(2)
      .required()
      .messages({
        'array.length': 'Location coordinates must contain exactly 2 numbers [longitude, latitude]',
        'number.min': 'Coordinates must be between -180 and 180',
        'number.max': 'Coordinates must be between -180 and 180'
      }),
    address: Joi.string().trim().allow('')
  }).required()
});

// Login validation schema
const loginSchema = Joi.object({
  identifier: Joi.string()
    .required()
    .messages({
      'string.empty': 'Email or username is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required'
    })
});

// Update profile validation schema
const updateProfileSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters'
    }),
  
  position: Joi.string()
    .valid('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST')
    .messages({
      'any.only': 'Position must be one of: GK, CB, LB, RB, CDM, CM, CAM, LM, RM, LW, RW, ST'
    }),
  
  skillLevel: Joi.string()
    .valid('Beginner', 'Intermediate', 'Advanced', 'Semi-Pro', 'Professional')
    .messages({
      'any.only': 'Skill level must be one of: Beginner, Intermediate, Advanced, Semi-Pro, Professional'
    }),
  
  location: Joi.object({
    coordinates: Joi.array()
      .items(Joi.number().min(-180).max(180))
      .length(2)
      .messages({
        'array.length': 'Location coordinates must contain exactly 2 numbers [longitude, latitude]',
        'number.min': 'Coordinates must be between -180 and 180',
        'number.max': 'Coordinates must be between -180 and 180'
      }),
    address: Joi.string().trim().allow('')
  }),
  
  bio: Joi.string()
    .trim()
    .max(200)
    .allow('')
    .messages({
      'string.max': 'Bio cannot exceed 200 characters'
    }),
  
  profilePicture: Joi.string()
    .uri()
    .allow('')
    .messages({
      'string.uri': 'Profile picture must be a valid URL'
    })
});

// Change password validation schema
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Current password is required'
    }),
  
  newPassword: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'New password must be at least 6 characters',
      'string.max': 'New password cannot exceed 100 characters'
    })
});

// Validation helper function
const validateDto = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorMessage
      });
    }

    req.body = value;
    next();
  };
};

module.exports = {
  validateRegister: validateDto(registerSchema),
  validateLogin: validateDto(loginSchema),
  validateUpdateProfile: validateDto(updateProfileSchema),
  validateChangePassword: validateDto(changePasswordSchema)
};