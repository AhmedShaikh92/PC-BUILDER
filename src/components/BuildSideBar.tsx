import { useBuildStore } from "../store/useStore";
import {
  X,
  AlertCircle,
  ExternalLink,
  ShoppingCart,
  Copy,
  Check,
  Save,
  FolderOpen,
  Trash2,
  Edit2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getVendorLinks } from "../utils/links";
import { toast } from "react-toastify";
import { fetchAISuggestions } from "../services/aiRecommendations";

const CATEGORIES = [
  "CPU", "Motherboard", "RAM", "Storage", "PSU", "Case", "GPU", "CPU_Cooler", "Case_Fan",
];

const VENDOR_KEYS = ["amazon", "flipkart", "vedant", "mdcomputers", "primeabgb"] as const;
type VendorKey = (typeof VENDOR_KEYS)[number];

const VENDOR_LABELS: Record<VendorKey, string> = {
  amazon: "Amazon",
  flipkart: "Flipkart",
  vedant: "Vedant Computers",
  mdcomputers: "MD Computers",
  primeabgb: "Prime ABGB",
};

type SuggestionType = "incompatible" | "upgrade" | "downgrade" | "warning" | "tip" | "alternative" | "upsell";
type SuggestionPriority = "critical" | "high" | "medium" | "low";

interface AISuggestion {
  type: SuggestionType;
  category: string;
  title: string;
  description: string;
  priority: SuggestionPriority;
  impact: string;
  badge?: string;
  priceDifference?: number;
  savings?: number;
  upgradeReason?: string;
}

function SuggestionIcon({ type, priority }: { type: SuggestionType; priority: SuggestionPriority }) {
  if (type === "incompatible" || priority === "critical") return <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />;
  if (type === "warning" || priority === "high") return <AlertCircle size={13} className="text-yellow-500 shrink-0 mt-0.5" />;
  if (type === "upgrade") return <ArrowUpCircle size={13} className="text-blue-400 shrink-0 mt-0.5" />;
  if (type === "downgrade") return <ArrowDownCircle size={13} className="text-orange-400 shrink-0 mt-0.5" />;
  if (type === "tip") return <Info size={13} className="text-neutral-400 shrink-0 mt-0.5" />;
  return <TrendingUp size={13} className="text-green-400 shrink-0 mt-0.5" />;
}

function priorityBorder(priority: SuggestionPriority) {
  if (priority === "critical") return "border-red-900/50 bg-red-950/10";
  if (priority === "high") return "border-yellow-900/40 bg-yellow-950/10";
  if (priority === "medium") return "border-blue-900/30 bg-blue-950/5";
  return "border-neutral-800 bg-neutral-950/30";
}

function badgeStyle(type: SuggestionType, priority: SuggestionPriority) {
  if (type === "incompatible" || priority === "critical") return "text-red-400 border-red-900/60";
  if (type === "warning" || priority === "high") return "text-yellow-500 border-yellow-900/50";
  if (type === "upgrade") return "text-blue-400 border-blue-900/50";
  if (type === "alternative") return "text-green-400 border-green-900/50";
  return "text-neutral-500 border-neutral-800";
}

function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-xs text-neutral-500">Delete?</span>
      <button onClick={onConfirm} className="text-xs text-red-400 border border-red-900/60 px-2 py-0.5 hover:bg-red-950/30 transition-colors cursor-pointer">Yes</button>
      <button onClick={onCancel} className="text-xs text-neutral-500 border border-neutral-800 px-2 py-0.5 hover:bg-neutral-900 transition-colors cursor-pointer">No</button>
    </div>
  );
}

function Modal({ onClose, children, wide = false }: { onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`bg-[#111] border border-neutral-800 w-full p-6 ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto`}>
        {children}
      </div>
    </div>
  );
}

export function BuildSidebar() {
  const { selectedComponents, totalPrice, removeComponent, clearBuild, saveBuild, loadBuild, savedBuilds, deleteSavedBuild, updateSavedBuild } = useBuildStore();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [buildName, setBuildName] = useState("");
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editingBuildId, setEditingBuildId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingBuildId, setDeletingBuildId] = useState<string | null>(null);

  // AI state
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const selectedCount = Object.keys(selectedComponents).length;

  // Compatibility warnings
  const warnings = (() => {
    const list: string[] = [];
    const cpu = selectedComponents["CPU"];
    const motherboard = selectedComponents["Motherboard"];
    const ram = selectedComponents["RAM"];
    const gpu = selectedComponents["GPU"];
    const psu = selectedComponents["PSU"];

    if (cpu && motherboard) {
      const cpuSocket = cpu.component.specs.socket as string | undefined;
      const mbSocket = motherboard.component.specs.socket as string | undefined;
      if (cpuSocket && mbSocket && cpuSocket !== mbSocket)
        list.push(`CPU socket (${cpuSocket}) doesn't match motherboard socket (${mbSocket})`);
    }
    if (ram && motherboard) {
      const ramType = ram.component.specs.type as string | undefined;
      const mbRamType = motherboard.component.specs.memoryType as string | undefined;
      if (ramType && mbRamType && !mbRamType.includes(ramType))
        list.push(`RAM type (${ramType}) may not be supported by this motherboard`);
    }
    if (psu && (cpu || gpu)) {
      const psuWattage = Number(psu.component.specs.wattage ?? 0);
      let estimatedPower = 150;
      if (cpu) estimatedPower += Number(cpu.component.specs.tdp ?? 65);
      if (gpu) estimatedPower += Number(gpu.component.specs.tdp ?? 150);
      const recommended = Math.ceil(estimatedPower * 1.2);
      if (psuWattage > 0 && psuWattage < recommended)
        list.push(`PSU (${psuWattage}W) may be insufficient — recommend ${recommended}W+`);
    }
    return list;
  })();

  const missingCategories = CATEGORIES.filter((cat) => !selectedComponents[cat]);

  // On-demand AI — only fires when button is clicked
  const handleOpenAISuggestions = async () => {
    setShowAIModal(true);
    setAiLoading(true);
    setAiSuggestions([]);
    try {
      const results = await fetchAISuggestions({
        selectedComponents,
        totalPrice,
        useCase: "Gaming",
        budget: totalPrice * 1.2,
      });
      setAiSuggestions(results);
    } catch (err) {
      console.error("AI suggestions failed:", err);
      toast.error("Failed to generate AI suggestions");
    } finally {
      setAiLoading(false);
    }
  };

  const generateShoppingList = () => {
    const lines = Object.entries(selectedComponents).map(
      ([cat, item]) => `${cat}: ${item.component.name} — ₹${item.selectedPrice.toLocaleString("en-IN")}`,
    );
    return `PC Build\n${"─".repeat(40)}\n${lines.join("\n")}\n${"─".repeat(40)}\nTotal: ₹${totalPrice.toLocaleString("en-IN")}`;
  };

  const copyShoppingList = async () => {
    try {
      await navigator.clipboard.writeText(generateShoppingList());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const handleSaveBuild = () => {
    if (selectedCount === 0) { toast.error("Add at least one component before saving"); return; }
    saveBuild(buildName.trim() || `Build ${savedBuilds.length + 1}`);
    setBuildName("");
    setShowSaveModal(false);
    toast.success("Build saved!");
  };

  const handleLoadBuild = (buildId: string) => {
    loadBuild(buildId);
    setShowLoadModal(false);
    setAiSuggestions([]);
    toast.success("Build loaded!");
  };

  const handleDeleteBuild = (buildId: string) => {
    deleteSavedBuild(buildId);
    setDeletingBuildId(null);
  };

  const handleUpdateBuildName = (buildId: string) => {
    if (editingName.trim()) updateSavedBuild(buildId, editingName.trim());
    setEditingBuildId(null);
    setEditingName("");
  };

  return (
    <div className="w-full lg:w-136 max-h-full bg-transparent pt-10 p-6 flex flex-col overflow-y-auto noScrollbar">
      <h2 className="text-xl font-light text-neutral-100 border-b-2 border-neutral-700 text-center mb-2 pt-6 tracking-tight shrink-0 font-['Special_Elite']">
        Your Build
      </h2>

      {selectedCount === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-neutral-600 text-sm">No components selected</p>
          {savedBuilds.length > 0 && (
            <button onClick={() => setShowLoadModal(true)} className="flex items-center cursor-pointer gap-2 text-sm text-neutral-400 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-700 px-4 py-2 transition-colors">
              <FolderOpen size={16} />
              Load Saved Build
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Component list */}
          <div className="space-y-2 mb-4 flex-1 min-h-0">
            {CATEGORIES.map((category) => {
              const selected = selectedComponents[category];
              if (!selected) return null;
              const isExpanded = expandedComponent === category;
              const vendorLinks = getVendorLinks(selected.component.name, selected.selectedPrice);

              return (
                <div key={category} className="border border-neutral-800 hover:border-neutral-700 transition-colors">
                  <div className="p-3 group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-neutral-600 mb-1 uppercase tracking-widest">{category}</p>
                        <p className="text-sm text-neutral-300 truncate leading-snug font-['Special_Elite']">{selected.component.name}</p>
                      </div>
                      <button onClick={() => removeComponent(category)} className="text-neutral-700 hover:text-red-400 cursor-pointer transition-colors opacity-0 group-hover:opacity-100 mt-0.5 shrink-0" aria-label={`Remove ${category}`}>
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-neutral-100 tabular-nums">₹{selected.selectedPrice.toLocaleString("en-IN")}</p>
                      <button onClick={() => setExpandedComponent(isExpanded ? null : category)} className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-300 cursor-pointer transition-colors">
                        <ShoppingCart size={11} />
                        Buy
                        {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-neutral-900 bg-neutral-950 px-3 py-2">
                      <p className="text-[10px] text-neutral-700 uppercase tracking-widest mb-1.5">Buy from</p>
                      <div className="space-y-0.5">
                        {VENDOR_KEYS.map((key) => (
                          <a key={key} href={vendorLinks[key]} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-xs text-neutral-500 hover:text-neutral-200 transition-colors py-1 px-2 hover:bg-neutral-900">
                            <span>{VENDOR_LABELS[key]}</span>
                            <ExternalLink size={11} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Inline compatibility warnings */}
          {warnings.length > 0 && (
            <div className="mb-3 p-3 border border-yellow-900/50 bg-yellow-950/10 shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={13} className="text-yellow-600 shrink-0" />
                <p className="text-xs text-yellow-600 font-medium uppercase tracking-wider">Compatibility</p>
              </div>
              <ul className="space-y-1">
                {warnings.map((w, i) => <li key={i} className="text-xs text-yellow-500/80 leading-relaxed">· {w}</li>)}
              </ul>
            </div>
          )}

          {/* Total + actions */}
          <div className="space-y-3 pt-4 border-t border-neutral-900 shrink-0">
            <div className="flex items-baseline justify-between">
              <span className="text-neutral-500 text-xl font-['Rubik_Distressed']">Total</span>
              <span className="text-2xl text-neutral-100 tabular-nums font-['Special_Elite']">₹{totalPrice.toLocaleString("en-IN")}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={clearBuild} className="px-3 py-2 cursor-pointer text-sm text-neutral-400 border border-neutral-800 hover:border-red-900/60 hover:text-red-400 transition-colors">
                Clear
              </button>
              <button onClick={() => setShowLoadModal(true)} className="px-3 py-2 cursor-pointer text-sm text-neutral-400 border border-neutral-800 hover:border-neutral-700 hover:text-neutral-300 transition-colors flex items-center justify-center gap-2">
                <FolderOpen size={13} />Load
              </button>
              <button onClick={() => setShowSaveModal(true)} disabled={selectedCount === 0} className="px-3 py-2 text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-neutral-800 text-neutral-100 hover:bg-neutral-700 cursor-pointer">
                <Save size={13} />Save
              </button>
              <button
                onClick={handleOpenAISuggestions}
                disabled={selectedCount < 3}
                className="px-3 py-2 text-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed bg-neutral-100 text-neutral-950 hover:bg-neutral-200 cursor-pointer"
              >
                <Sparkles size={13} />
                AI Suggestions
              </button>
            </div>

            {selectedCount < 3 && (
              <p className="text-xs text-neutral-700 text-center">
                {3 - selectedCount} more component{3 - selectedCount !== 1 ? "s" : ""} needed for AI analysis
              </p>
            )}
          </div>
        </>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <Modal onClose={() => { setShowSaveModal(false); setBuildName(""); }}>
          <h3 className="text-lg font-light text-neutral-100 mb-5">Save Build</h3>
          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="build-name-input" className="text-xs text-neutral-500 mb-1.5 block uppercase tracking-wider">Build Name</label>
              <input
                id="build-name-input"
                type="text"
                value={buildName}
                onChange={(e) => setBuildName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveBuild()}
                placeholder={`Build ${savedBuilds.length + 1}`}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-neutral-600 text-neutral-100 text-sm outline-none transition-colors"
                autoFocus
              />
            </div>
            <div className="pt-3 border-t border-neutral-800 flex items-baseline justify-between">
              <span className="text-sm text-neutral-500">{selectedCount} component{selectedCount !== 1 ? "s" : ""}</span>
              <span className="text-lg text-neutral-100 tabular-nums">₹{totalPrice.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowSaveModal(false); setBuildName(""); }} className="flex-1 px-4 py-2 text-sm text-neutral-400 border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer">Cancel</button>
            <button onClick={handleSaveBuild} className="flex-1 px-4 py-2 text-sm bg-neutral-100 text-neutral-950 hover:bg-neutral-200 transition-colors cursor-pointer">Save Build</button>
          </div>
        </Modal>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <Modal onClose={() => setShowLoadModal(false)} wide>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-light text-neutral-100">Saved Builds</h3>
            <button onClick={() => setShowLoadModal(false)} aria-label="Close saved builds" className="text-neutral-600 hover:text-neutral-300 transition-colors cursor-pointer"><X size={16} /></button>
          </div>

          {savedBuilds.length === 0 ? (
            <p className="text-neutral-600 text-sm text-center py-10">No saved builds yet</p>
          ) : (
            <div className="space-y-2 mb-5">
              {savedBuilds.map((build) => (
                <div key={build.id} className="p-4 border border-neutral-800 hover:border-neutral-700 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      {editingBuildId === build.id ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => handleUpdateBuildName(build.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateBuildName(build.id);
                            if (e.key === "Escape") { setEditingBuildId(null); setEditingName(""); }
                          }}
                          className="w-full px-2 py-1 bg-neutral-950 border border-neutral-700 text-neutral-100 text-sm outline-none"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 className="text-neutral-100 text-sm font-medium truncate">{build.name}</h4>
                          <button onClick={() => { setEditingBuildId(build.id); setEditingName(build.name); }} aria-label={`Rename ${build.name}`} className="text-neutral-700 hover:text-neutral-400 transition-colors shrink-0 cursor-pointer">
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-neutral-600 mt-1">
                        {Object.keys(build.components).length} components · {new Date(build.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <span className="text-sm text-neutral-100 tabular-nums shrink-0">₹{build.totalPrice.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <button onClick={() => handleLoadBuild(build.id)} className="flex-1 px-3 py-1.5 text-xs bg-neutral-800 text-neutral-100 hover:bg-neutral-700 transition-colors cursor-pointer">Load Build</button>
                    {deletingBuildId === build.id ? (
                      <DeleteConfirm onConfirm={() => handleDeleteBuild(build.id)} onCancel={() => setDeletingBuildId(null)} />
                    ) : (
                      <button onClick={() => setDeletingBuildId(build.id)} aria-label={`Delete ${build.name}`} className="px-3 py-1.5 text-xs text-neutral-600 border border-neutral-800 hover:text-red-400 hover:border-red-900/50 transition-colors cursor-pointer">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setShowLoadModal(false)} className="w-full px-4 py-2 text-sm text-neutral-400 border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer">Close</button>
        </Modal>
      )}

      {/* AI Build Analysis Modal */}
      {showAIModal && (
        <Modal onClose={() => setShowAIModal(false)} wide>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className={`text-blue-400 ${aiLoading ? "animate-pulse" : ""}`} />
              <h3 className="text-lg font-light text-neutral-100">AI Build Analysis</h3>
            </div>
            <button onClick={() => setShowAIModal(false)} aria-label="Close AI analysis" className="text-neutral-600 hover:text-neutral-300 transition-colors cursor-pointer"><X size={16} /></button>
          </div>

          <div className="space-y-5">
            {/* Missing components */}
            {missingCategories.length > 0 && (
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Missing Components</p>
                <div className="flex flex-wrap gap-1.5">
                  {missingCategories.map((cat) => (
                    <span key={cat} className="text-xs text-neutral-500 border border-neutral-800 px-2 py-0.5">{cat}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Compatibility warnings */}
            {warnings.length > 0 && (
              <div className="p-3 border border-yellow-900/40 bg-yellow-950/10">
                <p className="text-xs text-yellow-600 uppercase tracking-wider mb-2">Compatibility</p>
                <ul className="space-y-1">
                  {warnings.map((w, i) => <li key={i} className="text-xs text-yellow-500/80">· {w}</li>)}
                </ul>
              </div>
            )}

            {/* Total */}
            <div className="flex items-baseline justify-between pt-1 border-t border-neutral-800">
              <span className="text-sm text-neutral-500">Total</span>
              <span className="text-2xl text-neutral-100 tabular-nums font-['Special_Elite']">₹{totalPrice.toLocaleString("en-IN")}</span>
            </div>

            {/* AI suggestions */}
            <div className="border-t border-neutral-800 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={12} className={`text-blue-400 ${aiLoading ? "animate-pulse" : ""}`} />
                <p className="text-xs text-neutral-500 uppercase tracking-wider">AI Suggestions</p>
              </div>

              {aiLoading ? (
                <div className="flex items-center justify-center gap-3 py-8">
                  <Sparkles size={15} className="text-blue-400 animate-pulse" />
                  <p className="text-sm text-neutral-500 animate-pulse">Generating AI build analysis...</p>
                </div>
              ) : aiSuggestions.length === 0 ? (
                <p className="text-xs text-neutral-600 text-center py-4">No suggestions — build looks solid!</p>
              ) : (
                <div className="space-y-2.5">
                  {aiSuggestions.map((s, i) => (
                    <div key={i} className={`p-3 border ${priorityBorder(s.priority)}`}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <SuggestionIcon type={s.type} priority={s.priority} />
                          <div>
                            <p className="text-xs text-neutral-200 font-medium leading-snug">{s.title}</p>
                            <p className="text-[10px] text-neutral-600 uppercase tracking-wider mt-0.5">{s.category}</p>
                          </div>
                        </div>
                        {s.badge && (
                          <span className={`text-[9px] border px-1.5 py-0.5 uppercase tracking-wider shrink-0 ${badgeStyle(s.type, s.priority)}`}>
                            {s.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 leading-relaxed ml-[21px]">{s.description}</p>
                      {(s.priceDifference !== undefined || s.savings !== undefined || s.upgradeReason) && (
                        <div className="mt-2 ml-[21px] flex flex-wrap gap-3">
                          {s.priceDifference !== undefined && (
                            <span className={`text-[11px] font-medium ${s.priceDifference > 0 ? "text-orange-400" : "text-green-400"}`}>
                              {s.priceDifference > 0 ? `+₹${s.priceDifference.toLocaleString("en-IN")}` : `-₹${Math.abs(s.priceDifference).toLocaleString("en-IN")}`}
                            </span>
                          )}
                          {s.savings !== undefined && (
                            <span className="text-[11px] font-medium text-green-400">Save ₹{s.savings.toLocaleString("en-IN")}</span>
                          )}
                          {s.upgradeReason && (
                            <span className="text-[11px] text-neutral-600 italic">{s.upgradeReason}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shopping list */}
            <div className="border-t border-neutral-800 pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Shopping List</p>
                <button onClick={copyShoppingList} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors px-2.5 py-1 border border-neutral-800 hover:border-neutral-700">
                  {copied ? <><Check size={11} />Copied</> : <><Copy size={11} />Copy</>}
                </button>
              </div>
              <div className="space-y-2.5 bg-neutral-950 p-3 border border-neutral-900 max-h-48 overflow-y-auto">
                {Object.entries(selectedComponents).map(([category, item]) => {
                  const links = getVendorLinks(item.component.name);
                  return (
                    <div key={category} className="pb-2.5 border-b border-neutral-900 last:border-0 last:pb-0">
                      <p className="text-[10px] text-neutral-600 uppercase tracking-wider">{category}</p>
                      <p className="text-sm text-neutral-300 mt-0.5 mb-1.5">{item.component.name}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-neutral-100 tabular-nums">₹{item.selectedPrice.toLocaleString("en-IN")}</span>
                        <span className="text-neutral-800">|</span>
                        {(["amazon", "flipkart", "vedant"] as const).map((v) => (
                          <a key={v} href={links[v]} target="_blank" rel="noopener noreferrer" className="text-xs text-neutral-600 hover:text-neutral-300 transition-colors underline underline-offset-2">
                            {VENDOR_LABELS[v]}
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-neutral-700 mt-2">Tip: Open each link in a new tab and checkout together</p>
            </div>
          </div>

          <button onClick={() => setShowAIModal(false)} className="w-full mt-6 px-4 py-2 text-sm bg-neutral-100 text-neutral-950 hover:bg-neutral-200 transition-colors cursor-pointer">
            Close
          </button>
        </Modal>
      )}
    </div>
  );
}