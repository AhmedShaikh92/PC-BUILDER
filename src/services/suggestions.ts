import type { Component } from './api';

// Define the SelectedComponent interface
export interface SelectedComponent {
  component: Component;
  selectedPrice: number;
}

// Define the Suggestion interface
export interface Suggestion {
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
  badge?: string; // e.g. "Only ₹800 more!", "INCOMPATIBLE"
  upgradeReason?: string; // short punchy upsell line
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const getNumericSpec = (
  component: SelectedComponent | undefined,
  specKey: string,
  defaultValue: number = 0
): number => {
  if (!component) return defaultValue;
  const value = component.component.specs[specKey];
  if (typeof value === 'string') {
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  if (typeof value === 'number') return value;
  return defaultValue;
};

const getStringSpec = (
  component: SelectedComponent | undefined,
  specKey: string,
  defaultValue: string = ''
): string => {
  if (!component) return defaultValue;
  const value = component.component.specs[specKey];
  return typeof value === 'string' ? value : defaultValue;
};

const fmt = (n: number) => n.toLocaleString('en-IN');

// How much more expensive is candidate vs current? Returns percent (e.g. 12 = 12% more)
const priceDeltaPct = (current: number, candidate: number) =>
  Math.round(((candidate - current) / current) * 100);

// Read the canonical price off a raw Component from the API
const getComponentPrice = (c: Component): number => c.lowestPrice ?? 0;

// Find the cheapest component in the next tier (within X% of current price)
const findUpsellCandidate = (
  available: Component[],
  currentPrice: number,
  maxPremiumPct: number = 25
): Component | undefined => {
  const maxPrice = currentPrice * (1 + maxPremiumPct / 100);
  return available
    .filter((c) => {
      const price = getComponentPrice(c);
      return price > currentPrice && price <= maxPrice;
    })
    .sort((a, b) => (getComponentPrice(a)) - (getComponentPrice(b)))[0];
};

// ─── MAIN FUNCTION ────────────────────────────────────────────────────────────

export const generateBuildSuggestions = (
  selectedComponents: Record<string, SelectedComponent>,
  totalPrice: number,
  availableComponents: Record<string, Component[]> = {}
): Suggestion[] => {
  const suggestions: Suggestion[] = [];

  const cpu        = selectedComponents['CPU'];
  const motherboard = selectedComponents['Motherboard'];
  const ram        = selectedComponents['RAM'];
  const storage    = selectedComponents['Storage'];
  const gpu        = selectedComponents['GPU'];
  const psu        = selectedComponents['PSU'];
  const cpuCooler  = selectedComponents['CPU Cooler'];
  const case_      = selectedComponents['Case'];

  // =========================================================================
  // 0. HARD COMPATIBILITY CHECKS  (critical — always show first)
  // =========================================================================

  // Socket mismatch: CPU ↔ Motherboard
  if (cpu && motherboard) {
    const cpuSocket    = getStringSpec(cpu, 'socket');
    const mbSocket     = getStringSpec(motherboard, 'socket');
    const cpuSocketAlt = getStringSpec(cpu, 'socketType');
    const mbSocketAlt  = getStringSpec(motherboard, 'socketType');

    const effectiveCPUSocket = cpuSocket || cpuSocketAlt;
    const effectiveMBSocket  = mbSocket  || mbSocketAlt;

    if (
      effectiveCPUSocket &&
      effectiveMBSocket &&
      effectiveCPUSocket.toLowerCase() !== effectiveMBSocket.toLowerCase()
    ) {
      suggestions.push({
        type: 'incompatible',
        category: 'Compatibility',
        title: '⚠ CPU & Motherboard Socket Mismatch',
        description: `Your CPU uses socket ${effectiveCPUSocket} but the motherboard only supports ${effectiveMBSocket}. This build will not POST. You must match sockets.`,
        currentComponent: cpu.component,
        suggestedComponent: motherboard.component,
        priority: 'critical',
        impact: 'compatibility',
        badge: 'INCOMPATIBLE',
      });
    }
  }

  // RAM type mismatch: Motherboard DDR4 vs DDR5
  if (ram && motherboard) {
    const ramType    = getStringSpec(ram, 'type').toUpperCase();
    const mbRamTypes = getStringSpec(motherboard, 'memoryType').toUpperCase();

    if (ramType && mbRamTypes && !mbRamTypes.includes(ramType)) {
      suggestions.push({
        type: 'incompatible',
        category: 'Compatibility',
        title: '⚠ RAM Type Not Supported by Motherboard',
        description: `Your RAM is ${ramType} but this motherboard supports ${mbRamTypes}. They are physically incompatible — different slot notches, different voltages.`,
        currentComponent: ram.component,
        suggestedComponent: motherboard.component,
        priority: 'critical',
        impact: 'compatibility',
        badge: 'INCOMPATIBLE',
      });
    }
  }

  // GPU length vs case clearance
  if (gpu && case_) {
    const gpuLength       = getNumericSpec(gpu, 'lengthMM');
    const caseMaxGPULen   = getNumericSpec(case_, 'maxGPULengthMM');

    if (gpuLength > 0 && caseMaxGPULen > 0 && gpuLength > caseMaxGPULen) {
      suggestions.push({
        type: 'incompatible',
        category: 'Compatibility',
        title: '⚠ GPU Too Long for This Case',
        description: `Your GPU is ${gpuLength}mm long, but the case only fits up to ${caseMaxGPULen}mm. It physically will not fit. Choose a shorter GPU or a larger case.`,
        currentComponent: gpu.component,
        suggestedComponent: case_.component,
        priority: 'critical',
        impact: 'compatibility',
        badge: 'WON\'T FIT',
      });
    }
  }

  // PSU connector: check for PCIe 5.0 GPU needing 16-pin vs standard cables
  if (gpu && psu) {
    const gpuConnector = getStringSpec(gpu, 'powerConnector').toLowerCase();
    const psuConnectors = getStringSpec(psu, 'connectors').toLowerCase();

    if (
      gpuConnector.includes('16-pin') &&
      psuConnectors &&
      !psuConnectors.includes('16-pin') &&
      !psuConnectors.includes('600w')
    ) {
      suggestions.push({
        type: 'warning',
        category: 'Compatibility',
        title: 'PCIe 5.0 Connector May Need Adapter',
        description: `Your GPU uses a 16-pin (600W) PCIe 5.0 connector. If your PSU only has 8-pin plugs, you'll need a multi-8pin adapter. Cheap adapters have caused fires — use the bundled cable from the GPU box.`,
        currentComponent: psu.component,
        priority: 'high',
        impact: 'reliability',
        badge: 'CHECK CABLES',
      });
    }
  }

  // M.2 slot availability
  if (storage && motherboard) {
    const storageInterface = getStringSpec(storage, 'interface').toUpperCase();
    const mbM2Slots        = getNumericSpec(motherboard, 'm2Slots', -1);

    if (storageInterface.includes('NVME') || storageInterface.includes('M.2')) {
      if (mbM2Slots === 0) {
        suggestions.push({
          type: 'incompatible',
          category: 'Compatibility',
          title: '⚠ Motherboard Has No M.2 Slots',
          description: `You selected an NVMe M.2 drive, but this motherboard has no M.2 slots. Switch to a SATA SSD or choose a motherboard with at least one M.2 slot.`,
          currentComponent: storage.component,
          suggestedComponent: motherboard.component,
          priority: 'critical',
          impact: 'compatibility',
          badge: 'INCOMPATIBLE',
        });
      }
    }
  }

  // CPU cooler TDP headroom
  if (cpu && cpuCooler) {
    const cpuTDP    = getNumericSpec(cpu, 'tdp');
    const coolerTDP = getNumericSpec(cpuCooler, 'tdpRating');

    if (coolerTDP > 0 && cpuTDP > coolerTDP * 1.1) {
      suggestions.push({
        type: 'warning',
        category: 'Compatibility',
        title: 'Cooler Under-Rated for Your CPU',
        description: `Your CPU has a ${cpuTDP}W TDP but the cooler is only rated for ${coolerTDP}W. Under sustained load you'll thermal-throttle, losing 15-25% performance.`,
        currentComponent: cpuCooler.component,
        priority: 'high',
        impact: 'reliability',
        badge: 'UNDER-RATED',
      });
    }
  }

  // =========================================================================
  // 1. SMART UPSELL — "Just ₹X more" suggestions
  // =========================================================================

  // RAM: suggest next capacity tier if within 20%
  if (ram && availableComponents['RAM']) {
    const currentRAM   = ram.selectedPrice;
    const candidate    = findUpsellCandidate(availableComponents['RAM'], currentRAM, 20);
    const currentGB    = getNumericSpec(ram, 'capacityGB');
    const currentSpeed = getNumericSpec(ram, 'speedMHz');

    if (candidate) {
      const candidateGB    = parseInt(String(candidate.specs['capacityGB']  ?? '0'));
      const candidateSpeed = parseInt(String(candidate.specs['speedMHz']    ?? '0'));
      const diff           = (getComponentPrice(candidate)) - currentRAM;
      const delta          = priceDeltaPct(currentRAM, getComponentPrice(candidate));

      const betterGB    = candidateGB    > currentGB;
      const betterSpeed = candidateSpeed > currentSpeed;

      if (betterGB || betterSpeed) {
        const benefit = betterGB
          ? `${candidateGB}GB instead of ${currentGB}GB`
          : `${candidateSpeed}MHz instead of ${currentSpeed}MHz`;

        suggestions.push({
          type: 'upsell',
          category: 'RAM',
          title: `Better RAM for Just ₹${fmt(diff)} More`,
          description: `For only ${delta}% extra budget, you get ${benefit}. ${betterGB ? 'More RAM means smoother multitasking and future-proofing.' : 'Faster RAM gives Ryzen CPUs a measurable performance boost.'}`,
          currentComponent: ram.component,
          suggestedComponent: candidate,
          priceDifference: diff,
          priority: 'medium',
          impact: 'performance',
          badge: `Only ₹${fmt(diff)} more!`,
          upgradeReason: benefit,
        });
      }
    }
  }

  // Storage: suggest 1TB NVMe if user picked 512GB or SATA
  if (storage && availableComponents['Storage']) {
    const currentCapGB   = getNumericSpec(storage, 'capacityGB');
    const currentIface   = getStringSpec(storage, 'interface').toUpperCase();
    const currentPrice   = storage.selectedPrice;
    const candidate      = findUpsellCandidate(availableComponents['Storage'], currentPrice, 30);

    if (candidate) {
      const candidateGB    = parseInt(String(candidate.specs['capacityGB'] ?? '0'));
      const candidateIface = String(candidate.specs['interface'] ?? '').toUpperCase();
      const diff           = (getComponentPrice(candidate)) - currentPrice;
      const isSATAtoNVMe   = currentIface.includes('SATA') && (candidateIface.includes('NVME') || candidateIface.includes('M.2'));
      const isDoubleSpace  = candidateGB >= currentCapGB * 1.8;

      if (isSATAtoNVMe || isDoubleSpace) {
        const reason = isSATAtoNVMe
          ? `Switch from SATA to NVMe — 3–5× faster reads/writes`
          : `Double your storage from ${currentCapGB}GB → ${candidateGB}GB`;

        suggestions.push({
          type: 'upsell',
          category: 'Storage',
          title: isSATAtoNVMe ? `Go NVMe for Just ₹${fmt(diff)} More` : `Double Storage for ₹${fmt(diff)} More`,
          description: `${reason}. Once you're on NVMe you'll never go back — boots, game loads, and exports are dramatically snappier.`,
          currentComponent: storage.component,
          suggestedComponent: candidate,
          priceDifference: diff,
          priority: 'medium',
          impact: isSATAtoNVMe ? 'performance' : 'value',
          badge: `Only ₹${fmt(diff)} more!`,
          upgradeReason: reason,
        });
      }
    }
  }

  // CPU: suggest next tier CPU if GPU is high-end (prevent bottleneck upsell)
  if (cpu && gpu && availableComponents['CPU']) {
    const gpuPrice   = gpu.selectedPrice;
    const cpuPrice   = cpu.selectedPrice;
    const candidate  = findUpsellCandidate(availableComponents['CPU'], cpuPrice, 20);

    if (candidate && gpuPrice > cpuPrice * 2.5) {
      const diff  = (getComponentPrice(candidate)) - cpuPrice;
      const delta = priceDeltaPct(cpuPrice, getComponentPrice(candidate));

      suggestions.push({
        type: 'upsell',
        category: 'CPU',
        title: `Unlock Your GPU's Potential — +₹${fmt(diff)}`,
        description: `Your GPU is ₹${fmt(gpuPrice)} but the CPU is only ₹${fmt(cpuPrice)}. For ${delta}% more, ${candidate.name} would remove the bottleneck and push 15–25% more FPS in CPU-bound games.`,
        currentComponent: cpu.component,
        suggestedComponent: candidate,
        priceDifference: diff,
        priority: 'high',
        impact: 'performance',
        badge: `Unlock ${delta}% more FPS`,
        upgradeReason: 'Eliminate CPU bottleneck',
      });
    }
  }

  // PSU: suggest modular if non-modular, for cable management quality-of-life
  if (psu && availableComponents['PSU']) {
    const isModular = getStringSpec(psu, 'modular').toLowerCase();
    const currentPSUPrice = psu.selectedPrice;

    if (isModular === 'non-modular' || isModular === 'false') {
      const candidate = findUpsellCandidate(availableComponents['PSU'], currentPSUPrice, 25);

      if (candidate) {
        const candidateModular = getStringSpec(
          { component: candidate, selectedPrice: getComponentPrice(candidate) },
          'modular'
        ).toLowerCase();

        if (candidateModular === 'fully modular' || candidateModular === 'semi-modular' || candidateModular === 'true') {
          const diff = getComponentPrice(candidate) - currentPSUPrice;
          suggestions.push({
            type: 'upsell',
            category: 'PSU',
            title: `Go Modular — Only ₹${fmt(diff)} More`,
            description: `A modular PSU means you only plug in cables you actually use. Way less clutter, better airflow, and a much nicer-looking build. Your future self will thank you.`,
            currentComponent: psu.component,
            suggestedComponent: candidate,
            priceDifference: diff,
            priority: 'low',
            impact: 'value',
            badge: `Only ₹${fmt(diff)} more!`,
            upgradeReason: 'Better cable management & airflow',
          });
        }
      }
    }
  }

  // =========================================================================
  // 2. PERFORMANCE OPTIMIZATIONS
  // =========================================================================

  // GPU-CPU balance for gaming
  if (gpu && cpu) {
    const gpuPrice = gpu.selectedPrice;
    const cpuPrice = cpu.selectedPrice;
    const gpuTDP   = getNumericSpec(gpu, 'tdp');
    const cpuTDP   = getNumericSpec(cpu, 'tdp');

    if (gpuPrice < cpuPrice * 0.8 && cpuTDP > 65) {
      suggestions.push({
        type: 'alternative',
        category: 'Balance',
        title: 'GPU Is Underpowered for This CPU',
        description: `Your GPU (₹${fmt(gpuPrice)}) costs less than your CPU (₹${fmt(cpuPrice)}). For gaming, GPU should be the star. Invest more here for 40–60% better frame rates.`,
        currentComponent: cpu.component,
        priority: 'high',
        impact: 'performance',
      });
    }

    // Warn about CPU bottleneck if GPU >> CPU
    if (gpuPrice > cpuPrice * 3 && cpuTDP < 150) {
      suggestions.push({
        type: 'warning',
        category: 'Balance',
        title: 'CPU May Bottleneck This GPU',
        description: `This high-end GPU (₹${fmt(gpuPrice)}) will be held back by a budget CPU in most games. You could be leaving 20–30% FPS on the table.`,
        currentComponent: cpu.component,
        priority: 'high',
        impact: 'performance',
      });
    }
  }

  // Ryzen: faster RAM benefit
  if (ram && cpu) {
    const ramSpeed = getNumericSpec(ram, 'speedMHz');
    const cpuName  = cpu.component.name.toLowerCase();

    if (ramSpeed < 3200 && cpuName.includes('ryzen')) {
      suggestions.push({
        type: 'upgrade',
        category: 'RAM',
        title: 'Ryzen Loves Fast RAM',
        description: `Ryzen CPUs share bandwidth between CPU cores and the memory controller. Upgrading to 3600MHz CL16 gives 5–10% better performance in games and applications — often for under ₹500 more.`,
        currentComponent: ram.component,
        priority: 'medium',
        impact: 'performance',
      });
    }
  }

  // =========================================================================
  // 3. RELIABILITY CHECKS
  // =========================================================================

  // PSU headroom
  if (psu && (cpu || gpu)) {
    const psuWattage = getNumericSpec(psu, 'wattage') || getNumericSpec(psu, 'Wattage');
    let estimatedPower = 75; // mobo + fans baseline
    if (cpu)       estimatedPower += getNumericSpec(cpu, 'tdp', 65);
    if (gpu)       estimatedPower += getNumericSpec(gpu, 'tdp', 150);
    if (cpuCooler && getStringSpec(cpuCooler, 'type') === 'Liquid') estimatedPower += 15;

    const recommendedWattage = Math.ceil(estimatedPower * 1.4);
    const headroom = psuWattage > 0 ? ((psuWattage - estimatedPower) / estimatedPower) * 100 : 999;

    if (psuWattage > 0 && headroom < 20) {
      suggestions.push({
        type: 'warning',
        category: 'PSU',
        title: 'Dangerously Low PSU Headroom',
        description: `Your PSU (${psuWattage}W) has only ${Math.round(headroom)}% headroom vs estimated ${estimatedPower}W draw. Spikes during gaming can cause random shutdowns or PSU failure.`,
        currentComponent: psu.component,
        priority: 'high',
        impact: 'reliability',
        badge: 'RISKY',
      });
    }

    if (psuWattage > 0 && headroom > 100 && psuWattage > 850) {
      suggestions.push({
        type: 'downgrade',
        category: 'PSU',
        title: 'PSU Is Overkill — Save Money',
        description: `A ${psuWattage}W PSU is massive overkill. A ${recommendedWattage}W Gold-rated unit would save you ~₹${fmt(Math.round(psu.selectedPrice * 0.35))} and actually run more efficiently at your typical loads.`,
        currentComponent: psu.component,
        savings: Math.round(psu.selectedPrice * 0.35),
        priority: 'low',
        impact: 'value',
      });
    }
  }

  // CPU cooling
  if (cpu && !cpuCooler) {
    const cpuTDP   = getNumericSpec(cpu, 'tdp');
    const cpuName  = cpu.component.name.toLowerCase();
    const isKSeries = cpuName.includes(' k') || cpuName.includes('-k'); // Intel unlocked
    const isX      = cpuName.includes('x3d') || cpuName.includes(' x ');

    if (cpuTDP > 125 || isKSeries || isX) {
      suggestions.push({
        type: 'warning',
        category: 'CPU Cooler',
        title: 'This CPU Needs an Aftermarket Cooler',
        description: `High-performance CPUs often don't include any cooler in the box, or include one only for basic non-overclocked use. Without proper cooling you'll thermal-throttle immediately.`,
        priority: 'high',
        impact: 'reliability',
        badge: 'NO COOLER INCLUDED',
      });
    } else if (cpuTDP > 65) {
      suggestions.push({
        type: 'tip',
        category: 'CPU Cooler',
        title: 'Add an Aftermarket Cooler',
        description: `A ₹1,500–₹2,500 tower cooler would drop your temps 10–15°C and make the build noticeably quieter. Components run longer when cool.`,
        priority: 'low',
        impact: 'reliability',
      });
    }
  }

  // =========================================================================
  // 4. VALUE & STORAGE OPTIMISATION
  // =========================================================================

  if (storage) {
    const capacityGB   = getNumericSpec(storage, 'capacityGB');
    const price        = storage.selectedPrice;
    const pricePerGB   = capacityGB > 0 ? price / capacityGB : 0;

    if (pricePerGB > 8 && capacityGB < 500) {
      suggestions.push({
        type: 'downgrade',
        category: 'Storage',
        title: 'Paying Too Much Per GB',
        description: `You're paying ₹${pricePerGB.toFixed(1)}/GB. A 1TB NVMe from the same brand would halve your cost-per-GB while giving you more space.`,
        currentComponent: storage.component,
        priceDifference: Math.round(price * 0.5),
        priority: 'medium',
        impact: 'value',
      });
    }

    const interface_ = getStringSpec(storage, 'interface');
    if (interface_.toUpperCase() === 'SATA III' && totalPrice > 40000) {
      suggestions.push({
        type: 'upgrade',
        category: 'Storage',
        title: 'NVMe Is Only ₹1,000–₹1,500 More',
        description: `SATA SSDs top out at ~550MB/s. NVMe is 3–5× faster for game loads, boot times, and large file transfers. At your budget it's an easy yes.`,
        currentComponent: storage.component,
        priceDifference: 1250,
        priority: 'medium',
        impact: 'performance',
        badge: 'Best Bang-for-Buck',
      });
    }
  }

  // =========================================================================
  // 5. BUDGET-SPECIFIC TIPS
  // =========================================================================

  if (totalPrice < 30000 && cpu && !gpu) {
    suggestions.push({
      type: 'tip',
      category: 'Budget',
      title: 'Solid Office Build!',
      description: `₹${fmt(totalPrice)} is a great foundation for work and browsing. When budget allows, a ₹10,000–₹15,000 GPU would transform this into a light gaming rig too.`,
      priority: 'low',
      impact: 'future-proofing',
    });
  }

  if (totalPrice >= 50000 && totalPrice < 80000 && cpu && gpu) {
    const cpuToGPURatio = cpu.selectedPrice / gpu.selectedPrice;
    if (cpuToGPURatio > 0.7) {
      suggestions.push({
        type: 'alternative',
        category: 'Budget',
        title: 'Rebalance for More FPS',
        description: `In this budget range, gamers get better results with a 35:65 CPU:GPU split. A slightly cheaper CPU and reinvesting the savings into the GPU can give 15–25% better frame rates in most titles.`,
        priority: 'medium',
        impact: 'performance',
      });
    }
  }

  if (totalPrice > 150000) {
    suggestions.push({
      type: 'tip',
      category: 'Budget',
      title: 'High-End Build Checklist',
      description: `At this budget, don't short-change: (1) Min 32GB DDR5, (2) Gen4/Gen5 NVMe, (3) 850W+ Gold/Platinum PSU, (4) Mesh-front case for airflow, (5) 360mm AIO if pushing clock speeds.`,
      priority: 'medium',
      impact: 'future-proofing',
    });
  }

  // =========================================================================
  // 6. MISSING COMPONENTS
  // =========================================================================

  if (!gpu && cpu && totalPrice > 40000) {
    suggestions.push({
      type: 'warning',
      category: 'GPU',
      title: 'No GPU Selected',
      description: `With a ₹${fmt(totalPrice)} budget, a dedicated GPU is worth adding. Even a ₹15,000–₹20,000 card makes gaming and creative workloads dramatically better.`,
      priority: 'high',
      impact: 'performance',
    });
  }

  if (!cpuCooler && cpu && getNumericSpec(cpu, 'tdp') > 65) {
    suggestions.push({
      type: 'tip',
      category: 'CPU Cooler',
      title: 'CPU Cooler Not Selected',
      description: 'CPUs above 65W TDP rarely include adequate box coolers. Pick an aftermarket cooler to avoid throttling and noise.',
      priority: 'medium',
      impact: 'reliability',
    });
  }

  // =========================================================================
  // SORT: critical > high > medium > low, then compatibility > performance > reliability > value
  // =========================================================================

  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const impactOrder: Record<string, number>   = {
    compatibility: 0,
    performance: 1,
    reliability: 2,
    value: 3,
    'future-proofing': 4,
  };

  return suggestions.sort((a, b) => {
    const pd = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pd !== 0) return pd;
    return impactOrder[a.impact] - impactOrder[b.impact];
  });
};