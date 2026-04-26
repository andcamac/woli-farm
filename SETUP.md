# 🚀 Woli Farm — Setup en 4 Pasos

## 1. Subir archivos a GitHub

Subí TODO el contenido de este zip al repositorio. La estructura debe quedar:

```
woli-farm/
├── index.html          ← actualizado con Firebase Auth Guard
├── auth.html           ← NUEVO: página de login
├── vercel.json         ← versión simplificada
├── README.md
├── SETUP.md            ← este archivo
├── css/                ← sin cambios respecto al original
│   ├── animations.css
│   ├── base.css
│   ├── scene.css
│   ├── shop.css
│   └── ui.css
├── js/                 ← + 1 archivo nuevo
│   ├── clock.js
│   ├── config.js
│   ├── economy.js
│   ├── farm.js
│   ├── firebase-config.js  ← NUEVO
│   ├── main.js
│   ├── notifications.js
│   ├── plant.js
│   ├── scene.js
│   ├── shop.js
│   ├── sky.js
│   ├── state.js
│   └── ui.js
├── whitepaper/         ← NUEVO
│   ├── WoliFarm_WhitePaper_ES.pdf
│   └── WoliFarm_WhitePaper_EN.pdf
└── WoliFarm_PreWhitePaper.pdf
```

## 2. Configurar Firebase Authentication

**Paso crítico — sin esto da el error `auth/configuration-not-found`:**

1. Andá a [console.firebase.google.com](https://console.firebase.google.com) → proyecto **wolifarm**
2. Menú izquierdo → **Authentication**
3. Si ves "Comenzar", clickealo → activá **Correo electrónico/Contraseña** y **Google**
4. Pestaña **Settings** → sección **Authorized domains**
5. Clic **Add domain** → escribir: `project-1lw3i.vercel.app`
6. Clic **Add** otra vez → escribir: `localhost`
7. Listo

## 3. Configurar Firestore (cloud save)

1. Menú izquierdo → **Firestore Database**
2. Si no existe, **Create database** → región `us-central1` → modo **Production**
3. Pestaña **Rules** → reemplazar con:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId
        && (resource == null || request.resource.data.coins is number)
        && (request.resource.data.coins == null
            || (request.resource.data.coins >= -500
                && request.resource.data.coins <= 10000));
    }
  }
}
```

4. **Publish** (Publicar)

## 4. Verificar

Abrí `https://project-1lw3i.vercel.app/`. Debería:
- Redirigirte a `auth.html` automáticamente
- Permitirte crear cuenta o login con Google
- Llevarte al juego después de login exitoso

Si algo no funciona, abrí la consola del navegador (F12) y mandame el error.
