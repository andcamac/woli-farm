/* ═══════════════════════════════════════════
   CONFIG — Game Constants & Economy Design
   Woli Farm · Web3 Demo
   ═══════════════════════════════════════════
   TOKENOMICS RATIONALE:
   - A perfect 7-day cycle earns ~700 WOLI
   - Supplies cost ~280 WOLI total to sustain a full cycle
   - Net profit per perfect cycle: ~420 WOLI
   - Imperfect play earns less but costs the same → incentivizes engagement
   - Streak bonuses reward consistent players with up to 2x multiplier
   - This creates a healthy play-to-earn loop without hyperinflation:
     casual player earns ~150-250 WOLI/cycle net
     dedicated player earns ~400-500 WOLI/cycle net
═══════════════════════════════════════════ */

'use strict';

const CFG = Object.freeze({

  // ── Cycle ──────────────────────────────────
  CYCLE_DAYS:          7,          // real calendar days per grow cycle
  MS_PER_GAME_HOUR:    3600000,    // 1 real hour = 1 game hour (true real-time)

  // ── Daily requirements ─────────────────────
  WATERS_PER_DAY:      3,          // required daily waterings
  FERTS_PER_DAY:       1,          // required daily fertilizations

  // Window: each task fires at a random minute within a window
  // Player has TASK_WINDOW_MINS to respond before it's "late"
  WATER_WINDOWS:       [7, 13, 19], // hours of day water tasks fire (morning, midday, evening)
  FERT_WINDOW:         [10],        // hour fertilizer task fires
  TASK_WINDOW_MINS:    90,          // minutes to complete task for full reward
  TASK_LATE_MINS:      180,         // minutes before task expires entirely

  // ── Economy ────────────────────────────────
  // Rewards
  COINS_PER_PERFECT_DAY:   100,    // all tasks done on time
  COINS_PER_LATE_DAY_MAX:  10,     // max coins if tasks done late
  COINS_STREAK_BONUS:      20,     // extra coins per streak day (multiplier: streakDays * 20, cap 100)
  COINS_STREAK_CAP:        100,
  COINS_HARVEST_BASE:      200,    // bonus for completing full 7-day cycle
  COINS_HARVEST_HEALTH:    1,      // extra coin per health % point at harvest
  COINS_HARVEST_PERFECT:   50,     // bonus per perfect day at harvest

  // Costs (shop)
  PRICE_WATER:       10,   // per unit of water (1 watering = 1 unit)
  PRICE_FERT:        15,   // per unit of fertilizer
  PRICE_SEED:        30,   // per seed (needed to start new cycle)
  PRICE_WATER_PACK:  25,   // 3x water bundle (saves 5 coins)
  PRICE_FERT_PACK:   25,   // 2x fert bundle (saves 5 coins)
  PRICE_STARTER_KIT: 60,   // seed + 3 water + 2 fert bundle (saves 10 coins)

  // Starting inventory (demo gift so players can start immediately)
  START_COINS:       80,
  START_WATER:       3,
  START_FERT:        2,
  START_SEEDS:       1,

  // ── Health ─────────────────────────────────
  HEALTH_MAX:        100,
  HEALTH_DECAY_MISSED_WATER: 12,   // per missed watering
  HEALTH_DECAY_MISSED_FERT:  8,    // per missed fertilization
  HEALTH_BOOST_WATER:        5,
  HEALTH_BOOST_FERT:         8,
  HEALTH_MIN:        10,           // plant never fully dies (demo UX)

  // ── Stages (days → stage) ──────────────────
  STAGES: [
    { day: 0, name: 'Sin semilla',    label: 'Planta tu semilla para comenzar' },
    { day: 1, name: 'Germinando',     label: 'La semilla despierta bajo tierra' },
    { day: 2, name: 'Brote',          label: 'Primeros cotiledones visibles' },
    { day: 3, name: 'Plántula',       label: 'Primeras hojas verdaderas' },
    { day: 4, name: 'Vegetativa',     label: 'Crecimiento rápido en marcha' },
    { day: 5, name: 'Pre-floración',  label: 'Signos de sexo y pre-flores' },
    { day: 6, name: 'Floración',      label: 'Capullos formándose' },
    { day: 7, name: '¡Cosecha!',      label: 'Lista para cosechar 🌸' },
  ],

  // ── NFT Rarity thresholds (% of max possible score) ──
  RARITY: [
    { min: 90, label: '💎 Legendaria', color: '#f0d080' },
    { min: 75, label: '🔮 Épica',      color: '#c080f0' },
    { min: 55, label: '💙 Rara',       color: '#60a0f0' },
    { min: 30, label: '🟢 Común',      color: '#4caf78' },
    { min: 0,  label: '⚪ Básica',     color: '#888888' },
  ],

  // ── Web3 tokenomics preview ────────────────
  TOKENOMICS: {
    maxSupply:         10_000_000,
    playToEarn:        0.40,   // 40% = 4,000,000 WOLI for P2E rewards
    liquidity:         0.20,
    team:              0.20,   // 2-year vesting
    ecosystem:         0.20,
    estimatedConvert:  0.05,   // placeholder USD value per WOLI at launch
  },
});
