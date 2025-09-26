const Joi = require('joi');

// Create match validation schema
const createMatchSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Match title is required',
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title cannot exceed 100 characters'
    }),
  
  description: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  
  format: Joi.string()
    .valid('5v5', '7v7', '11v11')
    .required()
    .messages({
      'any.only': 'Format must be one of: 5v5, 7v7, 11v11'
    }),
  
  type: Joi.string()
    .valid('public', 'private')
    .default('public')
    .messages({
      'any.only': 'Type must be either public or private'
    }),
  
  skillLevelRequired: Joi.string()
    .valid('Any', 'Beginner', 'Intermediate', 'Advanced', 'Semi-Pro', 'Professional')
    .default('Any')
    .messages({
      'any.only': 'Skill level must be one of: Any, Beginner, Intermediate, Advanced, Semi-Pro, Professional'
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
    address: Joi.string()
      .trim()
      .required()
      .messages({
        'string.empty': 'Match address is required'
      }),
    venue: Joi.string()
      .trim()
      .max(200)
      .allow('')
      .messages({
        'string.max': 'Venue name cannot exceed 200 characters'
      })
  }).required(),
  
  dateTime: Joi.date()
    .greater('now')
    .required()
    .messages({
      'date.greater': 'Match date must be in the future',
      'any.required': 'Match date and time is required'
    }),
  
  duration: Joi.number()
    .integer()
    .min(30)
    .max(180)
    .default(90)
    .messages({
      'number.min': 'Match duration must be at least 30 minutes',
      'number.max': 'Match duration cannot exceed 180 minutes'
    }),
  
  teams: Joi.object({
    teamA: Joi.object({
      name: Joi.string().trim().default('Team A'),
      color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#FF0000')
    }),
    teamB: Joi.object({
      name: Joi.string().trim().default('Team B'),
      color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#0000FF')
    })
  }),
  
  rules: Joi.object({
    allowSubstitutions: Joi.boolean().default(true),
    maxSubstitutions: Joi.number().integer().min(0).max(7).default(3),
    allowLatePlayers: Joi.boolean().default(true),
    lateJoinDeadline: Joi.number().integer().min(0).max(60).default(15)
  }),
  
  cost: Joi.object({
    perPlayer: Joi.number().min(0).default(0),
    currency: Joi.string().length(3).default('USD'),
    paymentMethod: Joi.string().valid('cash', 'card', 'app', 'free').default('free')
  }),
  
  tags: Joi.array()
    .items(Joi.string().trim().lowercase())
    .max(10)
    .messages({
      'array.max': 'Cannot have more than 10 tags'
    }),
  
  notes: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .messages({
      'string.max': 'Notes cannot exceed 1000 characters'
    }),
  
  isRecurring: Joi.boolean().default(false),
  
  recurringPattern: Joi.when('isRecurring', {
    is: true,
    then: Joi.object({
      frequency: Joi.string().valid('weekly', 'monthly').required(),
      interval: Joi.number().integer().min(1).max(12).required(),
      endDate: Joi.date().greater('now').required()
    }),
    otherwise: Joi.forbidden()
  })
});

// Update match validation schema
const updateMatchSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .messages({
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title cannot exceed 100 characters'
    }),
  
  description: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  
  skillLevelRequired: Joi.string()
    .valid('Any', 'Beginner', 'Intermediate', 'Advanced', 'Semi-Pro', 'Professional')
    .messages({
      'any.only': 'Skill level must be one of: Any, Beginner, Intermediate, Advanced, Semi-Pro, Professional'
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
    address: Joi.string()
      .trim()
      .messages({
        'string.empty': 'Match address cannot be empty'
      }),
    venue: Joi.string()
      .trim()
      .max(200)
      .allow('')
      .messages({
        'string.max': 'Venue name cannot exceed 200 characters'
      })
  }),
  
  dateTime: Joi.date()
    .greater('now')
    .messages({
      'date.greater': 'Match date must be in the future'
    }),
  
  duration: Joi.number()
    .integer()
    .min(30)
    .max(180)
    .messages({
      'number.min': 'Match duration must be at least 30 minutes',
      'number.max': 'Match duration cannot exceed 180 minutes'
    }),
  
  teams: Joi.object({
    teamA: Joi.object({
      name: Joi.string().trim(),
      color: Joi.string().pattern(/^#[0-9A-F]{6}$/i)
    }),
    teamB: Joi.object({
      name: Joi.string().trim(),
      color: Joi.string().pattern(/^#[0-9A-F]{6}$/i)
    })
  }),
  
  rules: Joi.object({
    allowSubstitutions: Joi.boolean(),
    maxSubstitutions: Joi.number().integer().min(0).max(7),
    allowLatePlayers: Joi.boolean(),
    lateJoinDeadline: Joi.number().integer().min(0).max(60)
  }),
  
  cost: Joi.object({
    perPlayer: Joi.number().min(0),
    currency: Joi.string().length(3),
    paymentMethod: Joi.string().valid('cash', 'card', 'app', 'free')
  }),
  
  tags: Joi.array()
    .items(Joi.string().trim().lowercase())
    .max(10)
    .messages({
      'array.max': 'Cannot have more than 10 tags'
    }),
  
  notes: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .messages({
      'string.max': 'Notes cannot exceed 1000 characters'
    }),
  
  status: Joi.string()
    .valid('open', 'full', 'ongoing', 'completed', 'cancelled')
    .messages({
      'any.only': 'Status must be one of: open, full, ongoing, completed, cancelled'
    })
});

// Join match validation schema
const joinMatchSchema = Joi.object({
  preferredPosition: Joi.string()
    .valid('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST')
    .allow(null)
    .messages({
      'any.only': 'Position must be one of: GK, CB, LB, RB, CDM, CM, CAM, LM, RM, LW, RW, ST'
    })
});

// Search matches validation schema
const searchMatchesSchema = Joi.object({
  // Location-based search
  longitude: Joi.number().min(-180).max(180),
  latitude: Joi.number().min(-180).max(180),
  distance: Joi.number().integer().min(100).max(100000).default(25000), // In meters
  
  // Filter options
  format: Joi.string().valid('5v5', '7v7', '11v11'),
  skillLevel: Joi.string().valid('Any', 'Beginner', 'Intermediate', 'Advanced', 'Semi-Pro', 'Professional'),
  status: Joi.string().valid('open', 'full', 'ongoing', 'completed'),
  type: Joi.string().valid('public', 'private'),
  
  // Date range
  dateFrom: Joi.date(),
  dateTo: Joi.date().greater(Joi.ref('dateFrom')),
  
  // Search query
  search: Joi.string().trim().max(100),
  
  // Pagination
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  
  // Sorting
  sortBy: Joi.string().valid('dateTime', 'createdAt', 'distance', 'availableSlots').default('dateTime'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc')
});

// Score update validation schema
const updateScoreSchema = Joi.object({
  teamAScore: Joi.number().integer().min(0).required(),
  teamBScore: Joi.number().integer().min(0).required()
});

// Validation helper function
const validateDto = (schema) => {
  return (req, res, next) => {
    let dataToValidate;
    
    // For GET requests, validate query parameters
    if (req.method === 'GET') {
      dataToValidate = req.query;
    } else {
      dataToValidate = req.body;
    }
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorMessage
      });
    }

    // For GET requests, update query parameters
    if (req.method === 'GET') {
      req.query = value;
    } else {
      req.body = value;
    }
    
    next();
  };
};

module.exports = {
  validateCreateMatch: validateDto(createMatchSchema),
  validateUpdateMatch: validateDto(updateMatchSchema),
  validateJoinMatch: validateDto(joinMatchSchema),
  validateSearchMatches: validateDto(searchMatchesSchema),
  validateUpdateScore: validateDto(updateScoreSchema)
};