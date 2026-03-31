import React, { useEffect, useState } from "react";
import {
  Loader2,
  Monitor,
  Laptop,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  SlidersHorizontal,
  X,
  ExternalLink,
  ShoppingCart,
  Tag,
} from "lucide-react";
import apiService from "../services/api";
import type {
  ProductRecommendationResponse,
  ProductResult,
  UseCase,
  ProductType,
  ProductPriceItem,
} from "../services/api";
import axios from "axios";

const USE_CASES: UseCase[] = [
  "Any",
  "Gaming",
  "Office",
  "Productivity",
  "Streaming",
  "Content Creation",
  "Programming",
  "Editing",
  "Student",
];

const BRANDS = [
  "Any",
  "ASUS",
  "HP",
  "Dell",
  "Lenovo",
  "MSI",
  "Acer",
  "Apple",
  "Ant PC",
  "Zebronics",
];

const formatINR = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

const formatSpec = (key: string, value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;
  const labels: Record<string, string> = {
    cpu: "CPU",
    gpu: "GPU",
    ramGB: "RAM",
    storageGB: "Storage",
    storageType: "Storage Type",
    displayInches: "Display",
    batteryWh: "Battery",
    weightKg: "Weight",
    os: "OS",
    formFactor: "Form Factor",
    psuWattage: "PSU",
  };
  const units: Record<string, string> = {
    ramGB: "GB",
    storageGB: "GB",
    displayInches: '"',
    batteryWh: "Wh",
    weightKg: "kg",
    psuWattage: "W",
  };
  return `${labels[key] ?? key}: ${value}${units[key] ?? ""}`;
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface VendorInfo {
  vendor: string;
  price: number;
  productUrl?: string;
  inStock?: boolean;
}

// ─── SpecBadge ────────────────────────────────────────────────────────────────
function SpecBadge({ label }: { label: string }) {
  return (
    <span className="inline-block px-2 py-0.5 border border-neutral-800 text-neutral-400 text-xs rounded-sm">
      {label}
    </span>
  );
}

// ─── VendorPriceSection ───────────────────────────────────────────────────────
function VendorPriceSection({ vendors }: { vendors: VendorInfo[] }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!vendors || vendors.length === 0) return null;

  // Sort: in-stock first, then by ascending price
  const sorted = [...vendors].sort((a, b) => {
    if ((a.inStock ?? true) !== (b.inStock ?? true))
      return (a.inStock ?? true) ? -1 : 1;
    return a.price - b.price;
  });

  const best = sorted[0];
  const others = sorted.slice(1);

  return (
    <div className="px-5 pb-5 border-t border-neutral-800 pt-4 space-y-2">
      {/* Best / lowest price vendor */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Tag size={13} className="text-emerald-500 shrink-0" />
          <span className="text-xs text-neutral-400 truncate">
            Best price on{" "}
            <span className="text-neutral-200 font-medium">{best.vendor}</span>
          </span>
          {best.inStock === false && (
            <span className="text-[10px] px-1.5 py-0.5 bg-red-950/40 text-red-400 border border-red-900/40 rounded-sm shrink-0">
              OOS
            </span>
          )}
        </div>
        {best.productUrl ? (
          <a
            href={best.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 text-neutral-950 text-xs
              font-medium hover:bg-neutral-200 transition-colors rounded-sm shrink-0 whitespace-nowrap"
          >
            <ShoppingCart size={11} />
            Buy · {formatINR(best.price)}
          </a>
        ) : (
          <span className="text-xs text-neutral-300 font-medium shrink-0">
            {formatINR(best.price)}
          </span>
        )}
      </div>

      {/* Other vendors dropdown */}
      {others.length > 0 && (
        <div>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-400
              transition-colors cursor-pointer py-1"
          >
            {dropdownOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {dropdownOpen
              ? "Hide other vendors"
              : `View ${others.length} more vendor${others.length > 1 ? "s" : ""}`}
          </button>

          {dropdownOpen && (
            <div className="mt-1.5 space-y-1.5 border border-neutral-800 rounded-sm p-3 bg-neutral-900/60">
              {others.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-neutral-400 truncate">
                      {v.vendor}
                    </span>
                    {v.inStock === false && (
                      <span className="text-[10px] px-1 py-0.5 bg-red-950/40 text-red-400 border border-red-900/40 rounded-sm shrink-0">
                        OOS
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-neutral-300">
                      {formatINR(v.price)}
                    </span>
                    {v.productUrl && (
                      <a
                        href={v.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-500 hover:text-neutral-200 transition-colors"
                        title={`Buy on ${v.vendor}`}
                      >
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ProductCard ──────────────────────────────────────────────────────────────
function ProductCard({
  result,
  typeLabel,
  icon,
  isBest,
  vendors,
}: {
  result: ProductResult;
  typeLabel: string;
  icon: React.ReactNode;
  isBest?: boolean;
  vendors: VendorInfo[];
}) {
  const [expanded, setExpanded] = useState(false);
  const { product, withinBudget, estimatedPrice } = result;

  const specs = Object.entries(product.specs)
    .map(([k, v]) => formatSpec(k, v))
    .filter(Boolean) as string[];

  const displayPrice =
    vendors.length > 0
      ? Math.min(...vendors.map((v) => v.price))
      : estimatedPrice;

  return (
    <div
      className={`border transition-colors overflow-hidden rounded-sm ${
        isBest
          ? "border-neutral-500 hover:border-neutral-400"
          : "border-neutral-800 hover:border-neutral-700"
      }`}
    >
      {isBest && (
        <div className="bg-neutral-100 text-neutral-950 text-xs font-semibold px-4 py-1.5 tracking-wider uppercase">
          ★ Best Match
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-neutral-800 bg-neutral-900/50">
        <span className="text-neutral-500">{icon}</span>
        <span className="text-xs text-neutral-500 uppercase tracking-widest">
          {typeLabel}
        </span>
        {!withinBudget ? (
          <span className="ml-auto flex items-center gap-1 text-yellow-600 text-xs border border-yellow-900/50 px-2 py-0.5 rounded-sm">
            <AlertTriangle size={11} /> Over budget
          </span>
        ) : (
          <span className="ml-auto text-xs text-emerald-600 border border-emerald-900/40 px-2 py-0.5 rounded-sm">
            Within budget
          </span>
        )}
      </div>

      {/* Image hero */}
      <div
        className="w-full bg-neutral-900 border-b border-neutral-800 flex items-center justify-center overflow-hidden"
        style={{ height: "200px" }}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-contain p-3"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="text-neutral-700">{icon}</div>
        )}
      </div>

      {/* Name, brand, price */}
      <div className="p-5 pb-4">
        <p className="text-neutral-500 text-xs mb-1 uppercase tracking-wider">
          {product.brand}
        </p>
        <h3 className="text-neutral-100 font-light text-lg leading-snug mb-1">
          {product.name}
        </h3>
        <p className="text-3xl font-light text-neutral-100 mb-0">
          {formatINR(displayPrice)}
        </p>
      </div>

      {/* Specs */}
      <div className="px-5 pb-4 flex flex-wrap gap-1.5">
        {specs.slice(0, 5).map((s) => (
          <SpecBadge key={s} label={s} />
        ))}
      </div>

      {/* Use case tags */}
      <div className="px-5 pb-4 flex flex-wrap gap-1.5">
        {product.useCases.map((uc) => (
          <span
            key={uc}
            className="text-xs px-2 py-0.5 bg-neutral-900 text-neutral-500 border border-neutral-800 rounded-sm"
          >
            {uc}
          </span>
        ))}
      </div>

      {/* Vendor prices */}
      <VendorPriceSection vendors={vendors} />
    </div>
  );
}

// ─── FilterPanel ──────────────────────────────────────────────────────────────
function FilterPanel({
  budget,
  setBudget,
  useCase,
  setUseCase,
  brand,
  setBrand,
  type,
  setType,
  loading,
  onSubmit,
}: {
  budget: string;
  setBudget: (v: string) => void;
  useCase: UseCase;
  setUseCase: (v: UseCase) => void;
  brand: string;
  setBrand: (v: string) => void;
  type: ProductType;
  setType: (v: ProductType) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <div>
        <label className="block text-neutral-400 text-xs uppercase tracking-widest mb-3">
          Device Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { value: "Laptop", icon: <Laptop size={15} /> },
              { value: "PreBuiltPC", icon: <Monitor size={15} /> },
            ] as const
          ).map(({ value, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={`flex items-center justify-center gap-2 py-2.5 border text-sm transition-all cursor-pointer rounded-sm ${
                type === value
                  ? "border-neutral-300 text-neutral-100 bg-neutral-800"
                  : "border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300"
              }`}
            >
              {icon}
              {value === "PreBuiltPC" ? "Desktop" : value}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-neutral-400 text-xs uppercase tracking-widest mb-1">
          Budget
        </label>
        <div className="text-2xl text-neutral-100 font-light mb-4">
          {formatINR(Number(budget))}
        </div>
        <input
          type="range"
          min="20000"
          max="300000"
          step="1000"
          value={budget}
          title="Budget"
          onChange={(e) => setBudget(e.target.value)}
          className="w-full h-1 bg-neutral-800 appearance-none cursor-pointer rounded-full
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-neutral-100 [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <div className="flex justify-between text-xs text-neutral-700 mt-2">
          <span>₹20k</span>
          <span>₹3L</span>
        </div>
      </div>

      <div>
        <label className="block text-neutral-400 text-xs uppercase tracking-widest mb-3">
          Use Case
        </label>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {USE_CASES.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="radio"
                name="useCase"
                value={option}
                checked={useCase === option}
                onChange={() => setUseCase(option)}
                className="w-3.5 h-3.5 accent-neutral-100 shrink-0"
              />
              <span className="text-neutral-400 text-sm group-hover:text-neutral-200 transition-colors truncate">
                {option}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-neutral-400 text-xs uppercase tracking-widest mb-3">
          Brand
        </label>
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm
            focus:outline-none focus:border-neutral-600 cursor-pointer rounded-sm transition-colors"
        >
          {BRANDS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-neutral-100 text-neutral-950 cursor-pointer font-medium
          hover:bg-neutral-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed
          flex items-center justify-center gap-2 rounded-sm text-sm tracking-wide"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? "Finding best match…" : "Generate Recommendations"}
      </button>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RecommendationPage() {
  const [budget, setBudget] = useState("50000");
  const [useCase, setUseCase] = useState<UseCase>("Any");
  const [brand, setBrand] = useState("Any");
  const [type, setType] = useState<ProductType>("Laptop");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] =
    useState<ProductRecommendationResponse | null>(null);
  // productId → array of vendor price entries
  const [vendorMap, setVendorMap] = useState<Record<string, VendorInfo[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!recommendation) return;
    const timer = setTimeout(() => {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    }, 600);
    return () => clearTimeout(timer);
  }, [budget]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDrawerOpen(false);
    setLoading(true);
    setError(null);
    setRecommendation(null);
    setVendorMap({});

    try {
      const result = await apiService.getProductRecommendation({
        budget: Number(budget),
        useCase,
        brand,
        type,
      });
      setRecommendation(result);

      // Collect all product IDs across both result arrays
      const allResults: ProductResult[] = [
        ...(result.results.laptop ?? []),
        ...(result.results.preBuiltPC ?? []),
      ];
      const productIds = allResults.map((r) => r.product._id);

      if (productIds.length > 0) {
        try {
          const priceResponse = await apiService.getProductPrice(productIds);
          const map: Record<string, VendorInfo[]> = {};

          for (const item of priceResponse.products) {
            // The API returns prices[] per product in the shape shown in the data format.
            // Cast to access the full prices array if present; fall back to lowest entry.
            const raw = item as ProductPriceItem & { prices?: VendorInfo[] };
            console.log(raw);

            if (raw.prices && raw.prices.length > 0) {
              map[item.productId] = raw.prices;
            } else {
              map[item.productId] = [
                {
                  vendor: item.lowest.vendor,
                  price: item.lowest.price,
                  productUrl: item.lowest.productUrl,
                  inStock: true,
                },
              ];
            }
          }

          setVendorMap(map);
        } catch {
          // Price fetch failed — cards will still render with estimatedPrice
        }
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (axios.isAxiosError(err) && err.code === "ECONNABORTED") {
        setError("Server is taking too long to respond. Please try again.");
      } else {
        setError("Failed to get recommendation. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const activeResults: ProductResult[] = recommendation
    ? ((type === "Laptop"
        ? recommendation.results.laptop
        : recommendation.results.preBuiltPC) ?? [])
    : [];

  const filterProps = {
    budget,
    setBudget,
    useCase,
    setUseCase,
    brand,
    setBrand,
    type,
    setType,
    loading,
    onSubmit: handleSubmit,
  };

  return (
    <div className="min-h-screen bg-neutral-950 pt-20 pb-16">
      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-neutral-700 rounded-full blur-[180px] opacity-10" />
      </div>

      {/* Mobile drawer */}
      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-[60] flex lg:hidden transition-opacity duration-300 ${
          drawerOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/70 transition-opacity duration-300 ${
            drawerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setDrawerOpen(false)}
        />

        {/* Drawer */}
        <div
          className={`relative ml-auto w-full max-w-xs h-full bg-neutral-950 border-l border-neutral-800
    overflow-y-auto p-5 flex flex-col gap-6 z-10
    transform transition-transform duration-300 ease-in-out
    ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-neutral-300 text-xs font-medium tracking-widest uppercase">
              Filters
            </span>
            <button
              onClick={() => setDrawerOpen(false)}
              className="text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer p-1"
            >
              <X size={18} />
            </button>
          </div>

          <FilterPanel {...filterProps} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1
              className="text-3xl md:text-4xl font-light text-neutral-100 tracking-tight mb-1 leading-tight"
              style={{ fontFamily: "Rubik Distressed, serif" }}
            >
              Get Recommendation
            </h1>
            <p
              className="text-neutral-500 text-sm"
              style={{ fontFamily: "Special Elite, serif" }}
            >
              Configure your requirements
            </p>
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden flex items-center gap-2 px-3 py-2 mt-1 border border-neutral-700
      text-neutral-400 text-sm hover:border-neutral-500 hover:text-neutral-200
      transition-colors rounded-sm shrink-0 whitespace-nowrap"
          >
            <SlidersHorizontal size={14} />
            Filters
          </button>
        </div>

        <div className="flex gap-8">
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24 border border-neutral-800 bg-neutral-950/80 backdrop-blur-sm p-6 rounded-sm">
              <FilterPanel {...filterProps} />
            </div>
          </aside>

          <div className="flex-1 min-w-0 space-y-5">
            {error && (
              <div className="p-5 border border-red-900/50 bg-red-950/20 rounded-sm">
                <p className="text-red-400 text-sm font-semibold mb-1">
                  ⚠️ Unable to find a match
                </p>
                <p className="text-red-300/80 text-sm">{error}</p>
                <div className="mt-3 pt-3 border-t border-red-900/30 text-xs text-red-300/60 space-y-1">
                  <p>• Try increasing your budget</p>
                  <p>• Change brand preference to "Any"</p>
                  <p>• Switch use case</p>
                </div>
              </div>
            )}

            {recommendation && activeResults.length > 0 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border border-neutral-800 px-4 py-3 rounded-sm flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-neutral-300 text-sm">
                      {recommendation.budgetTier} Tier
                    </span>
                    <span className="text-neutral-700">·</span>
                    <span className="text-neutral-500 text-sm">
                      {recommendation.useCase}
                    </span>
                    {recommendation.brand !== "Any" && (
                      <>
                        <span className="text-neutral-700">·</span>
                        <span className="text-neutral-500 text-sm">
                          {recommendation.brand}
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-neutral-600">
                    {activeResults.length} match
                    {activeResults.length !== 1 ? "es" : ""} found
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {activeResults.map((result, i) => (
                    <ProductCard
                      key={result.product._id}
                      result={result}
                      typeLabel={
                        type === "Laptop" ? "Laptop" : "Pre-Built Desktop"
                      }
                      icon={
                        type === "Laptop" ? (
                          <Laptop size={18} />
                        ) : (
                          <Monitor size={18} />
                        )
                      }
                      isBest={i === 0}
                      vendors={vendorMap[result.product._id] ?? []}
                    />
                  ))}
                </div>

                {(recommendation.suggestions ?? []).length > 0 && (
                  <div className="border border-neutral-800 p-4 rounded-sm space-y-2">
                    <p className="text-neutral-400 text-xs uppercase tracking-widest mb-2">
                      Suggestions
                    </p>
                    {(recommendation.suggestions ?? []).map((s, i) => (
                      <p key={i} className="text-neutral-500 text-sm">
                        • {s}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!recommendation && !error && !loading && (
              <div
                className="flex flex-col items-center justify-center border border-dashed border-neutral-800 rounded-sm gap-4"
                style={{ minHeight: "420px" }}
              >
                {type === "Laptop" ? (
                  <Laptop size={36} className="text-neutral-700" />
                ) : (
                  <Monitor size={36} className="text-neutral-700" />
                )}
                <div className="text-center">
                  <p className="text-neutral-500 text-sm mb-1">
                    No recommendations yet
                  </p>
                  <p className="text-neutral-700 text-xs">
                    Configure your preferences
                    <span className="lg:hidden">
                      {" "}
                      and tap Filters → Generate
                    </span>
                    <span className="hidden lg:inline">
                      {" "}
                      and click Generate
                    </span>
                  </p>
                </div>
              </div>
            )}

            {loading && (
              <div className="border border-neutral-800 rounded-sm p-10 flex flex-col items-center gap-4">
                <Loader2 size={28} className="animate-spin text-neutral-500" />
                <p className="text-neutral-500 text-sm">
                  Finding the best {type === "Laptop" ? "laptop" : "desktop"}{" "}
                  for you…
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
