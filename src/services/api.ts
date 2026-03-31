import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// ─── Existing component/price types (unchanged) ───────────────────────────────

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
  currency: string;
  productUrl: string;
  lastUpdated: string;
  inStock: boolean;
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

// ─── New product types ────────────────────────────────────────────────────────

export type ProductType = "Laptop" | "PreBuiltPC";
export type UseCase =
  | "Gaming"
  | "Office"
  | "Productivity"
  | "Streaming"
  | "Content Creation"
  | "Programming"
  | "Editing"
  | "Student"
  | "Any";

export interface ProductSpecs {
  cpu?: string;
  gpu?: string | null;
  ramGB?: number;
  storageGB?: number;
  storageType?: "SSD" | "HDD" | "SSD+HDD";
  // Laptop-specific
  displayInches?: number;
  batteryWh?: number;
  weightKg?: number;
  os?: string;
  // PreBuiltPC-specific
  formFactor?: string;
  psuWattage?: number;
}

export interface Product {
  _id: string;
  name: string;
  type: ProductType;
  brand: string;
  useCases: UseCase[];
  imageUrl: string | null;
  specs: ProductSpecs;
  benchmarkScore: number;
  createdAt?: string;
}

export interface ProductResult {
  product: Product;
  estimatedPrice: number;
  withinBudget: boolean;
}

// ─── Request / Response types ─────────────────────────────────────────────────

export interface RecommendationFormData {
  budget: number;
  useCase: UseCase;
  brand: string;
  type: ProductType;
}

export interface ProductRecommendationResponse {
  budgetTier: "Entry" | "Mid" | "High";
  useCase: UseCase;
  brand: string;
  results: {
    laptop?: ProductResult[];
    preBuiltPC?: ProductResult[];
  };
  suggestions?: string[];
}

export interface ProductPriceRequest {
  productIds: string[];
}

// A single vendor entry as returned by the /recommend/price endpoint
export interface VendorPriceEntry {
  vendor: string;
  price: number;
  productUrl?: string;
  inStock?: boolean;
}

export interface ProductPriceItem {
  productId: string;
  name: string;
  type: ProductType;
  brand: string;
  // Full list of vendor prices for this product
  prices: VendorPriceEntry[];
  // Convenience: the single lowest-price vendor (kept for backwards compat)
  lowest: {
    vendor: string;
    price: number;
    productUrl?: string;
  };
}

export interface ProductPriceResponse {
  products: ProductPriceItem[];
  totalLowestPrice: number;
}

// ─── Paginated components response (unchanged) ───────────────────────────────

interface ComponentsResponse {
  components: Component[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ─── API service ──────────────────────────────────────────────────────────────

export const apiService = {
  // ── Components (unchanged) ──────────────────────────────────────────────────
  getComponents: async (category: string): Promise<Component[]> => {
    try {
      const response = await api.get<ComponentsResponse>(
        `/components?category=${category}`,
      );
      if (response.data && Array.isArray(response.data.components)) {
        return response.data.components;
      }
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

  // ── Prices (unchanged) ──────────────────────────────────────────────────────
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

  getAllPrices: async (componentId: string): Promise<PriceData[]> => {
    try {
      const response = await api.get<PriceData[]>(
        `/prices/component/${componentId}`,
      );
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Invalid price data received");
      }
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

  // ── Product recommendation ───────────────────────────────────────────────────
  getProductRecommendation: async (
    request: RecommendationFormData,
  ): Promise<ProductRecommendationResponse> => {
    try {
      if (!request.budget || request.budget <= 0) {
        throw new Error("Budget must be a positive number");
      }

      const response = await api.post<ProductRecommendationResponse>(
        "/recommend/product",
        {
          budget: request.budget,
          useCase: request.useCase,
          brand: request.brand === "Any" ? undefined : request.brand,
          type: request.type,
        },
      );

      if (!response.data || !response.data.results) {
        throw new Error("Invalid recommendation data received");
      }

      return response.data;
    } catch (error) {
      console.error("Error getting product recommendation:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server error details:", error.response.data);
      }
      throw error;
    }
  },

  // ── Product price lookup ─────────────────────────────────────────────────────
  // Returns full prices[] per product including all vendors
  getProductPrice: async (
    productIds: string[],
  ): Promise<ProductPriceResponse> => {
    try {
      if (!Array.isArray(productIds) || productIds.length === 0) {
        throw new Error("productIds must be a non-empty array");
      }
      const response = await api.post<ProductPriceResponse>(
        "/recommend/price",
        { productIds },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching product prices:", error);
      throw error;
    }
  },

  // ── Compatibility (unchanged) ───────────────────────────────────────────────
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

// ─── Interceptor (unchanged) ──────────────────────────────────────────────────

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