import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Component {
  _id: string
  name: string
  category: string
  specs: Record<string, string>
  lowestPrice?: number
  lastUpdated?: string
}

export interface SelectedComponent {
  componentId: string
  component: Component
  selectedPrice: number
  currency: string       // always 'INR' from backend
  productUrl?: string
  vendor?: string        // which vendor this price came from
  inStock?: boolean      // stock status from backend
}

export interface SavedBuild {
  id: string
  name: string
  components: Record<string, SelectedComponent>
  totalPrice: number
  createdAt: string
  updatedAt: string
}

export interface BuildState {
  selectedComponents: Record<string, SelectedComponent>
  totalPrice: number
  savedBuilds: SavedBuild[]
  setComponent: (
    category: string,
    component: Component,
    price: number,
    productUrl?: string,
    vendor?: string,
    inStock?: boolean,
    currency?: string,
  ) => void
  removeComponent: (category: string) => void
  clearBuild: () => void
  calculateTotal: (prices: Record<string, number>) => void
  saveBuild: (name: string) => void
  loadBuild: (buildId: string) => void
  deleteSavedBuild: (buildId: string) => void
  updateSavedBuild: (buildId: string, name: string) => void
}

export const useBuildStore = create<BuildState>()(
  persist(
    (set, get) => ({
      selectedComponents: {},
      totalPrice: 0,
      savedBuilds: [],

      setComponent: (
        category,
        component,
        price,
        productUrl,
        vendor,
        inStock = true,
        currency = 'INR',
      ) => {
        set((state) => {
          const newComponents = {
            ...state.selectedComponents,
            [category]: {
              componentId: component._id,
              component,
              selectedPrice: price,
              currency,
              productUrl,
              vendor,
              inStock,
            },
          };

          const newTotal = Object.values(newComponents).reduce(
            (sum, comp) => sum + comp.selectedPrice,
            0,
          );

          return {
            selectedComponents: newComponents,
            totalPrice: newTotal,
          };
        });
      },

      removeComponent: (category) => {
        set((state) => {
          const newComponents = { ...state.selectedComponents };
          delete newComponents[category];

          const newTotal = Object.values(newComponents).reduce(
            (sum, comp) => sum + comp.selectedPrice,
            0,
          );

          return {
            selectedComponents: newComponents,
            totalPrice: newTotal,
          };
        });
      },

      clearBuild: () => {
        set({ selectedComponents: {}, totalPrice: 0 });
      },

      calculateTotal: (prices) => {
        set((state) => {
          const total = Object.values(state.selectedComponents).reduce(
            (sum, comp) => sum + (prices[comp.componentId] ?? comp.selectedPrice),
            0,
          );
          return { totalPrice: total };
        });
      },

      saveBuild: (name: string) => {
        const state = get();
        const buildId = `build_${Date.now()}`;
        const newBuild: SavedBuild = {
          id: buildId,
          name: name || `Build ${state.savedBuilds.length + 1}`,
          components: state.selectedComponents,
          totalPrice: state.totalPrice,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          savedBuilds: [...state.savedBuilds, newBuild],
        }));

        return buildId;
      },

      loadBuild: (buildId: string) => {
        const state = get();
        const build = state.savedBuilds.find((b) => b.id === buildId);

        if (build) {
          set({
            selectedComponents: build.components,
            totalPrice: build.totalPrice,
          });
        }
      },

      deleteSavedBuild: (buildId: string) => {
        set((state) => ({
          savedBuilds: state.savedBuilds.filter((b) => b.id !== buildId),
        }));
      },

      updateSavedBuild: (buildId: string, name: string) => {
        set((state) => ({
          savedBuilds: state.savedBuilds.map((b) =>
            b.id === buildId
              ? { ...b, name, updatedAt: new Date().toISOString() }
              : b,
          ),
        }));
      },
    }),
    {
      name: 'pc-builder-storage',
      partialize: (state) => ({
        savedBuilds: state.savedBuilds,
      }),
    },
  ),
);

export const useScrollStore = create<{
  scrollProgress: number;
  setScrollProgress: (value: number) => void;
}>((set) => ({
  scrollProgress: 0,
  setScrollProgress: (value) => set({ scrollProgress: value }),
}));