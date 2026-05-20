# 🌀 Nexus QR

A high-fidelity, real-time QR code companion with responsive, real-time generation and live web-camera scanning. Styled with a premium neon-cyberpunk glassmorphism theme, built for buttery-smooth performance across desktop and mobile structures.

---

## 🚀 Key Features

### 🎨 1. Multi-Format QR Generator
- **Supported Payload Specifications**:
  - 🔗 **URL**: Ideal for links, landing pages, and web-hooks (with auto-download protection).
  - 📶 **WIFI**: Generates optimized configuration layouts with fields for Network SSID, Password, and cryptographic Encryption types (`WPA/WPA2`, `WEP`, `No Encryption`).
  - 📇 **Contact**: Standardizes complex business cards inside compliant `vCard` structural bodies (Name, Phone, Email, and Company details).
  - 📝 **Plain Text**: Raw input for cryptographic codes, quick memos, or serial strings.
- **Dynamic Configuration & Tuning**:
  - Interactive Size slider for pixel configuration adjustments on the fly.
  - Dedicated real-time Foreground and Background Hex contrast color selectors.
  - Quick-download link exporter to save raw high-quality PNGs directly onto local filesystems.

### 📷 2. Real-Time Camera Scanner ("Optical Ingestion")
- **Fluid Ingestion Viewfinder**: Uses web-stream configurations via `navigator.mediaDevices` bound cleanly to `jsQR` loops.
- **Accurate Display Realism**: Utilizes a fully colored camera feed (no artificial grayscale filter) with proper, natural-facing aspect ratios.
- **Aspect-Square Formatting**: viewports are formatted as a perfectly responsive square layout (standardized up to `600px` size limits) explicitly designed to scan flawlessly on small mobile viewports.
- **Interactive Restart Logic**: Integrates an innovative, high-fidelity **Initialize Next Cycle** HUD button immediately inside or above the camera, showing up dynamically right after scan payloads are decoded.
- **Sensory Confetti Emission**: Celebrates every valid visual recognition with lightweight canvas confetti splashes.
- **Safeguarded Callbacks**: Bulletproof error-handling intercepts permission blocks, busy devices, or aborted video loops.

### 🕒 3. Ingested Session History Registry
- **Local Persistence Integration**: Preserves scanned lists safely in offline storage (`localStorage`) so past metadata is kept across page reloads.
- **Configurable Caching Limits**: Supports customized depth constraints (such as capping index logs to `20` records max inside components) to ensure clean disk boundaries.
- **Registry Management Options**: Quick-copy utilities, hyperlinked URL routing indexes, individual trace-deletion triggers, and a nuclear global purge option.

---

## 🛠️ Application Stack

- **Core Module Framework**: [React 19](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Engine & Compilation Server**: [Vite 6](https://vite.dev/) powered with [TSX](https://github.com/privatenumber/tsx) and [esbuild](https://esbuild.github.io/)
- **Layout Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with adaptive glass effect styles
- **Orchestrated Animations**: [Motion (React/Framer-Motion)](https://motion.dev/) for tap states, exit transitions, and tab movements.
- **QR Operations Engine**: `qrcode` (Generation matrix) & `jsQR` (Visual ingestion decoder)
- **Haptic Animations & Icons**: `canvas-confetti` and `lucide-react`

---

## 📂 Project Tree

```
.
├── server.ts              # Express server layer with Vite Middleware routing (for port 3000 mapping)
├── package.json           # Component configuration and framework package dependencies
├── metadata.json          # AI Studio Application details and camera access flags
├── src/
│   ├── App.tsx            # Root application layout and main Tab controls
│   ├── main.tsx           # Production-ready entry rendering point
│   ├── index.css          # Customized Tailwind CSS directives and custom scrollbars
│   ├── lib/
│   │   └── utils.ts       # Utility modules for dynamic styling maps (clsx, tailwind-merge)
│   └── components/
│       ├── QRGenerator.tsx # Configurable multi-type payload generator UI
│       └── QRScanner.tsx   # Live camera video canvas and logged history list
```

---

## 📡 Get Started

### Fast Local Execution
To boot up the application for development or production preview, follow these simple steps:

```bash
# 1. Install workspace dependencies
npm install

# 2. Run the development workspace (Runs at Port 3000 via server.ts router)
npm run dev

# 3. Compile optimized production bundles
npm run build

# 4. Spin up the CJS bundled web server inside the virtual wrapper
npm run start
```

---

## 💡 Operational Instructions

### A. Constructing QR Codes
1. Select the **Generate QR** navigation controller at the header.
2. Under **Content Type**, tap on your desired format (`URL`, `WIFI`, `CONTACT`, or `TEXT`). On tiny mobile displays, scroll the selection row left-to-right to access hidden buttons smoothly.
3. Populate the configuration inputs.
4. Modify the background or foreground matrix colors using the custom pickers.
5. Tap the custom-glowing **Download QR** action button.

### B. Ingesting & Managing QR Scans
1. Select the **Scan QR** controller tab.
2. Authorize web-camera requests inside the web popup.
3. Bring any QR code inside the central optical viewport.
4. Once scanned, copy the text to your clipboard or open it immediately in a new security tab if the payload is a URL.
5. Tap **Initialize Next Cycle** inside the camera viewer HUD to resume scanning additional codes.
6. Browse, copy, or purge logs using the **Ingestion History** controls located beneath the viewer.
