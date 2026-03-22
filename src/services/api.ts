import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Increased from 10s to 30s for slower connections/servers
});

export interface Component {
  _id: string;
  name: string;
  category: string;
  brand?: string;
  specs: Record<string, any>;
  benchmarkScore?: number;
  lowestPrice?: number;
  lastUpdated?: string;
  createdAt?: string;
  __v?: number;
}

// Matches backend Price model: componentId, vendor, price, currency, productUrl, lastUpdated, inStock
export interface PriceData {
  _id: string;
  componentId: string;
  vendor: string;
  price: number;
  currency: string;        // always 'INR' from seed
  productUrl: string;
  lastUpdated: string;
  inStock: boolean;        // seeded as true/false
  __v?: number;
}

export interface Price {
  componentId: string;
  price: number;
  currency: string;
  lastUpdated: string;
  vendor?: string;
  productUrl?: string;
  inStock?: boolean;
}

export interface RecommendationRequest {
  budget: number;
  useCase: "Gaming" | "Productivity" | "Office";
  preference: "AMD" | "Intel" | "Any";
  includeGPU?: boolean;
}

export interface RecommendationFormData {
  budget: number;
  useCase: "gaming" | "productivity" | "office";
  cpuPreference: "amd" | "intel" | "any";
}

export interface BuildRecommendation {
  budgetTier: string; // "Entry" | "Mid" | "High"
  requiredWattage: number;
  components: Array<{
    category: string;
    component: Component;
  }>;
  totalEstimatedPrice: number;
  withinBudget: boolean;
  compatibilityErrors: string[];
  suggestions?: string[];
}

// Response types for paginated data
interface ComponentsResponse {
  components: Component[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const apiService = {
  // Components
  getComponents: async (category: string): Promise<Component[]> => {
    try {
      const response = await api.get<ComponentsResponse>(
        `/components?category=${category}`,
      );

      // Extract components array from response
      if (response.data && Array.isArray(response.data.components)) {
        return response.data.components;
      }

      // Fallback: if response.data is already an array (in case API structure changes)
      if (Array.isArray(response.data)) {
        return response.data as unknown as Component[];
      }

      console.error("Unexpected API response structure:", response.data);
      return [];
    } catch (error) {
      console.error("Error fetching components:", error);
      throw error;
    }
  },

  // Prices — returns the lowest IN-STOCK price, falls back to any if all out of stock
  getPrice: async (componentId: string): Promise<Price> => {
    try {
      const response = await api.get<PriceData[]>(
        `/prices/component/${componentId}`,
      );

      if (
        !response.data ||
        !Array.isArray(response.data) ||
        response.data.length === 0
      ) {
        throw new Error("No price data available for this component");
      }

      // Prefer in-stock entries; fall back to all if none are in stock
      const inStockPrices = response.data.filter((p) => p.inStock);
      const pool = inStockPrices.length > 0 ? inStockPrices : response.data;

      const lowestPriceData = pool.reduce((lowest, current) =>
        current.price < lowest.price ? current : lowest,
      );

      return {
        componentId: lowestPriceData.componentId,
        price: lowestPriceData.price,
        currency: lowestPriceData.currency,
        lastUpdated: lowestPriceData.lastUpdated,
        vendor: lowestPriceData.vendor,
        productUrl: lowestPriceData.productUrl,
        inStock: lowestPriceData.inStock,
      };
    } catch (error) {
      console.error("Error fetching price:", error);
      throw error;
    }
  },

  // Get all prices for a component (all vendors), sorted lowest first
  getAllPrices: async (componentId: string): Promise<PriceData[]> => {
    try {
      const response = await api.get<PriceData[]>(
        `/prices/component/${componentId}`,
      );

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Invalid price data received");
      }

      // Sort: in-stock first, then by price ascending
      return response.data.sort((a, b) => {
        if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
        return a.price - b.price;
      });
    } catch (error) {
      console.error("Error fetching all prices:", error);
      throw error;
    }
  },

  getBuildPrice: async (
    componentIds: string[],
  ): Promise<Record<string, number>> => {
    try {
      if (!Array.isArray(componentIds) || componentIds.length === 0) {
        throw new Error("Component IDs must be a non-empty array");
      }

      const response = await api.post<Record<string, number>>("/prices/build", {
        componentIds,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching build price:", error);
      throw error;
    }
  },

  // Recommendations
  getRecommendedBuild: async (
    request: RecommendationFormData,
  ): Promise<BuildRecommendation> => {
    try {
      const capitalize = (str: string): string =>
        str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

      const backendRequest: RecommendationRequest = {
        budget: request.budget,
        useCase: capitalize(request.useCase) as
          | "Gaming"
          | "Productivity"
          | "Office",
        preference:
          request.cpuPreference === "any"
            ? "Any"
            : (request.cpuPreference.toUpperCase() as "AMD" | "Intel" | "Any"),
        includeGPU: true,
      };

      if (!backendRequest.budget || backendRequest.budget <= 0) {
        throw new Error("Budget must be a positive number");
      }

      if (
        !["Gaming", "Productivity", "Office"].includes(backendRequest.useCase)
      ) {
        throw new Error("Invalid use case");
      }

      if (!["AMD", "Intel", "Any"].includes(backendRequest.preference)) {
        throw new Error("Invalid CPU preference");
      }

      const response = await api.post<BuildRecommendation>(
        "/recommend/build",
        backendRequest,
      );

      if (!response.data || !Array.isArray(response.data.components)) {
        throw new Error("Invalid recommendation data received");
      }

      return response.data;
    } catch (error) {
      console.error("Error getting recommendation:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server error details:", error.response.data);
      }
      throw error;
    }
  },

  // Compatibility checks
  checkCompatibility: async (
    cpuId: string,
    mbId: string,
  ): Promise<{ compatible: boolean; message?: string }> => {
    try {
      if (!cpuId || !mbId) {
        throw new Error("CPU ID and Motherboard ID are required");
      }

      const response = await api.get<{ compatible: boolean; message?: string }>(
        `/compatibility/check?cpuId=${cpuId}&mbId=${mbId}`,
      );

      if (typeof response.data.compatible !== "boolean") {
        throw new Error("Invalid compatibility data received");
      }

      return response.data;
    } catch (error) {
      console.error("Error checking compatibility:", error);
      throw error;
    }
  },
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error("API Error Details:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method,
        requestData: error.config?.data,
      });
    } else if (error.request) {
      console.error("Network Error: No response received", error.request);
    } else {
      console.error("Request Error:", error.message);
    }
    return Promise.reject(error);
  },
);

export default apiService;