import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
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
export interface PriceData {
  _id: string;
  componentId: string;
  vendor: string;
  price: number;
  productUrl: string;
  lastUpdated: string;
  __v?: number;
}

export interface Price {
  componentId: string;
  price: number;
  lastUpdated: string;
  vendor?: string;
  productUrl?: string;
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
      console.log("API Response:", response.data);

      // Extract components array from response
      if (response.data && Array.isArray(response.data.components)) {
        return response.data.components;
      }

      // Fallback: if response.data is already an array (in case API structure changes)
      if (Array.isArray(response.data)) {
        return response.data;
      }

      console.error("Unexpected API response structure:", response.data);
      return [];
    } catch (error) {
      console.error("Error fetching components:", error);
      throw error;
    }
  },

  // Prices
  getPrice: async (componentId: string): Promise<Price> => {
    try {
      console.log(componentId);

      const response = await api.get<PriceData[]>(
        `/prices/component/${componentId}`,
      );

      // Check if we got an array of prices
      if (
        !response.data ||
        !Array.isArray(response.data) ||
        response.data.length === 0
      ) {
        throw new Error("No price data available for this component");
      }

      // Find the lowest price from all vendors
      const lowestPriceData = response.data.reduce((lowest, current) =>
        current.price < lowest.price ? current : lowest,
      );

      // Return formatted price object
      return {
        componentId: lowestPriceData.componentId,
        price: lowestPriceData.price,
        lastUpdated: lowestPriceData.lastUpdated,
        vendor: lowestPriceData.vendor,
        productUrl: lowestPriceData.productUrl,
      };
    } catch (error) {
      console.error("Error fetching price:", error);
      throw error;
    }
  },
  // Get all prices for a component (all vendors)
  getAllPrices: async (componentId: string): Promise<PriceData[]> => {
    try {
      const response = await api.get<PriceData[]>(
        `/prices/component/${componentId}`,
      );

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Invalid price data received");
      }

      // Sort by price (lowest first)
      return response.data.sort((a, b) => a.price - b.price);
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
      // Helper function to capitalize first letter only
      const capitalize = (str: string): string =>
        str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

      // Transform frontend format to backend format
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

      console.log("Sending recommendation request:", backendRequest);

      // Validate request
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
      console.log("Recommendation response:", response);

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
      // Server responded with error status
      console.error("API Error Details:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method,
        requestData: error.config?.data, // Log what was sent
      });
    } else if (error.request) {
      // Request made but no response
      console.error("Network Error: No response received", error.request);
    } else {
      // Error in request setup
      console.error("Request Error:", error.message);
    }
    return Promise.reject(error);
  },
);

export default apiService;
