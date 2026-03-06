// Color constants for theming
export const COLORS = {
  primary: '#1e1e2e',
  secondary: '#2d2d44',
  accent: '#a8e6cf',
  accentAlt: '#7c3aed',
  text: '#e0e0e0',
  textMuted: 'rgba(224, 224, 224, 0.6)',
  dark: '#0f0f1e',
} as const

// Component categories for PC building
export const COMPONENT_CATEGORIES = [
  'CPU',
  'Motherboard',
  'RAM',
  'Storage',
  'PSU',
  'Case',
  'GPU',
  'CPU Cooler',
  'Case Fans',
] as const

// Use cases for recommendations
export const USE_CASES = ['gaming', 'productivity', 'office'] as const

// CPU preferences
export const CPU_PREFERENCES = ['amd', 'intel', 'any'] as const

// Budget ranges for recommendations
export const BUDGET_RANGES = {
  MIN: 500,
  MAX: 5000,
  STEP: 100,
} as const

// API endpoints (relative to base URL)
export const API_ENDPOINTS = {
  COMPONENTS: '/components',
  PRICES: '/prices',
  PRICES_BUILD: '/prices/build',
  RECOMMEND: '/recommend/build',
  COMPATIBILITY: '/compatibility/check',
} as const

// Animation timings (in milliseconds)
export const ANIMATION_TIMINGS = {
  SCROLL_ANIMATION: 0.3,
  FADE_IN: 0.6,
  STAGGER: 0.2,
} as const
