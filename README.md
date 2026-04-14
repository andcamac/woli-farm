# 🌿 Woli Farm — Play-to-Earn Cannabis Grow Game (Web3 Demo)

> Cultiva cáñamo en 7 días reales. Riega, fertiliza, y gana WOLI tokens.
> Demo para Woli CBD S.A. · wolicbd.com · Costa Rica

---

## 🎮 Gameplay Loop

1. **Compra suministros** en la tienda (agua, fertilizante, semilla)
2. **Planta tu semilla** para iniciar el ciclo de 7 días reales
3. **Espera notificaciones** — 3 riegos y 1 fertilización por día, a horas aleatorias
4. **Actúa a tiempo** (dentro de 90 minutos) → 100 WOLI + bonus de racha
5. **Actúa tarde** (90–180 minutos) → 0–10 WOLI ese día
6. **Día 7** → ¡Cosecha automática! Recibes NFT (rareza según desempeño)

---

## 💰 Economía de Tokens (WOLI)

| Evento | WOLI |
|--------|------|
| Día perfecto (todas las tareas a tiempo) | +100 |
| Bonus de racha (por día de racha × 20, max 100) | +0–100 |
| Día tardío (tareas hechas fuera de ventana) | +0–10 |
| Cosecha base | +200 |
| Cosecha × % de salud final | +0–100 |
| Cosecha × días perfectos (50/día) | +0–350 |
| **Ciclo perfecto máximo** | **~700–950** |

| Ítem | Costo |
|------|-------|
| Agua × 1 | 10 WOLI |
| Agua × 3 (pack) | 25 WOLI |
| Fertilizante × 1 | 15 WOLI |
| Fertilizante × 2 (pack) | 25 WOLI |
| Semilla | 30 WOLI |
| Kit iniciador (semilla + 3 agua + 2 fert) | 60 WOLI |

**Costo total por ciclo completo:** ~280 WOLI en suministros  
**Ganancia neta — ciclo perfecto:** ~420–670 WOLI  
**Ganancia neta — ciclo casual:** ~150–250 WOLI

---

## 🗂 Estructura del Proyecto

```
woli-farm/
├── index.html
├── README.md
├── css/
│   ├── base.css         Variables, reset, header, wallet
│   ├── scene.css        Cielo, suelo, maceta, planta, gotas
│   ├── ui.css           Clock, status, botones, log, notificaciones
│   ├── shop.css         Tienda modal, cosecha modal
│   └── animations.css   Todos los @keyframes
└── js/
    ├── config.js        Constantes del juego y economía
    ├── state.js         Estado del juego y localStorage
    ├── clock.js         Reloj real, turnos de día, scheduling de tareas
    ├── plant.js         SVG ilustraciones por etapa
    ├── sky.js           Ciclo día/noche basado en hora real
    ├── scene.js         Pasto, gotas, partículas
    ├── economy.js       Scoring, shop, rareza NFT
    ├── shop.js          Render de la tienda
    ├── notifications.js Sistema de alertas in-app + Push API
    ├── ui.js            Render completo, toast, log, modales
    ├── farm.js          Lógica central: plantar, regar, fertilizar
    └── main.js          Entry point, boot
```

---

## 🔗 Web3 Roadmap (Futuro)

- **WOLI Token:** ERC-20 / BEP-20. Supply máx 10M. 40% play-to-earn.
- **NFT Harvest:** ERC-721 — cada cosecha mint un NFT con rareza según desempeño.
  - ⚪ Básica, 🟢 Común, 💙 Rara, 🔮 Épica, 💎 Legendaria
- **Conversión:** Los puntos WOLI del demo serán convertibles 1:1 a tokens.
- **Staking:** Holders de NFTs raros reciben multiplicadores de yield.

---

## 🚀 Para Correr

Abrí `index.html` en cualquier navegador moderno. No necesita servidor.

Para resetear: `localStorage.removeItem('woli_farm_v1'); location.reload()`
