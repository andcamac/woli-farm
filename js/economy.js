/* ═══════════════════════════════════════════
   ECONOMY — Coin Scoring & Tokenomics Logic
   Woli Farm · Web3 Demo
   ═══════════════════════════════════════════
   DESIGN PRINCIPLES:
   1. Sustainable loop: perfect play earns ~700 WOLI/cycle,
      costs ~280 WOLI in supplies → net ~420 WOLI profit
   2. Casual play still earns: ~100-150 WOLI net per cycle
   3. Streaks reward consistency (up to +100 WOLI/day bonus)
   4. Harvest NFT rarity based on score → social/status incentive
   5. All values configurable in config.js for balancing
═══════════════════════════════════════════ */

'use strict';

const Econ = (() => {

  // ── Score a completed day ──────────────────
  function scorePreviousDay(state, dayNum) {
    const ot = state.todayOnTime;
    const allWaterOnTime = ot.w.every(v => v === true);
    const allFertOnTime  = ot.f.every(v => v === true);
    const allPerfect     = allWaterOnTime && allFertOnTime;

    let coinsThisDay = 0;
    let perfect      = false;

    if (allPerfect) {
      // Full reward: base + streak bonus
      coinsThisDay = CFG.COINS_PER_PERFECT_DAY;
      state.streakDays++;
      state.maxStreak = Math.max(state.maxStreak, state.streakDays);
      const streakBonus = Math.min(state.streakDays * CFG.COINS_STREAK_BONUS, CFG.COINS_STREAK_CAP);
      coinsThisDay += streakBonus;
      state.perfectDays++;
      perfect = true;
    } else {
      // Partial / late reward (0–10 coins)
      const tasksTotal = CFG.WATERS_PER_DAY + CFG.FERTS_PER_DAY;
      const doneCount  = ot.w.filter(Boolean).length + ot.f.filter(Boolean).length;
      // We don't track "late" vs "on-time" perfectly here — if tasks are done
      // but not all on-time, doneCount < tasksTotal after scoring
      const ratio = doneCount / tasksTotal;
      coinsThisDay = Math.round(CFG.COINS_PER_LATE_DAY_MAX * ratio);
      state.streakDays = 0; // break streak
    }

    state.coins      += coinsThisDay;
    state.coinsEarned += coinsThisDay;

    state.dayHistory.push({
      day:     dayNum,
      coins:   coinsThisDay,
      perfect,
      health:  state.health,
      streak:  state.streakDays,
    });

    return { coinsThisDay, perfect };
  }

  // ── Score final harvest ────────────────────
  function scoreHarvest(state) {
    let bonus = CFG.COINS_HARVEST_BASE;
    bonus += state.health * CFG.COINS_HARVEST_HEALTH;
    bonus += state.perfectDays * CFG.COINS_HARVEST_PERFECT;
    state.coins       += bonus;
    state.coinsEarned += bonus;
    state.totalCyclesCompleted++;
    return bonus;
  }

  // ── Compute NFT rarity for a completed cycle ──
  function computeRarity(state) {
    // Max possible score: 7 perfect days with max streak bonus + full health harvest
    const maxPossible = (CFG.COINS_PER_PERFECT_DAY + CFG.COINS_STREAK_CAP) * 7
                      + CFG.COINS_HARVEST_BASE
                      + 100 * CFG.COINS_HARVEST_HEALTH
                      + 7   * CFG.COINS_HARVEST_PERFECT;

    const pct = (state.coinsEarned / maxPossible) * 100;
    const rarity = CFG.RARITY.find(r => pct >= r.min) || CFG.RARITY[CFG.RARITY.length - 1];
    return { pct: Math.round(pct), ...rarity };
  }

  // ── Shop: buy items ────────────────────────
  function buy(state, itemKey) {
    const items = shopItems();
    const item  = items.find(i => i.key === itemKey);
    if (!item) return { ok: false, msg: 'Ítem no encontrado.' };
    if (state.coins < item.price) return { ok: false, msg: `Necesitas ${item.price} WOLI. Tienes ${state.coins}.` };

    state.coins      -= item.price;
    state.coinsSpent += item.price;

    item.gives.forEach(g => {
      state[g.key] = (state[g.key] || 0) + g.amount;
    });

    return { ok: true, msg: `✓ ${item.name} comprado por ${item.price} WOLI.` };
  }

  // ── Shop item catalogue ────────────────────
  function shopItems() {
    return [
      {
        key:    'water1',
        name:   '💧 Agua × 1',
        desc:   '1 unidad de agua para regar',
        price:  CFG.PRICE_WATER,
        gives:  [{ key: 'water', amount: 1 }],
        badge:  null,
      },
      {
        key:    'water3',
        name:   '💧 Agua × 3',
        desc:   'Pack de 3 riegos — ahorra 5 WOLI',
        price:  CFG.PRICE_WATER_PACK,
        gives:  [{ key: 'water', amount: 3 }],
        badge:  'AHORRO',
      },
      {
        key:    'fert1',
        name:   '🌿 Fertilizante × 1',
        desc:   '1 aplicación de fertilizante',
        price:  CFG.PRICE_FERT,
        gives:  [{ key: 'fert', amount: 1 }],
        badge:  null,
      },
      {
        key:    'fert2',
        name:   '🌿 Fertilizante × 2',
        desc:   'Pack doble — ahorra 5 WOLI',
        price:  CFG.PRICE_FERT_PACK,
        gives:  [{ key: 'fert', amount: 2 }],
        badge:  'AHORRO',
      },
      {
        key:    'seed1',
        name:   '🌱 Semilla Premium',
        desc:   'Semilla certificada para nuevo ciclo',
        price:  CFG.PRICE_SEED,
        gives:  [{ key: 'seeds', amount: 1 }],
        badge:  null,
      },
      {
        key:    'kit1',
        name:   '🎒 Kit Iniciador',
        desc:   '1 semilla + 3 agua + 2 fert — ahorra 10 WOLI',
        price:  CFG.PRICE_STARTER_KIT,
        gives:  [{ key: 'seeds', amount: 1 }, { key: 'water', amount: 3 }, { key: 'fert', amount: 2 }],
        badge:  'MEJOR VALOR',
      },
    ];
  }

  // ── Economy summary for UI ─────────────────
  function summary(state) {
    const spent   = state.coinsSpent;
    const earned  = state.coinsEarned;
    const net     = earned - spent;
    const days    = state.dayHistory.length;
    const perfect = state.dayHistory.filter(d => d.perfect).length;
    return { spent, earned, net, days, perfect, balance: state.coins };
  }

  return { scorePreviousDay, scoreHarvest, computeRarity, buy, shopItems, summary };
})();
