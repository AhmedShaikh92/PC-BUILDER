import axios from 'axios';
import type { Component } from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
 * Fetch AI-powered suggestions from backend
 */
export async function fetchAISuggestions(
  buildContext: AIBuildContext
): Promise<AISuggestion[]> {
  try {
    const response = await axios.post(`${API_URL}/ai/suggestions`, buildContext, {
      timeout: 30000, // 15s timeout for AI processing
    });

    if (response.data.success && Array.isArray(response.data.suggestions)) {
      return response.data.suggestions;
    }

    console.warn('Invalid AI response format:', response.data);
    return [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('AI API Error:', error.response?.data || error.message);
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