# GastosPro — Tu control financiero personal

App web responsive para registrar y analizar gastos personales, sincronizada con Google Sheets como base de datos gratuita.

---

## 🚀 Deploy en Vercel (5 minutos)

1. Sube esta carpeta a un repositorio en GitHub
2. Ve a [vercel.com](https://vercel.com) → New Project → importa el repo
3. Clic en **Deploy** — listo, tienes tu URL

---

## 🔗 Conectar Google Sheets

### Paso 1 — Crea la hoja
1. Ve a [sheets.google.com](https://sheets.google.com) y crea una nueva hoja
2. Copia el ID de la URL: `https://docs.google.com/spreadsheets/d/**ESTE_ES_EL_ID**/edit`

### Paso 2 — Configura el script
1. Ve a [script.google.com](https://script.google.com) → Nuevo proyecto
2. Borra el código existente y pega el contenido de `google-script.js`
3. En la línea 8, reemplaza `TU_SHEET_ID` con el ID copiado en el paso anterior
4. Guarda el proyecto (Ctrl+S)

### Paso 3 — Implementa como API
1. Clic en **Implementar** → **Nueva implementación**
2. Clic en el engranaje ⚙️ → **Aplicación web**
3. Configura:
   - Descripción: `GastosPro API`
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
4. Clic en **Implementar**
5. Copia la URL que termina en `/exec`

### Paso 4 — Conecta la app
1. Abre tu app en Vercel
2. En el formulario "Nuevo gasto", clic en **Configurar →**
3. Pega la URL del script
4. Ajusta tu presupuesto mensual
5. Clic en **Guardar y conectar**

---

## 📁 Estructura del proyecto

```
misgastos/
├── index.html        → Estructura HTML
├── style.css         → Estilos responsive
├── app.js            → Lógica de la app + sync
├── google-script.js  → Código para Google Apps Script
└── README.md         → Este archivo
```

---

## ✅ Funcionalidades

- **Dashboard** con KPIs, gráficos y desglose por categoría
- **Formulario** optimizado para móvil con categorías visuales
- **Historial** con búsqueda y filtros por categoría
- **Sincronización** bidireccional con Google Sheets
- **Offline-first**: guarda localmente aunque no haya conexión
- **100% gratuito**: Vercel Hobby + Google Sheets + Apps Script

---

## 💡 Categorías incluidas

🍔 Alimentación · 🚗 Transporte · 🏠 Vivienda · 💊 Salud · 📚 Educación
🎬 Entretenimiento · 👕 Ropa · 💡 Servicios · 🏦 Ahorro · 📦 Otros
