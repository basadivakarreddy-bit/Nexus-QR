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

### 📷 2. Real-Time Camera & Barcode Scanner ("Optical Ingestion")
- **Dual-Engine Hybrid Decoder**: Uses high-speed web-stream configurations via `navigator.mediaDevices` bound to `jsQR` for ultra-fast QR recognition, smoothly falling back to a throttled `@zxing/library` loop to decode 1D/2D standard barcodes (such as Code 128, Code 39, EAN 13, UPC-A, etc.).
- **Live Device Flashlight/Torch Control**: Activates on-device torch controls directly within the browser viewframe (for compatible devices) via track constraints.
- **Unified Control Toolbar**: Floating bottom overlay houses instant Flash toggle indicators and Image Scan imports.
- **Direct File Scan Ingestion**: Fully integrated image uploader lets users select or drag-and-drop saved QR code and barcode images directly from local filesystems to be processed by both decoding engines.
- **Fluid Ingestion Viewfinder**: Dynamic, auto-adjusting aspect video feed representation showcasing absolute resolution precision without grey-tinted overlay distorting color balances.
- **Interactive Restart Logic**: Integrates an innovative, high-fidelity **Initialize Next Cycle** HUD button immediately inside or above the camera, showing up dynamically right after scan payloads are decoded.
- **Sensory Confetti Emission**: Celebrates every valid visual recognition with lightweight canvas confetti splashes.
- **Safeguarded Callbacks**: Bulletproof error-handling intercepts permission blocks, busy devices, or aborted video loops with graceful fallback guidance triggering image upload scan alternates.

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
- **QR & Barcode Operations Engine**: `qrcode` (Generation matrix), `jsQR` (Fast QR decoder), & `@zxing/library` (Multi-format 1D/2D Barcode decoder)
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
│       └── QRScanner.tsx   # Live camera video canvas, multi-format file/live reader and logged history
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

### B. Ingesting & Managing QR/Barcode Scans
1. Select the **Scan QR** controller tab.
2. **Scan via Video Feed**: Authorize web-camera requests inside the web popup and align any QR code or standard barcode in the central viewfinder area.
3. **Flash Toggle**: Tap the integrated floating indicator labeled **Flash ON/OFF** to illuminate low-light physical spaces (supported on back-facing camera mobile engines).
4. **Scan from Image File**: Tap **Scan Image** or upload a file via the central upload prompt inside permission state dialogs to read codes directly from local pictures or screenshot snippets.
5. Once scanned, copy the text to your clipboard, read the detected format (e.g. *Code 128*, *EAN 13*, *QR Code*), or open it immediately in a new secure browser tab if it contains a URL.
6. Tap **Initialize Next Cycle** inside the camera viewer HUD to resume scanning additional codes.
7. Browse, inspect detected format classifications, or prune logs using the **Ingestion History** registry underneath.
