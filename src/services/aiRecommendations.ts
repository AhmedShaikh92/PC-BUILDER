import axios from 'axios';
import type { Component } from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Cache for AI suggestions to avoid repeated requests
const suggestionCache = new Map<string, { data: AISuggestion[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface AIBuildContext {
  selectedComponents: Record<string, {
    component: Component;
    selectedPrice: number;
  }>;
  totalPrice: number;
  useCase?: 'Gaming' | 'Productivity' | 'Office' | 'General';
  budget?: number;
}

export interface AISuggestion {
  type: 'upgrade' | 'downgrade' | 'alternative' | 'warning' | 'tip' | 'incompatible' | 'upsell';
  category: string;
  title: string;
  description: string;
  currentComponent?: Component;
  suggestedComponent?: Component;
  priceDifference?: number;
  savings?: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  impact: 'performance' | 'value' | 'reliability' | 'future-proofing' | 'compatibility';
  badge?: string;
  upgradeReason?: string;
}

/**
 * Generate cache key from build context
 */
function getCacheKey(context: AIBuildContext): string {
  const componentIds = Object.keys(context.selectedComponents)
    .sort()
    .map(cat => context.selectedComponents[cat].component._id)
    .join(',');
  return `${componentIds}_${context.useCase}`;
}

/**
 * Optimize payload by only sending essential component data
 */
function optimizePayload(context: AIBuildContext): AIBuildContext {
  return {
    ...context,
    selectedComponents: Object.entries(context.selectedComponents).reduce((acc, [cat, item]) => {
      acc[cat] = {
        component: {
          _id: item.component._id,
          name: item.component.name,
          category: item.component.category,
          brand: item.component.brand,
          specs: item.component.specs, // Keep specs as they're needed for compatibility
        } as Component,
        selectedPrice: item.selectedPrice,
      };
      return acc;
    }, {} as Record<string, any>),
  };
}

/**
 * Fetch AI-powered suggestions from backend with caching
 */
export async function fetchAISuggestions(
  buildContext: AIBuildContext
): Promise<AISuggestion[]> {
  const cacheKey = getCacheKey(buildContext);
  
  // Check cache first
  const cached = suggestionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Using cached AI suggestions');
    return cached.data;
  }

  try {
    // Optimize payload before sending
    const optimizedPayload = optimizePayload(buildContext);
    
    const response = await axios.post(`${API_URL}/ai/suggestions`, optimizedPayload, {
      timeout: 60000, // Increased from 30s to 60s for slower connections
      headers: {
        'Accept-Encoding': 'gzip, deflate', // Enable compression
      },
    });

    if (response.data.success && Array.isArray(response.data.suggestions)) {
      const suggestions = response.data.suggestions;
      // Cache the result
      suggestionCache.set(cacheKey, { data: suggestions, timestamp: Date.now() });
      return suggestions;
    }

    console.warn('Invalid AI response format:', response.data);
    return [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        console.error('AI request timeout - backend taking too long');
      } else {
        console.error('AI API Error:', error.response?.data || error.message);
      }
    } else {
      console.error('Unknown error fetching AI suggestions:', error);
    }
    // Return empty array on error - component will fall back to manual suggestions
    return [];
  }
}

/**
 * Check if AI service is available
 */
export async function checkAIAvailability(): Promise<boolean> {
  try {
    const response = await axios.get(`${API_URL}/ai/health`, { timeout: 3000 });
    return response.data.aiAvailable === true;
  } catch {
    return false;
  }
}

/**
 * Clear the suggestion cache (useful for forcing refreshes)
 */
export function clearSuggestionCache(): void {
  suggestionCache.clear();
  console.log('Suggestion cache cleared');
}

/**
 * Get cache size for debugging
 */
export function getCacheSize(): number {
  return suggestionCache.size;
}