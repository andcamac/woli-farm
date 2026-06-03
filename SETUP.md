# 🚀 Woli Farm — Setup Completo

## 📁 Estructura del proyecto

```
woli-farm/
├── index.html              ← Juego principal (con auth guard + botón colección)
├── auth.html               ← Login Google + email + anti-bots
├── collection.html         ← NUEVO: Mi colección de cosechas (NFT placeholder)
├── vercel.json             ← {"version":2}
├── firestore.rules         ← Reglas de seguridad server-side
├── README.md
├── SETUP.md                ← Este archivo
├── WoliFarm_PreWhitePaper.pdf
├── whitepaper/
│   ├── WoliFarm_WhitePaper_ES.pdf
│   └── WoliFarm_WhitePaper_EN.pdf
├── css/
│   ├── animations.css
│   ├── base.css
│   ├── scene.css
│   ├── shop.css
│   └── ui.css
└── js/
    ├── clock.js
    ├── config.js
    ├── economy.js
    ├── farm.js             ← Modificado: guarda harvest snapshots
    ├── firebase-config.js  ← Tus credenciales reales
    ├── main.js             ← Modificado: cloud-first async load
    ├── notifications.js
    ├── plant.js
    ├── scene.js
    ├── shop.js
    ├── sky.js
    ├── state.js            ← Modificado: cloud save debounceado
    └── ui.js

## 🌸 Sobre la colección (NFT placeholder)

Cada cosecha del día 7 genera automáticamente un documento en `users/{uid}/harvests/{harvestId}` con:

- **Token ID** secuencial (`#0001`, `#0002`, ...)
- **Atributos visuales:** salud final, racha máxima, días perfectos, WOLI ganados
- **Rareza** calculada según desempeño:
  - 💎 Legendaria (90%+ del score máximo)
  - 🔮 Épica (75-89%)
  - 💙 Rara (55-74%)
  - 🟢 Común (30-54%)
  - ⚪ Básica (<30%)
- **Visibilidad:** privada por defecto, podés hacerla pública con el toggle 🔒/🌍
- **Estado de mint:** `minted: false` — listo para Sepolia en próxima sesión

