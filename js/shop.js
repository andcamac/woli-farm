/* ═══════════════════════════════════════════
   SHOP — Modal Rendering
   Woli Farm · Web3 Demo
═══════════════════════════════════════════ */
'use strict';

const Shop = (() => {

  function render(state) {
    const grid = document.getElementById('shop-grid');
    const bal  = document.getElementById('shop-balance');
    bal.textContent = state.coins;

    const items = Econ.shopItems();
    grid.innerHTML = items.map(item => {
      const canAfford = state.coins >= item.price;
      return `
      <div class="shop-item ${canAfford ? '' : 'shop-item-disabled'}">
        ${item.badge ? `<div class="shop-badge">${item.badge}</div>` : ''}
        <div class="shop-item-name">${item.name}</div>
        <div class="shop-item-desc">${item.desc}</div>
        <div class="shop-item-footer">
          <span class="shop-price">🪙 ${item.price}</span>
          <button class="shop-buy-btn" onclick="Farm.buy('${item.key}')"
            ${canAfford ? '' : 'disabled'}>Comprar</button>
        </div>
      </div>`;
    }).join('');

    renderEconSummary(state);
  }

  function renderEconSummary(state) {
    const el = document.getElementById('econ-summary');
    const s  = Econ.summary(state);
    const daysLeft = CFG.CYCLE_DAYS - (state.dayHistory.length || 0);

    // Estimate remaining supply cost
    const waterLeft = Math.max(0, daysLeft) * CFG.WATERS_PER_DAY * CFG.PRICE_WATER;
    const fertLeft  = Math.max(0, daysLeft) * CFG.FERTS_PER_DAY  * CFG.PRICE_FERT;
    const supplyCost = waterLeft + fertLeft;

    // Project earnings if current pace continues
    const avgPerDay  = s.days > 0 ? s.earned / s.days : 0;
    const projected  = s.earned + Math.round(avgPerDay * daysLeft);

    el.innerHTML = `
      <div class="econ-grid">
        <div class="econ-item">
          <div class="econ-val positive">+${s.earned}</div>
          <div class="econ-lbl">WOLI ganados</div>
        </div>
        <div class="econ-item">
          <div class="econ-val negative">-${s.spent}</div>
          <div class="econ-lbl">WOLI gastados</div>
        </div>
        <div class="econ-item">
          <div class="econ-val ${s.net >= 0 ? 'positive' : 'negative'}">${s.net >= 0 ? '+' : ''}${s.net}</div>
          <div class="econ-lbl">Ganancia neta</div>
        </div>
        <div class="econ-item">
          <div class="econ-val">${s.perfect}/${s.days}</div>
          <div class="econ-lbl">Días perfectos</div>
        </div>
        <div class="econ-item">
          <div class="econ-val warning">~${supplyCost}</div>
          <div class="econ-lbl">Costo estimado resto</div>
        </div>
        <div class="econ-item">
          <div class="econ-val positive">~${projected}</div>
          <div class="econ-lbl">Proyección final</div>
        </div>
      </div>
      <div class="econ-note">
        💡 Ciclo perfecto: gana ~700 WOLI, cuesta ~${CFG.PRICE_WATER*CFG.WATERS_PER_DAY*7 + CFG.PRICE_FERT*7} WOLI en suministros. 
        Ganancia neta máxima: ~${700 - (CFG.PRICE_WATER*CFG.WATERS_PER_DAY*7 + CFG.PRICE_FERT*7)} WOLI por ciclo.
      </div>`;
  }

  return { render };
})();
