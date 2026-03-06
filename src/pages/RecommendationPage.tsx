import React from "react";
import { useState } from "react";
import {
  Loader2,
  Save,
  FolderOpen,
  Trash2,
  Edit2,
  Copy,
  Check,
  ExternalLink,
  ShoppingCart,
} from "lucide-react";
import apiService from "../services/api";
import type { BuildRecommendation } from "../services/api";
import axios from "axios";
import { useBuildStore } from "../store/useStore";
import type { SavedBuild } from "../store/useStore";
import { getPrebuiltPCLinks, getVendorLinks } from "../utils/links";
import { toast } from "react-toastify";

export default function RecommendationPage() {
  const [budget, setBudget] = useState("50000");
  const [useCase, setUseCase] = useState<"gaming" | "productivity" | "office">(
    "gaming",
  );
  const [cpuPreference, setCpuPreference] = useState<"amd" | "intel" | "any">(
    "any",
  );
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] =
    useState<BuildRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Save/Load functionality
  const {
    saveBuild,
    savedBuilds,
    deleteSavedBuild,
    updateSavedBuild,
    loadBuild,
    setComponent,
  } = useBuildStore();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [buildName, setBuildName] = useState("");
  const [editingBuildId, setEditingBuildId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [copied, setCopied] = useState(false);
  const [expandedComponent, setExpandedComponent] = useState<number | null>(
    null,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await apiService.getRecommendedBuild({
        budget: Number(budget),
        useCase,
        cpuPreference,
      });
      setRecommendation(result);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        // Show the specific backend error message
        const errorMsg = err.response.data.message;
        setError(errorMsg);

        // Add helpful suggestions based on error type
        if (
          errorMsg.includes("No suitable") ||
          errorMsg.includes("not found")
        ) {
          setError(
            `${errorMsg}\n\nTry:\n• Increasing your budget\n• Changing CPU preference to "Any"\n• Selecting a different use case`,
          );
        }
      } else {
        setError("Failed to get recommendation. Please try again.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const handleSaveRecommendation = () => {
    if (!recommendation) return;

    // Convert recommendation to store format
    const componentsRecord: Record<string, any> = {};
    recommendation.components.forEach((item) => {
      componentsRecord[item.category] = {
        componentId: item.component._id,
        component: item.component,
        selectedPrice: item.component.lowestPrice || 0,
      };
    });

    // Temporarily set components in store
    Object.entries(componentsRecord).forEach(([category, data]) => {
      setComponent(category, data.component, data.selectedPrice);
    });

    // Save the build
    const buildId = saveBuild(
      buildName || `${recommendation.budgetTier} Tier Build`,
    );
    setBuildName("");
    setShowSaveModal(false);
    toast.success("Build saved successfully!");
  };

  const handleDeleteBuild = (buildId: string) => {
    if (confirm("Are you sure you want to delete this build?")) {
      deleteSavedBuild(buildId);
    }
  };

  const handleUpdateBuildName = (buildId: string) => {
    if (editingName.trim()) {
      updateSavedBuild(buildId, editingName);
      setEditingBuildId(null);
      setEditingName("");
    }
  };

  const generateShoppingList = () => {
    if (!recommendation) return "";

    const components = recommendation.components.map((item) => {
      const price = item.component.lowestPrice || 0;
      return `${item.category}: ${item.component.name} - ₹${price.toLocaleString("en-IN")}`;
    });

    return `PC Build Shopping List (${recommendation.budgetTier} Tier)\n\n${components.join("\n")}\n\nTotal: ₹${recommendation.totalEstimatedPrice.toLocaleString("en-IN")}\nRequired Wattage: ${recommendation.requiredWattage}W`;
  };

  const copyShoppingList = async () => {
    try {
      await navigator.clipboard.writeText(generateShoppingList());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };
  {
    error && (
      <div className="p-4 border border-red-900/50 bg-red-950/20 mb-6">
        <p className="text-red-400 text-sm font-semibold mb-2">
          ⚠️ Unable to Generate Build
        </p>
        <p className="text-red-300/80 text-sm whitespace-pre-line">{error}</p>

        {/* Helpful tips */}
        {(error.includes("No suitable") ||
          error.includes("not found") ||
          error.includes("budget")) && (
          <div className="mt-4 pt-4 border-t border-red-900/30">
            <p className="text-red-300/60 text-xs mb-2">💡 Suggestions:</p>
            <ul className="space-y-1 text-red-300/60 text-xs">
              <li>
                • Try increasing your budget (current: ₹
                {Number(budget).toLocaleString("en-IN")})
              </li>
              <li>• Change CPU preference to "Any" for more options</li>
              <li>
                • Switch to "{useCase === "gaming" ? "productivity" : "office"}"
                use case (lower requirements)
              </li>
              <li>
                • The database may have limited components in this price range
              </li>
            </ul>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-neutral-950 pt-24 pb-12">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-neutral-800 rounded-full blur-[150px] opacity-20" />
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between mb-4">
          <h1
            className="text-4xl md:text-5xl font-light text-neutral-100 tracking-tight"
            style={{ fontFamily: "Rubik Distressed" }}
          >
            Get Recommendation
          </h1>
        </div>
        <p
          className="text-neutral-500 mb-12"
          style={{ fontFamily: "Special Elite" }}
        >
          Configure your requirements
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <form
              onSubmit={handleSubmit}
              className="space-y-6 border border-neutral-800 p-6"
            >
              {/* Budget Input */}
              <div>
                <label className="block text-neutral-400 text-sm mb-3">
                  Budget
                </label>
                <div className="text-2xl text-neutral-100 font-light mb-4">
                  ₹{Number(budget).toLocaleString("en-IN")}
                </div>
                <input
                  type="range"
                  min="10000"
                  max="200000"
                  step="1000"
                  value={budget}
                  title="Budget"
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full h-1 bg-neutral-800 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-neutral-100 [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <div className="flex justify-between text-xs text-neutral-600 mt-2">
                  <span>₹10k</span>
                  <span>₹2L</span>
                </div>
              </div>

              {/* Use Case Selection */}
              <div>
                <label className="block text-neutral-400 text-sm mb-3">
                  Use Case
                </label>
                <div className="space-y-2">
                  {(["gaming", "productivity", "office"] as const).map(
                    (option) => (
                      <label
                        key={option}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <input
                          type="radio"
                          name="useCase"
                          value={option}
                          checked={useCase === option}
                          onChange={(e) =>
                            setUseCase(e.target.value as typeof useCase)
                          }
                          className="w-4 h-4 accent-neutral-100"
                        />
                        <span className="text-neutral-300 group-hover:text-neutral-100 transition-colors capitalize">
                          {option}
                        </span>
                      </label>
                    ),
                  )}
                </div>
              </div>

              {/* CPU Preference */}
              <div>
                <label className="block text-neutral-400 text-sm mb-3">
                  CPU Preference
                </label>
                <div className="space-y-2">
                  {(["amd", "intel", "any"] as const).map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="cpuPreference"
                        value={option}
                        checked={cpuPreference === option}
                        onChange={(e) =>
                          setCpuPreference(
                            e.target.value as typeof cpuPreference,
                          )
                        }
                        className="w-4 h-4 accent-neutral-100"
                      />
                      <span className="text-neutral-300 group-hover:text-neutral-100 transition-colors uppercase">
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-neutral-100 text-neutral-950 cursor-pointer font-light hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={18} className="animate-spin  " />}
                {loading ? "Loading..." : "Generate"}
              </button>
            </form>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {error && (
              <div className="p-4 border border-red-900/50 bg-red-950/20 mb-6">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {recommendation ? (
              <div className="space-y-6">
                {/* Build Summary */}
                <div className="border border-neutral-800 p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-light text-neutral-100 mb-1">
                        {recommendation.budgetTier} Tier
                      </h2>
                      <p className="text-neutral-500 text-sm">
                        Recommended Build
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!recommendation.withinBudget && (
                        <span className="px-3 py-1 border border-yellow-900/50 text-yellow-600 text-xs">
                          Over Budget
                        </span>
                      )}
                      <button
                        onClick={() => setShowSaveModal(true)}
                        className="flex items-center cursor-pointer gap-2 px-3 py-1 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200 text-xs transition-colors"
                      >
                        <Save size={14} />
                        Save
                      </button>
                      <button
                        onClick={() => setShowSummaryModal(true)}
                        className="px-3 py-1 cursor-pointer bg-neutral-100 text-neutral-950 hover:bg-neutral-200 text-xs transition-colors"
                      >
                        Summary
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-neutral-500 text-sm mb-1">
                        Total Price
                      </p>
                      <p className="text-2xl font-light text-neutral-100">
                        ₹
                        {recommendation.totalEstimatedPrice.toLocaleString(
                          "en-IN",
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500 text-sm mb-1">
                        Required Wattage
                      </p>
                      <p className="text-2xl font-light text-neutral-100">
                        {recommendation.requiredWattage}W
                      </p>
                    </div>
                  </div>
                </div>

                {/* Compatibility Errors */}
                {recommendation.compatibilityErrors &&
                  recommendation.compatibilityErrors.length > 0 && (
                    <div className="p-4 border border-red-900/50 bg-red-950/20">
                      <p className="text-red-400 text-sm mb-2">
                        Compatibility Issues
                      </p>
                      <ul className="space-y-1">
                        {recommendation.compatibilityErrors.map((err, idx) => (
                          <li key={idx} className="text-red-300/80 text-xs">
                            • {err}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Components List */}
                <div className="space-y-2">
                  {recommendation.components.map((item, idx) => {
                    const isExpanded = expandedComponent === idx;
                    const vendorLinks = getVendorLinks(item.component.name);

                    return (
                      <div
                        key={idx}
                        className="border border-neutral-800 hover:border-neutral-700 transition-colors"
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-neutral-600 text-xs mb-1">
                                {item.category}
                              </p>
                              <p className="text-neutral-100 font-light truncate">
                                {item.component.name}
                              </p>
                              {item.component.specs &&
                                Object.keys(item.component.specs).length >
                                  0 && (
                                  <p className="text-neutral-500 text-xs mt-2">
                                    {Object.entries(item.component.specs)
                                      .slice(0, 3)
                                      .map(([key, value]) => `${key}: ${value}`)
                                      .join(" • ")}
                                  </p>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                              {item.component.lowestPrice && (
                                <p className="text-neutral-100 font-light whitespace-nowrap">
                                  ₹
                                  {item.component.lowestPrice.toLocaleString(
                                    "en-IN",
                                  )}
                                </p>
                              )}
                              <button
                                onClick={() =>
                                  setExpandedComponent(isExpanded ? null : idx)
                                }
                                className="text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                              >
                                <ShoppingCart size={16} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Vendor Links */}
                        {isExpanded && (
                          <div className="border-t border-neutral-800 bg-neutral-950 p-3">
                            <p className="text-xs text-neutral-500 mb-2">
                              Buy from:
                            </p>
                            <div className="grid grid-cols-2 gap-1">
                              {Object.entries(vendorLinks).map(
                                ([vendor, url]) => (
                                  <a
                                    key={vendor}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between text-xs text-neutral-400 hover:text-neutral-200 transition-colors py-1.5 px-2 hover:bg-neutral-900 rounded"
                                  >
                                    <span className="capitalize">
                                      {vendor === "mdcomputers"
                                        ? "MD Computers"
                                        : vendor === "primeabgb"
                                          ? "PrimeABGB"
                                          : vendor === "vedant"
                                            ? "Vedant Computers"
                                            : vendor}
                                    </span>
                                    <ExternalLink size={12} />
                                  </a>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Suggestions */}
                {recommendation.suggestions &&
                  recommendation.suggestions.length > 0 && (
                    <div className="border border-neutral-800 p-4">
                      <p className="text-neutral-400 text-sm mb-3">
                        Suggestions
                      </p>
                      <ul className="space-y-2">
                        {recommendation.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-neutral-500 text-sm">
                            • {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 border border-dashed border-neutral-800">
                <p className="text-neutral-600 text-sm">
                  Configure and generate to see results
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Build Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 max-w-md w-full p-6">
            <h3 className="text-xl font-light text-neutral-100 mb-4">
              Save Build
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm text-neutral-400 mb-2 block">
                  Build Name
                </label>
                <input
                  type="text"
                  value={buildName}
                  onChange={(e) => setBuildName(e.target.value)}
                  placeholder={
                    recommendation
                      ? `${recommendation.budgetTier} Tier Build`
                      : "My Build"
                  }
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-neutral-100 text-sm focus:outline-none focus:border-neutral-700"
                  autoFocus
                />
              </div>

              {recommendation && (
                <div className="pt-2 border-t border-neutral-800">
                  <p className="text-sm text-neutral-500 mb-1">
                    {recommendation.components.length} components
                  </p>
                  <p className="text-lg text-neutral-100">
                    ₹
                    {recommendation.totalEstimatedPrice.toLocaleString("en-IN")}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setBuildName("");
                }}
                className="flex-1 px-4 py-2 text-sm cursor-pointer text-neutral-400 border border-neutral-800 hover:border-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRecommendation}
                className="flex-1 px-4 py-2 text-sm bg-neutral-100 cursor-pointer text-neutral-950 hover:bg-neutral-200 transition-colors"
              >
                Save Build
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Build Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-light text-neutral-100 mb-4">
              Saved Builds
            </h3>

            {savedBuilds.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">
                No saved builds yet
              </p>
            ) : (
              <div className="space-y-3 mb-6">
                {savedBuilds.map((build) => (
                  <div
                    key={build.id}
                    className="p-4 border border-neutral-800 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        {editingBuildId === build.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => handleUpdateBuildName(build.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                handleUpdateBuildName(build.id);
                              if (e.key === "Escape") {
                                setEditingBuildId(null);
                                setEditingName("");
                              }
                            }}
                            className="w-full px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-neutral-100 text-sm"
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <h4 className="text-neutral-100 font-light">
                              {build.name}
                            </h4>
                            <button
                              onClick={() => {
                                setEditingBuildId(build.id);
                                setEditingName(build.name);
                              }}
                              className="text-neutral-600 hover:text-neutral-400"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-neutral-500 mt-1">
                          {Object.keys(build.components).length} components •
                          {new Date(build.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-neutral-100 font-light ml-4">
                        ₹{build.totalPrice.toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          loadBuild(build.id);
                          setShowLoadModal(false);
                          window.location.href = "/build";
                        }}
                        className="flex-1 px-3 py-1.5 text-xs bg-neutral-800 text-neutral-100 hover:bg-neutral-700 transition-colors"
                      >
                        Load Build
                      </button>
                      <button
                        onClick={() => handleDeleteBuild(build.id)}
                        className="px-3 py-1.5 text-xs text-red-400 border border-red-900/50 hover:bg-red-950/20 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowLoadModal(false)}
              className="w-full px-4 py-2 text-sm cursor-pointer text-neutral-400 border border-neutral-800 hover:border-neutral-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {showSummaryModal && recommendation && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-light text-neutral-100 mb-4">
              Build Summary
            </h3>

            <div className="space-y-4 mb-6">
              <div className="border border-neutral-800 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">Total Price</p>
                    <p className="text-2xl text-neutral-100 font-light">
                      ₹
                      {recommendation.totalEstimatedPrice.toLocaleString(
                        "en-IN",
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">Wattage</p>
                    <p className="text-2xl text-neutral-100 font-light">
                      {recommendation.requiredWattage}W
                    </p>
                  </div>
                </div>
              </div>

              {recommendation.compatibilityErrors &&
                recommendation.compatibilityErrors.length > 0 && (
                  <div className="p-4 border border-red-900/50 bg-red-950/20">
                    <p className="text-red-400 text-sm mb-2">Warnings:</p>
                    <ul className="space-y-1">
                      {recommendation.compatibilityErrors.map((err, i) => (
                        <li key={i} className="text-xs text-red-300/80">
                          • {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              <div className="pt-4 border-t border-neutral-800">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-neutral-400">Shopping List</p>
                  <button
                    onClick={copyShoppingList}
                    className="flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-200 transition-colors px-3 py-1.5 border border-neutral-800 hover:border-neutral-700 rounded"
                  >
                    {copied ? (
                      <>
                        <Check size={12} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        Copy List
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2 bg-neutral-950 p-3 rounded border border-neutral-800 max-h-60 overflow-y-auto">
                  {recommendation.components.map((item, idx) => {
                    const links = getVendorLinks(item.component.name);
                    return (
                      <div
                        key={idx}
                        className="pb-2 border-b border-neutral-800 last:border-b-0 last:pb-0"
                      >
                        <p className="text-xs text-neutral-500">
                          {item.category}
                        </p>
                        <p className="text-sm text-neutral-300 mb-1">
                          {item.component.name}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-neutral-100">
                            ₹
                            {(item.component.lowestPrice || 0).toLocaleString(
                              "en-IN",
                            )}
                          </span>
                          <span className="text-neutral-700">•</span>
                          {Object.entries(links).map(([vendor, url]) => (
                            <a
                              key={vendor}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-neutral-500 hover:text-neutral-300 underline"
                            >
                              {vendor === "mdcomputers"
                                ? "MD"
                                : vendor === "primeabgb"
                                  ? "PABGB"
                                  : vendor === "vedant"
                                    ? "Vedant"
                                    : vendor.charAt(0).toUpperCase() +
                                      vendor.slice(1)}
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-neutral-600 mt-2">
                  💡 Open each link in a new tab and add to cart
                </p>
              </div>
            </div>
            {/* Prebuilt PC Comparison Section */}
            <div className="pt-4 border-t border-neutral-800">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-neutral-400">
                    Compare with Prebuilt PCs
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Price range: ₹
                    {Math.floor(
                      (recommendation.totalEstimatedPrice * 0.85) / 1000,
                    ) * 1000}{" "}
                    - ₹
                    {Math.ceil(
                      (recommendation.totalEstimatedPrice * 1.15) / 1000,
                    ) * 1000}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const prebuiltLinks = getPrebuiltPCLinks(
                      recommendation.totalEstimatedPrice,
                    );
                    Object.values(prebuiltLinks).forEach((url) => {
                      window.open(url, "_blank");
                    });
                  }}
                  className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors px-3 py-1.5 border border-neutral-800 hover:border-neutral-700 rounded flex items-center gap-2"
                >
                  Open All
                  <ExternalLink size={12} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(
                  getPrebuiltPCLinks(recommendation.totalEstimatedPrice),
                ).map(([vendor, url]) => (
                  <a
                    key={vendor}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-xs text-neutral-400 hover:text-neutral-200 transition-colors py-2 px-3 hover:bg-neutral-800 rounded border border-neutral-800"
                  >
                    <span className="capitalize">
                      {vendor === "mdcomputers"
                        ? "MD Computers"
                        : vendor === "primeabgb"
                          ? "PrimeABGB"
                          : vendor === "tlggaming"
                            ? "TLG Gaming"
                            : vendor === "vedant"
                              ? "Vedant Computers"
                              : vendor}
                    </span>
                    <ExternalLink size={12} />
                  </a>
                ))}
              </div>
              <p className="text-xs text-neutral-600 m-3">
                💡 Prebuilt PCs may include assembly, warranty, and support but
                typically cost 10-20% more
              </p>
            </div>
            <button
              onClick={() => setShowSummaryModal(false)}
              className="w-full px-4 py-2 text-sm cursor-pointer bg-neutral-100 text-neutral-950 hover:bg-neutral-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
