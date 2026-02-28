/**
 * Shared constants between client and server.
 * Import from this file in both client and server code.
 */

export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
};

export const COSTING_METHODS = {
  WEIGHTED_AVERAGE: 'WEIGHTED_AVERAGE',
  LATEST_PURCHASE: 'LATEST_PURCHASE',
  MANUAL_OVERRIDE: 'MANUAL_OVERRIDE',
};

export const PRODUCTION_STATUS = {
  PENDING: 'PENDING',
  IN_PRODUCTION: 'IN_PRODUCTION',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const PAYMENT_STATUS = {
  UNPAID: 'UNPAID',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
};

export const TRANSACTION_TYPES = {
  PURCHASE: 'PURCHASE',
  SALE: 'SALE',
  ADJUSTMENT: 'ADJUSTMENT',
  RESERVATION: 'RESERVATION',
  CANCELLATION: 'CANCELLATION',
};

export const RESERVATION_STATUS = {
  RESERVED: 'RESERVED',
  DEDUCTED: 'DEDUCTED',
  RELEASED: 'RELEASED',
};

export const SYSTEM_SETTING_KEYS = {
  COSTING_METHOD: 'costing_method',
  TAX_RATE: 'tax_rate',
  CURRENCY: 'currency',
  BUSINESS_NAME: 'business_name',
};
