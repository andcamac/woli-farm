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
```

---

## 1. Subir todo a GitHub

Descomprimí el ZIP, entrá a tu repo `woli-farm` y subí TODOS los archivos manteniendo la estructura de carpetas.

## 2. Configurar Firebase Authentication

Si no lo hiciste todavía:

1. [Firebase Console](https://console.firebase.google.com) → proyecto **wolifarm**
2. **Authentication → Sign-in method**
3. Activá:
   - **Email/Password** (toggle del primero, NO el de Email link)
   - **Google** (elegí tu correo como project support email)
4. Pestaña **Settings → Authorized domains**
5. Agregá: `project-1lw3i.vercel.app` y `localhost`

## 3. Configurar Firestore

1. **Firestore Database** → si no existe, **Create database** → región `us-central1` → modo Production
2. Pestaña **Rules** → reemplazá con el contenido del archivo `firestore.rules` (también pegado abajo):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create, update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false;

      match /harvests/{harvestId} {
        allow read: if request.auth != null && (
          request.auth.uid == userId ||
          resource.data.isPublic == true
        );
        allow create, update: if request.auth != null && request.auth.uid == userId;
        allow delete: if false;
      }
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Clic **Publish**

## 4. Crear índice para colección pública (opcional)

Para que "🌍 Explorar Pública" funcione, Firebase necesita un índice compuesto.

**La forma más fácil:**
1. Hacé login al juego, ganá una cosecha
2. Andá a `collection.html` → clic en "🌍 Explorar Pública"
3. Si Firebase necesita el índice, la consola del navegador (F12) mostrará un error con un **link directo** a Firebase
4. Clickealo → clic **Create Index**
5. Esperá 1-2 minutos a que se construya
6. Recargá la página y funciona

## 5. Verificar

Abrí `https://project-1lw3i.vercel.app/`:

- ✅ Te redirige a `auth.html`
- ✅ Podés crear cuenta con Google o email
- ✅ Después del login, ves el juego
- ✅ El progreso se guarda en Firestore (no solo local) — probá borrar localStorage y recargar, debe traer tu progreso
- ✅ Al ganar tu primera cosecha (día 7), aparece en `collection.html`
- ✅ Podés alternar entre cosechas privadas y exploración pública
- ✅ Podés filtrar por rareza (Básica/Común/Rara/Épica/Legendaria)
- ✅ Podés ordenar por fecha, rareza o token ID
- ✅ Podés alternar visibilidad pública/privada de cada cosecha

---

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

El botón "🔗 Mint as NFT" en cada card está deshabilitado intencionalmente — se activa cuando integremos el smart contract ERC-721 en Sepolia testnet (próxima sesión).

---

## 💾 Cloud save funcionando

Cada acción del juego (regar, fertilizar, comprar, plantar) ahora guarda en:
1. **localStorage** instantáneo (offline + rápido)
2. **Firestore** en `users/{uid}.gameState` debounceado a 1.5s

Esto significa:
- ✅ Tu progreso se mantiene entre dispositivos
- ✅ No se pierde si limpiás caché
- ✅ Si entrás desde otro navegador, ves el mismo progreso
- ✅ Resistente a trampas (las reglas server-side validan)

---

## ❓ Errores comunes

| Error | Solución |
|---|---|
| `auth/configuration-not-found` | Agregar dominio en Authorized domains |
| `auth/operation-not-allowed` | Activar Email/Password en Sign-in method |
| `Missing or insufficient permissions` | Publicar las reglas de Firestore |
| `The query requires an index` | Crear el índice del paso 4 |
| `client is offline` | Firestore Database no creada todavía |

Si ves otro error, abrí F12 → Console y mandalo.
