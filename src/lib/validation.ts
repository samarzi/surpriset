/**
 * Система валидации форм
 */

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
  email?: boolean
  phone?: boolean
  min?: number
  max?: number
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export interface FormSchema {
  [fieldName: string]: ValidationRule
}

/**
 * Валидация одного поля
 */
export function validateField(value: any, rules: ValidationRule): string | null {
  // Проверка обязательности
  if (rules.required && (value === null || value === undefined || value === '')) {
    return 'Это поле обязательно для заполнения'
  }

  // Если поле пустое и не обязательное, пропускаем остальные проверки
  if (!rules.required && (value === null || value === undefined || value === '')) {
    return null
  }

  const stringValue = String(value)

  // Проверка минимальной длины
  if (rules.minLength && stringValue.length < rules.minLength) {
    return `Минимальная длина: ${rules.minLength} символов`
  }

  // Проверка максимальной длины
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    return `Максимальная длина: ${rules.maxLength} символов`
  }

  // Проверка email
  if (rules.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(stringValue)) {
      return 'Введите корректный email адрес'
    }
  }

  // Проверка телефона
  if (rules.phone) {
    const phoneRegex = /^(\+7|7|8)?[\s-]?\(?[489][0-9]{2}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/
    if (!phoneRegex.test(stringValue.replace(/\s/g, ''))) {
      return 'Введите корректный номер телефона'
    }
  }

  // Проверка паттерна
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    return 'Неверный формат данных'
  }

  // Проверка числовых значений
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      return `Минимальное значение: ${rules.min}`
    }

    if (rules.max !== undefined && value > rules.max) {
      return `Максимальное значение: ${rules.max}`
    }
  }

  // Кастомная валидация
  if (rules.custom) {
    const customError = rules.custom(value)
    if (customError) {
      return customError
    }
  }

  return null
}

/**
 * Валидация всей формы
 */
export function validateForm(data: Record<string, any>, schema: FormSchema): ValidationResult {
  const errors: Record<string, string> = {}

  for (const [fieldName, rules] of Object.entries(schema)) {
    const value = data[fieldName]
    const error = validateField(value, rules)
    
    if (error) {
      errors[fieldName] = error
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Предопределенные схемы валидации
 */
export const validationSchemas = {
  // Схема для регистрации пользователя
  userRegistration: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[а-яёa-z\s]+$/i
    },
    email: {
      required: true,
      email: true
    },
    phone: {
      required: true,
      phone: true
    },
    password: {
      required: true,
      minLength: 6,
      maxLength: 100,
      custom: (value: string) => {
        if (!/(?=.*[a-z])/.test(value)) {
          return 'Пароль должен содержать хотя бы одну строчную букву'
        }
        if (!/(?=.*[A-Z])/.test(value)) {
          return 'Пароль должен содержать хотя бы одну заглавную букву'
        }
        if (!/(?=.*\d)/.test(value)) {
          return 'Пароль должен содержать хотя бы одну цифру'
        }
        return null
      }
    }
  },

  // Схема для оформления заказа
  checkout: {
    customer_name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[а-яёa-z\s]+$/i
    },
    customer_email: {
      required: true,
      email: true
    },
    customer_phone: {
      required: true,
      phone: true
    },
    customer_address: {
      required: false,
      maxLength: 500
    }
  },

  // Схема для создания товара
  product: {
    name: {
      required: true,
      minLength: 3,
      maxLength: 200
    },
    description: {
      required: true,
      minLength: 10,
      maxLength: 2000
    },
    price: {
      required: true,
      min: 1,
      max: 1000000,
      custom: (value: number) => {
        if (!Number.isInteger(value)) {
          return 'Цена должна быть целым числом'
        }
        return null
      }
    },
    sku: {
      required: true,
      minLength: 3,
      maxLength: 50,
      pattern: /^[A-Z0-9-_]+$/
    }
  },

  // Схема для обратной связи
  contact: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100
    },
    email: {
      required: true,
      email: true
    },
    subject: {
      required: true,
      minLength: 5,
      maxLength: 200
    },
    message: {
      required: true,
      minLength: 10,
      maxLength: 2000
    }
  },

  // Схема для поиска
  search: {
    query: {
      required: true,
      minLength: 2,
      maxLength: 100
    }
  }
}

/**
 * Хук для валидации форм в React компонентах
 */
export function useFormValidation(schema: FormSchema) {
  const validate = (data: Record<string, any>) => {
    return validateForm(data, schema)
  }

  const validateField = (fieldName: string, value: any) => {
    const rules = schema[fieldName]
    if (!rules) return null
    
    return validateField(value, rules)
  }

  return {
    validate,
    validateField
  }
}

/**
 * Утилиты для работы с ошибками валидации
 */
export const validationUtils = {
  /**
   * Получить первую ошибку из объекта ошибок
   */
  getFirstError(errors: Record<string, string>): string | null {
    const firstKey = Object.keys(errors)[0]
    return firstKey ? errors[firstKey] : null
  },

  /**
   * Проверить, есть ли ошибки для конкретного поля
   */
  hasFieldError(errors: Record<string, string>, fieldName: string): boolean {
    return fieldName in errors
  },

  /**
   * Получить ошибку для конкретного поля
   */
  getFieldError(errors: Record<string, string>, fieldName: string): string | null {
    return errors[fieldName] || null
  },

  /**
   * Очистить ошибки для конкретного поля
   */
  clearFieldError(errors: Record<string, string>, fieldName: string): Record<string, string> {
    const newErrors = { ...errors }
    delete newErrors[fieldName]
    return newErrors
  },

  /**
   * Добавить ошибку для поля
   */
  setFieldError(errors: Record<string, string>, fieldName: string, error: string): Record<string, string> {
    return {
      ...errors,
      [fieldName]: error
    }
  }
}