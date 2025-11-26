// Input validation utilities for security

export const VALIDATION_LIMITS = {
  PARTNER_NICKNAME: { min: 2, max: 50 },
  GROUP_NAME: { min: 2, max: 100 },
  NOTE_CONTENT: { min: 1, max: 2000 },
  STICKY_NOTE: { min: 1, max: 500 },
  BET_TITLE: { min: 3, max: 200 },
  BET_DESCRIPTION: { min: 0, max: 1000 },
  RED_FLAG_DESCRIPTION: { min: 10, max: 1000 },
  TIMELINE_TITLE: { min: 2, max: 200 },
  TIMELINE_DESCRIPTION: { min: 0, max: 2000 },
  USERNAME: { min: 2, max: 50 },
  CAUSE_OF_DEATH: { min: 0, max: 200 },
} as const;

// Patterns for XSS prevention
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<link/gi,
  /<meta/gi,
];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Sanitize a string to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";

  let sanitized = input;

  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }

  // Encode HTML entities
  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

  return sanitized.trim();
}

/**
 * Validate partner nickname
 */
export function validatePartnerNickname(nickname: string): ValidationResult {
  const trimmed = nickname?.trim() || "";
  const limits = VALIDATION_LIMITS.PARTNER_NICKNAME;

  if (trimmed.length < limits.min) {
    return {
      isValid: false,
      error: `Nickname must be at least ${limits.min} characters`,
    };
  }

  if (trimmed.length > limits.max) {
    return {
      isValid: false,
      error: `Nickname cannot exceed ${limits.max} characters`,
    };
  }

  // Check for dangerous content
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        error: "Nickname contains invalid characters",
      };
    }
  }

  return {
    isValid: true,
    sanitized: trimmed,
  };
}

/**
 * Validate group name
 */
export function validateGroupName(name: string): ValidationResult {
  const trimmed = name?.trim() || "";
  const limits = VALIDATION_LIMITS.GROUP_NAME;

  if (trimmed.length < limits.min) {
    return {
      isValid: false,
      error: `Group name must be at least ${limits.min} characters`,
    };
  }

  if (trimmed.length > limits.max) {
    return {
      isValid: false,
      error: `Group name cannot exceed ${limits.max} characters`,
    };
  }

  return {
    isValid: true,
    sanitized: trimmed,
  };
}

/**
 * Validate note content
 */
export function validateNoteContent(
  content: string,
  type: "NOTE_CONTENT" | "STICKY_NOTE" = "NOTE_CONTENT"
): ValidationResult {
  const trimmed = content?.trim() || "";
  const limits = VALIDATION_LIMITS[type];

  if (trimmed.length < limits.min) {
    return {
      isValid: false,
      error: `Content must be at least ${limits.min} character`,
    };
  }

  if (trimmed.length > limits.max) {
    return {
      isValid: false,
      error: `Content cannot exceed ${limits.max} characters`,
    };
  }

  return {
    isValid: true,
    sanitized: trimmed,
  };
}

/**
 * Validate timeline event
 */
export function validateTimelineEvent(title: string, description?: string): ValidationResult {
  const trimmedTitle = title?.trim() || "";
  const trimmedDesc = description?.trim() || "";

  if (trimmedTitle.length < VALIDATION_LIMITS.TIMELINE_TITLE.min) {
    return {
      isValid: false,
      error: `Title must be at least ${VALIDATION_LIMITS.TIMELINE_TITLE.min} characters`,
    };
  }

  if (trimmedTitle.length > VALIDATION_LIMITS.TIMELINE_TITLE.max) {
    return {
      isValid: false,
      error: `Title cannot exceed ${VALIDATION_LIMITS.TIMELINE_TITLE.max} characters`,
    };
  }

  if (trimmedDesc.length > VALIDATION_LIMITS.TIMELINE_DESCRIPTION.max) {
    return {
      isValid: false,
      error: `Description cannot exceed ${VALIDATION_LIMITS.TIMELINE_DESCRIPTION.max} characters`,
    };
  }

  return {
    isValid: true,
    sanitized: trimmedTitle,
  };
}

/**
 * Validate numeric input within bounds
 */
export function validateNumericInput(
  value: number,
  min: number,
  max: number,
  fieldName: string = "Value"
): ValidationResult {
  if (typeof value !== "number" || isNaN(value)) {
    return {
      isValid: false,
      error: `${fieldName} must be a valid number`,
    };
  }

  if (value < min) {
    return {
      isValid: false,
      error: `${fieldName} cannot be less than ${min}`,
    };
  }

  if (value > max) {
    return {
      isValid: false,
      error: `${fieldName} cannot be greater than ${max}`,
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Validate intimacy score (0-10)
 */
export function validateIntimacyScore(score: number): ValidationResult {
  return validateNumericInput(score, 0, 10, "Intimacy score");
}

/**
 * Validate financial amount (non-negative)
 */
export function validateFinancialAmount(amount: number): ValidationResult {
  return validateNumericInput(amount, 0, 1000000, "Financial amount");
}

/**
 * Validate time hours (non-negative)
 */
export function validateTimeHours(hours: number): ValidationResult {
  return validateNumericInput(hours, 0, 10000, "Time hours");
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmed = email?.trim() || "";

  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: "Invalid email format",
    };
  }

  return {
    isValid: true,
    sanitized: trimmed.toLowerCase(),
  };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      error: "Password must be at least 8 characters",
    };
  }

  // Check for at least one uppercase, one lowercase, one number
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return {
      isValid: false,
      error: "Password must contain uppercase, lowercase, and a number",
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Rate limiting helper - tracks actions per user
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  userId: string,
  action: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}
