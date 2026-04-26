/* ═══════════════════════════════════════════
   FARM — Core Game Actions
   Woli Farm · Web3 Demo
═══════════════════════════════════════════ */
'use strict';

const Farm = (() => {

  let S = null; // reference to current state (set by main.js)

  function init(state) { S = state; }

  // ── Plant seed ─────────────────────────────
  function plant() {
    if (S.seeds < 1) {
      UI.toast('Sin semillas. Compra en la tienda. 🛒');
      return;
    }
    S.seeds--;
    S.cycleActive    = true;
    S.cycleStartTime = Date.now();
    S.cycleDay       = 1;
    S.stageIdx       = 1;
    S.health         = 100;
    S.perfectDays    = 0;
    S.streakDays     = 0;
    S.maxStreak      = 0;
    S.coinsEarned    = 0;
    S.coinsSpent     = 0;
    S.dayHistory     = [];
    S.lastDayChecked = null;
    S.dayWaters      = 0;
    S.dayFert        = 0;
    S.todayOnTime    = { w: [false,false,false], f: [false] };
    S.tasks          = [];

    saveState(S);
    UI.log(S, '🌱 Semilla plantada. ¡Ciclo de 7 días iniciado!', 'good');
    UI.toast('¡Semilla plantada! Espera las notificaciones de riego.');
    Notifications.requestPermission();
  }

  // ── Water ──────────────────────────────────
  function water() {
    if (!S.cycleActive) {
      // Act as plant button when no cycle running
      plant();
      return;
    }
    if (S.water < 1)    { UI.toast('Sin agua. Compra en la tienda. 🛒'); UI.openShop(); return; }
    if (S.dayWaters >= CFG.WATERS_PER_DAY) { UI.toast('Ya regaste 3 veces hoy. ¡Bien hecho!'); return; }

    const timing = Clock.completeTask(S, 'water');
    S.water--;
    S.dayWaters++;
    S.health = Math.min(CFG.HEALTH_MAX, S.health + CFG.HEALTH_BOOST_WATER);

    spawnDrops();

    if (timing === 'ontime') {
      UI.log(S, `💧 Riego ${S.dayWaters}/3 — ¡A TIEMPO! +potencial 100 🪙`, 'good');
      UI.toast('💧 ¡Regado a tiempo! Sigue así para 100 WOLI hoy.');
    } else if (timing === 'late') {
      UI.log(S, `💧 Riego ${S.dayWaters}/3 — tarde (máx 10 🪙 hoy)`, 'warn');
      UI.toast('💧 Regado, pero tarde. Perderás parte de los WOLI.');
    } else {
      UI.log(S, `💧 Riego ${S.dayWaters}/3 — sin ventana activa`, '');
      UI.toast('💧 Regado fuera de ventana.');
    }

    saveState(S);
    UI.render(S);
  }

  // ── Fertilize ─────────────────────────────
  function fertilize() {
    if (!S.cycleActive) { UI.toast('Primero planta una semilla.'); return; }
    if (S.fert < 1)    { UI.toast('Sin fertilizante. Compra en la tienda. 🛒'); UI.openShop(); return; }
    if (S.dayFert >= CFG.FERTS_PER_DAY) { UI.toast('Ya fertilizaste hoy. ¡Perfecto!'); return; }

    const timing = Clock.completeTask(S, 'fert');
    S.fert--;
    S.dayFert++;
    S.health = Math.min(CFG.HEALTH_MAX, S.health + CFG.HEALTH_BOOST_FERT);

    spawnFertParticles();

    if (timing === 'ontime') {
      UI.log(S, `🌿 Fertilizado — ¡A TIEMPO! +8 salud 💚`, 'good');
      UI.toast('🌿 ¡Fertilizado a tiempo! +8 salud.');
    } else if (timing === 'late') {
      UI.log(S, `🌿 Fertilizado — tarde`, 'warn');
      UI.toast('🌿 Fertilizado, pero tarde.');
    } else {
      UI.log(S, `🌿 Fertilizado fuera de ventana`, '');
      UI.toast('🌿 Fertilizado.');
    }

    saveState(S);
    UI.render(S);
  }

  // ── Buy from shop ──────────────────────────
  function buy(itemKey) {
    const result = Econ.buy(S, itemKey);
    UI.toast(result.msg);
    if (result.ok) {
      UI.log(S, `🛒 ${result.msg}`, 'good');
      Shop.render(S); // refresh shop prices/balance
    }
    saveState(S);
    UI.render(S);
  }

  // ── Day transition (called by Clock) ───────
  function onDayChange(state, newDay) {
    S = state;

    if (newDay === 8 || S.cycleComplete) {
      // Harvest!
      const bonus   = Econ.scoreHarvest(S);
      const rarity  = Econ.computeRarity(S);
      S.cycleActive = false;
      saveState(S);
      spawnHarvestBurst();

      // Save harvest snapshot to Firestore (collection placeholder for NFT)
      saveHarvestSnapshot(S, bonus, rarity).catch(e =>
        console.warn('Harvest save failed:', e.message)
      );

      setTimeout(() => UI.showHarvest(S, bonus, rarity), 1200);
      UI.log(S, `🌸 ¡COSECHA! +${bonus} WOLI — Rareza: ${rarity.label}`, 'harvest');
      return;
    }

    // New day — update stage
    S.stageIdx = Math.min(newDay, CFG.STAGES.length - 1);
    UI.log(S, `🌅 Día ${newDay} — ${CFG.STAGES[S.stageIdx]?.name}`, 'day');
    UI.toast(`🌅 Día ${newDay}/7 — ${CFG.STAGES[S.stageIdx]?.name}`);
    saveState(S);
    UI.render(S);
  }

  // ── Save harvest snapshot to Firestore (NFT placeholder) ──
  async function saveHarvestSnapshot(state, bonus, rarity) {
    if (typeof firebase === 'undefined') return;
    const user = firebase.auth().currentUser;
    if (!user) {
      console.warn('No user logged in, harvest not saved to cloud');
      return;
    }

    const db = firebase.firestore();

    // Get next token ID by counting existing harvests
    const harvestsRef = db.collection('users').doc(user.uid).collection('harvests');
    const snapshot = await harvestsRef.get();
    const tokenId = snapshot.size + 1;

    const harvestDoc = {
      tokenId:       tokenId,
      ownerUid:      user.uid,
      ownerName:     user.displayName || user.email.split('@')[0],
      harvestedAt:   firebase.firestore.FieldValue.serverTimestamp(),
      // Plant metadata (NFT attributes placeholder)
      stageIdx:      7,                    // always full bloom at harvest
      health:        Math.round(state.health),
      perfectDays:   state.perfectDays,
      maxStreak:     state.maxStreak,
      coinsEarned:   state.coinsEarned,
      harvestBonus:  bonus,
      // Rarity
      rarityLabel:   rarity.label,
      rarityColor:   rarity.color,
      rarityPct:     rarity.pct,
      // Visibility (default private)
      isPublic:      false,
      // Mint status (for future Sepolia integration)
      minted:        false,
      mintTxHash:    null,
      mintedAt:      null,
      // Cycle history
      dayHistory:    state.dayHistory || [],
      cycleStartTime: state.cycleStartTime
    };

    await harvestsRef.add(harvestDoc);
    console.log(`✅ Harvest #${tokenId} saved to collection`);
  }


  // ── New cycle ──────────────────────────────
  function newCycle() {
    UI.hideHarvest();
    // Reset daily counters but keep wallet
    const coins  = S.coins;
    const seeds  = S.seeds;
    const water  = S.water;
    const fert   = S.fert;
    const total  = S.totalCyclesCompleted;
    S = freshState();
    S.coins = coins; S.seeds = seeds;
    S.water = water; S.fert  = fert;
    S.totalCyclesCompleted = total;
    saveState(S);
    Clock.setState(S);
    UI.clearLog();
    UI.log(S, '🔄 Nuevo ciclo listo. ¡Planta una semilla!', 'good');
    UI.render(S);
  }

  // ── Reset ─────────────────────────────────
  function confirmReset() {
    if (confirm('¿Reiniciar todo? Perderás semilla, suministros y WOLI del ciclo actual.\n\nTu balance de WOLI se mantiene.')) {
      const coins = S.coins;
      const total = S.totalCyclesCompleted;
      S = freshState();
      S.coins = coins;
      S.totalCyclesCompleted = total;
      saveState(S);
      Clock.setState(S);
      UI.clearLog();
      UI.log(S, '🔄 Reiniciado. Balance WOLI preservado.', '');
      UI.render(S);
    }
  }

  return { init, plant, water, fertilize, buy, onDayChange, newCycle, confirmReset };
})();
