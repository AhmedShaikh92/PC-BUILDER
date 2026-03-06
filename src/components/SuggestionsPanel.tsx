import React, { useState } from 'react';
import {
  Lightbulb, TrendingUp, TrendingDown, AlertTriangle,
  Zap, Award, Clock, Gauge, ShoppingCart, XCircle,
  ArrowUpCircle, ChevronDown, ChevronUp, Sparkles,
  AlertOctagon, BadgeCheck
} from 'lucide-react';
import type { Component } from '../services/api';

interface SelectedComponent {
  component: Component;
  selectedPrice: number;
}

interface Suggestion {
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

interface SuggestionsPanelProps {
  suggestions: Suggestion[];
  /** Called when user clicks "Apply" on an upsell/upgrade suggestion */
  onApplySuggestion?: (suggestion: Suggestion) => void;
}

// ─── ICON MAP ─────────────────────────────────────────────────────────────────

const getIcon = (type: string, impact: string) => {
  if (type === 'incompatible') return <XCircle size={16} />;
  if (type === 'upsell')       return <ShoppingCart size={16} />;
  if (type === 'warning')      return <AlertTriangle size={16} />;
  if (impact === 'performance')     return <Gauge size={16} />;
  if (impact === 'value')           return <TrendingUp size={16} />;
  if (impact === 'reliability')     return <Award size={16} />;
  if (impact === 'future-proofing') return <Clock size={16} />;
  if (impact === 'compatibility')   return <AlertOctagon size={16} />;
  if (type === 'upgrade')    return <ArrowUpCircle size={16} />;
  if (type === 'downgrade')  return <TrendingDown size={16} />;
  if (type === 'alternative') return <Zap size={16} />;
  return <Lightbulb size={16} />;
};

// ─── CARD STYLE FACTORIES ──────────────────────────────────────────────────────

const getCardStyle = (s: Suggestion): string => {
  if (s.type === 'incompatible' || s.priority === 'critical')
    return 'border-red-800/70 bg-red-950/25 hover:border-red-700/70 shadow-red-950/30 shadow-md';
  if (s.type === 'upsell')
    return 'border-emerald-800/60 bg-emerald-950/20 hover:border-emerald-600/70 shadow-emerald-950/30 shadow-md';
  if (s.type === 'warning' || s.priority === 'high')
    return 'border-amber-900/50 bg-amber-950/15 hover:border-amber-800/60';
  return 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-700';
};

const getIconColor = (s: Suggestion): string => {
  if (s.type === 'incompatible' || s.priority === 'critical') return 'text-red-400';
  if (s.type === 'upsell')       return 'text-emerald-400';
  if (s.type === 'warning')      return 'text-amber-400';
  if (s.type === 'upgrade')      return 'text-blue-400';
  if (s.type === 'downgrade')    return 'text-orange-400';
  if (s.impact === 'performance')return 'text-purple-400';
  if (s.impact === 'value')      return 'text-emerald-400';
  return 'text-neutral-400';
};

const getBadgeStyle = (s: Suggestion): string => {
  if (s.type === 'incompatible' || s.priority === 'critical')
    return 'bg-red-950/60 text-red-300 border-red-800/70';
  if (s.type === 'upsell')
    return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60 font-medium';
  if (s.priority === 'high')
    return 'bg-amber-950/50 text-amber-300 border-amber-800/60';
  return 'bg-neutral-800/60 text-neutral-400 border-neutral-700/60';
};

const getImpactBadge = (impact: string): string => {
  const map: Record<string, string> = {
    performance:      'bg-purple-950/30 text-purple-400 border-purple-900/50',
    value:            'bg-emerald-950/30 text-emerald-400 border-emerald-900/50',
    reliability:      'bg-amber-950/30 text-amber-400 border-amber-900/50',
    'future-proofing':'bg-indigo-950/30 text-indigo-400 border-indigo-900/50',
    compatibility:    'bg-red-950/30 text-red-400 border-red-900/50',
  };
  return map[impact] ?? 'bg-neutral-800 text-neutral-400 border-neutral-700';
};

// ─── PRIORITY LABEL ────────────────────────────────────────────────────────────

const PriorityPip = ({ priority }: { priority: string }) => {
  if (priority === 'critical')
    return (
      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-950/60 border border-red-800/70 text-red-300 text-[10px] tracking-widest uppercase font-bold">
        ⛔ Critical
      </span>
    );
  if (priority === 'high')
    return (
      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-950/50 border border-amber-800/60 text-amber-300 text-[10px] tracking-widest uppercase">
        ↑ Priority
      </span>
    );
  return null;
};

// ─── INDIVIDUAL CARD ───────────────────────────────────────────────────────────

interface CardProps {
  suggestion: Suggestion;
  onApply?: (s: Suggestion) => void;
}

function SuggestionCard({ suggestion: s, onApply }: CardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasComponents = s.currentComponent || s.suggestedComponent;
  const isActionable  = (s.type === 'upsell' || s.type === 'upgrade') && s.suggestedComponent;
  const isIncompat    = s.type === 'incompatible';

  return (
    <div className={`border transition-all duration-200 ${getCardStyle(s)}`}>
      {/* ── Top stripe for critical/upsell ── */}
      {(s.priority === 'critical' || s.type === 'upsell') && (
        <div
          className={`h-0.5 w-full ${
            s.priority === 'critical' ? 'bg-red-600/60' : 'bg-emerald-600/50'
          }`}
        />
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`mt-0.5 shrink-0 ${getIconColor(s)}`}>
            {getIcon(s.type, s.impact)}
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mb-1.5 flex-wrap">
              <h4 className={`text-sm font-normal leading-snug ${
                s.priority === 'critical' ? 'text-red-200' :
                s.type === 'upsell'        ? 'text-emerald-100' :
                'text-neutral-200'
              }`}>
                {s.title}
              </h4>

              {/* Badges row */}
              <div className="flex gap-1.5 flex-wrap items-center shrink-0">
                <PriorityPip priority={s.priority} />

                {s.badge && (
                  <span className={`px-2 py-0.5 border text-[10px] tracking-wide whitespace-nowrap ${getBadgeStyle(s)}`}>
                    {s.badge}
                  </span>
                )}

                <span className={`px-2 py-0.5 border text-[10px] ${getImpactBadge(s.impact)}`}>
                  {s.impact.replace('-', ' ')}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-neutral-400 text-xs leading-relaxed">
              {s.description}
            </p>

            {/* Upsell "upgrade reason" callout */}
            {s.upgradeReason && (
              <div className="mt-2 flex items-center gap-1.5 text-emerald-400 text-xs">
                <Sparkles size={11} />
                <span>{s.upgradeReason}</span>
              </div>
            )}

            {/* Component comparison (expand toggle) */}
            {hasComponents && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-2 flex items-center gap-1 text-neutral-500 hover:text-neutral-400 text-xs transition-colors"
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expanded ? 'Hide' : 'Compare components'}
              </button>
            )}

            {expanded && hasComponents && (
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                {s.currentComponent && (
                  <div className="p-2 bg-neutral-900/60 border border-neutral-800">
                    <p className="text-neutral-500 mb-0.5 text-[10px] uppercase tracking-wider">Current</p>
                    <p className="text-neutral-300 truncate">{s.currentComponent.name}</p>
                    {s.currentComponent.lowestPrice && (
                      <p className="text-neutral-500 text-[10px] mt-0.5">
                        ₹{s.currentComponent.lowestPrice.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                )}
                {s.suggestedComponent && (
                  <div className={`p-2 border ${
                    isIncompat
                      ? 'bg-red-950/20 border-red-900/50'
                      : 'bg-emerald-950/15 border-emerald-900/50'
                  }`}>
                    <p className={`mb-0.5 text-[10px] uppercase tracking-wider ${
                      isIncompat ? 'text-red-500' : 'text-emerald-500'
                    }`}>
                      {isIncompat ? 'Conflicting' : 'Suggested'}
                    </p>
                    <p className="text-neutral-300 truncate">{s.suggestedComponent.name}</p>
                    {s.suggestedComponent.lowestPrice && (
                      <p className="text-neutral-500 text-[10px] mt-0.5">
                        ₹{s.suggestedComponent.lowestPrice.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Price impact row */}
            {(s.priceDifference !== undefined || s.savings !== undefined) && (
              <div className="mt-3 flex items-center gap-3 text-xs">
                {s.priceDifference !== undefined && (
                  <div className={`flex items-center gap-1.5 ${
                    s.priceDifference > 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {s.priceDifference > 0 ? '↑' : '↓'}
                    ₹{Math.abs(s.priceDifference).toLocaleString('en-IN')}
                    <span className="text-neutral-500">
                      {s.priceDifference > 0 ? 'extra' : 'saved'}
                    </span>
                  </div>
                )}
                {s.savings !== undefined && (
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <TrendingDown size={11} />
                    Save ₹{s.savings.toLocaleString('en-IN')}
                  </div>
                )}
              </div>
            )}

            {/* CTA buttons */}
            {(isActionable || isIncompat) && (
              <div className="mt-3 flex gap-2">
                {isActionable && onApply && (
                  <button
                    onClick={() => onApply(s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/40 hover:bg-emerald-800/50 border border-emerald-800/60 hover:border-emerald-700/70 text-emerald-300 text-xs transition-all"
                  >
                    <BadgeCheck size={12} />
                    Apply upgrade
                  </button>
                )}
                {isIncompat && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 border border-red-900/50 text-red-400 text-xs select-none">
                    <XCircle size={12} />
                    Fix required
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PANEL HEADER STATS ────────────────────────────────────────────────────────

interface StatPillProps {
  count: number;
  label: string;
  colorClass: string;
}
const StatPill = ({ count, label, colorClass }: StatPillProps) =>
  count > 0 ? (
    <span className={`px-2 py-0.5 border text-[10px] tracking-wide ${colorClass}`}>
      {count} {label}
    </span>
  ) : null;

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────

export function SuggestionsPanel({ suggestions, onApplySuggestion }: SuggestionsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'upsell' | 'warning'>('all');

  if (suggestions.length === 0) return null;

  const critical = suggestions.filter(s => s.priority === 'critical' || s.type === 'incompatible');
  const upsells  = suggestions.filter(s => s.type === 'upsell');
  const warnings = suggestions.filter(s => s.type === 'warning' && s.priority !== 'critical');

  const filtered =
    filter === 'critical' ? critical :
    filter === 'upsell'   ? upsells  :
    filter === 'warning'  ? warnings :
    suggestions;

  return (
    <div className="space-y-3">
      {/* ── Panel header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 mt-2">
          <Lightbulb className="text-neutral-400" size={16} />
          <h3 className="text-neutral-300 text-sm font-light tracking-wide">Build Advisor</h3>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <StatPill
            count={critical.length}
            label="critical"
            colorClass="bg-red-950/50 text-red-400 border-red-900/60"
          />
          <StatPill
            count={upsells.length}
            label="upgrades"
            colorClass="bg-emerald-950/40 text-emerald-400 border-emerald-900/50"
          />
        </div>
      </div>

      {/* ── Filter tabs ── */}
      {(critical.length > 0 || upsells.length > 0 || warnings.length > 0) && (
        <div className="flex gap-1 border-b border-neutral-800 pb-2 overflow-x-auto">
          {(
            [
              { key: 'all',      label: `All (${suggestions.length})` },
              ...(critical.length ? [{ key: 'critical', label: `⛔ Fixes (${critical.length})` }] : []),
              ...(upsells.length  ? [{ key: 'upsell',   label: `✦ Upgrades (${upsells.length})`  }] : []),
              ...(warnings.length ? [{ key: 'warning',  label: `Warnings (${warnings.length})`   }] : []),
            ] as { key: typeof filter; label: string }[]
          ).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-2.5 py-1 text-[11px] whitespace-nowrap transition-colors border ${
                filter === tab.key
                  ? 'border-neutral-600 bg-neutral-800 text-neutral-200'
                  : 'border-transparent text-neutral-500 hover:text-neutral-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Cards ── */}
      <div className="space-y-3">
        {filtered.map((s, i) => (
          <SuggestionCard key={i} suggestion={s} onApply={onApplySuggestion} />
        ))}
      </div>
    </div>
  );
}