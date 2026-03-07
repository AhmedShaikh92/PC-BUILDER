import { useState, useEffect, useCallback } from "react";
import { ExternalLink, CheckCircle2, AlertTriangle } from "lucide-react";
import apiService, { type PriceData } from "../services/api.ts";
import { useBuildStore } from "../store/useStore";
import type { Component } from "../services/api.ts";

interface ComponentSelectorProps {
  category: string;
  isOpen: boolean;
  onToggle: () => void;
}

/** Formats spec keys and values into readable strings, skipping booleans and arrays */
function formatSpecs(specs: Record<string, unknown>): string {
  return Object.entries(specs)
    .filter(([, v]) => {
      if (typeof v === "boolean") return false;
      if (Array.isArray(v)) return false;
      if (v === null || v === undefined || v === "") return false;
      return true;
    })
    .map(([k, v]) => {
      const formattedKey = k
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .replace(/([a-z])([0-9])/g, "$1 $2")
        .replace(/MMB/g, "MM B")
        .trim();
      return `${formattedKey}: ${String(v)}`;
    })
    .join(" · ");
}

/** Skeleton row shown while components are loading */
function SkeletonRow() {
  return (
    <div className="p-4 border-b border-neutral-900 animate-pulse">
      <div className="h-3.5 w-48 bg-neutral-800 rounded mb-2" />
      <div className="h-3 w-64 bg-neutral-900 rounded mb-2" />
      <div className="h-3 w-20 bg-neutral-900 rounded" />
    </div>
  );
}

export function ComponentSelector({
  category,
  isOpen,
  onToggle,
}: ComponentSelectorProps) {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedComponentPrices, setSelectedComponentPrices] = useState<PriceData[]>([]);

  const { selectedComponents, setComponent } = useBuildStore();
  const selectedComponent = selectedComponents[category];

  // ── Fetch component list when the panel opens ──────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const fetchComponents = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiService.getComponents(category);
        setComponents(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(`Failed to load ${category} components`);
        setComponents([]);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchComponents();
  }, [isOpen, category]);

  // ── Fetch all vendor prices whenever the selected component changes ────
  useEffect(() => {
    if (!selectedComponent) {
      setSelectedComponentPrices([]);
      return;
    }

    apiService
      .getAllPrices(selectedComponent.component._id)
      .then(setSelectedComponentPrices)
      .catch((err) => console.error("Failed to fetch prices:", err));
  }, [selectedComponent]);

  // ── Select handler — passes vendor/inStock/currency to store ──────────
  const handleSelectComponent = useCallback(
    async (component: Component) => {
      setSelectingId(component._id);
      try {
        // Defaults in case price fetch fails
        let price = component.lowestPrice ?? 0;
        let productUrl: string | undefined;
        let vendor: string | undefined;
        let inStock = true;
        let currency = "INR";

        try {
          const priceData = await apiService.getPrice(component._id);
          price = priceData.price;
          productUrl = priceData.productUrl;
          vendor = priceData.vendor;
          inStock = priceData.inStock ?? true;
          currency = priceData.currency ?? "INR";
        } catch {
          // lowestPrice fallback is fine
        }

        setComponent(category, component, price, productUrl, vendor, inStock, currency);
        onToggle();
      } catch (err) {
        console.error("Failed to select component:", err);
        setComponent(category, component, component.lowestPrice ?? 0);
        onToggle();
      } finally {
        setSelectingId(null);
      }
    },
    [category, setComponent, onToggle],
  );

  return (
    <div className="font-mono">
      {/* ── Selected component summary (collapsed state) ── */}
      {selectedComponent && !isOpen && (
        <div className="mb-2 rounded-sm border border-neutral-700 bg-neutral-900">
          <div className="flex items-start justify-between gap-3 px-3 py-2.5">
            {/* Left: name + specs + stock */}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-neutral-100 truncate leading-snug">
                {selectedComponent.component.name}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5 truncate">
                {formatSpecs(selectedComponent.component.specs as Record<string, unknown>)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {/* Stock badge */}
                {selectedComponent.inStock === false ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 uppercase tracking-wide">
                    <AlertTriangle size={10} />
                    Out of stock
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-500 uppercase tracking-wide">
                    In stock
                  </span>
                )}
                {/* Vendor badge */}
                {selectedComponent.vendor && (
                  <span className="text-[10px] text-neutral-600 uppercase tracking-wide">
                    via {selectedComponent.vendor}
                  </span>
                )}
              </div>
            </div>

            {/* Right: price + buy link */}
            <div className="shrink-0 text-right">
              <p className="text-sm text-neutral-100">
                {selectedComponent.currency ?? "₹"}
                {selectedComponent.currency === "INR" || !selectedComponent.currency
                  ? "₹"
                  : selectedComponent.currency}{" "}
                {selectedComponent.selectedPrice.toLocaleString("en-IN")}
              </p>
              {selectedComponent.productUrl && (
                <a
                  href={selectedComponent.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 transition-colors mt-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  Buy <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>

          {/* ── All vendor prices row ── */}
          {selectedComponentPrices.length > 1 && (
            <div className="border-t border-neutral-800 px-3 py-2 flex flex-wrap gap-x-4 gap-y-1">
              {selectedComponentPrices.map((p) => (
                <a
                  key={p._id}
                  href={p.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={[
                    "text-[11px] flex items-center gap-1 transition-colors",
                    p.inStock
                      ? "text-neutral-400 hover:text-neutral-200"
                      : "text-neutral-700 line-through cursor-not-allowed pointer-events-none",
                  ].join(" ")}
                >
                  {p.vendor}
                  <span className="text-neutral-500">
                    ₹{p.price.toLocaleString("en-IN")}
                  </span>
                  {!p.inStock && (
                    <span className="text-amber-700 no-underline">(OOS)</span>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Component picker (expanded state) ── */}
      {isOpen && (
        <div className="mb-6 border border-neutral-800 overflow-hidden">
          <div className="px-3 py-2 border-b border-neutral-900 bg-neutral-950">
            <p className="text-[11px] text-neutral-600 uppercase tracking-widest">
              Select {category.replace("_", " ")}
            </p>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-neutral-900 bg-neutral-950">
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : error ? (
              <div className="p-5 text-center text-neutral-600 text-sm">
                {error}
              </div>
            ) : components.length === 0 ? (
              <div className="p-5 text-center text-neutral-600 text-sm">
                No components available
              </div>
            ) : (
              components.map((comp) => {
                const isSelected = selectedComponent?.component._id === comp._id;
                const isSelecting = selectingId === comp._id;

                return (
                  <button
                    key={comp._id}
                    onClick={() => handleSelectComponent(comp)}
                    disabled={isSelecting}
                    className={[
                      "w-full text-left px-4 py-3 transition-colors relative",
                      "hover:bg-neutral-900 focus-visible:outline-none focus-visible:bg-neutral-900",
                      isSelected ? "bg-neutral-900" : "",
                      isSelecting ? "opacity-50 cursor-wait" : "cursor-pointer",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {/* Selected tick */}
                    {isSelected && (
                      <CheckCircle2
                        size={13}
                        className="absolute top-3 right-3 text-emerald-500"
                      />
                    )}

                    <p className="text-sm text-neutral-100 font-light leading-snug pr-5">
                      {comp.name}
                    </p>

                    {comp.specs && (
                      <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">
                        {formatSpecs(comp.specs as Record<string, unknown>)}
                      </p>
                    )}

                    {comp.lowestPrice != null && (
                      <p className="text-xs text-neutral-400 mt-1.5">
                        From ₹{comp.lowestPrice.toLocaleString("en-IN")}
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}