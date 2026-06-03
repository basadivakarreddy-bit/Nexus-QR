# 🌀 Nexus QR

A high-fidelity, real-time QR code companion with responsive, real-time generation and live web-camera scanning. Styled with a premium neon-cyberpunk glassmorphism theme, built for buttery-smooth performance across desktop and mobile devices.

---

## 🚀 Key Features

### 🎨 1. Multi-Format QR Generator (Sequential Hierarchy)
The content navigation is structured in a clean, hand-picked order for maximum utility:
1. 🔗 **URL**: Ideal for links, landing pages, and web-hooks (with auto-download protection).
2. 📝 **TEXT**: Raw input for cryptographic codes, quick memos, or serial strings.
3. 🖼️ **MEDIA (Image QR)**: Compresses image payloads dynamically through an intelligent scale-down optimization loop ensuring it stays safely under standard QR code limits, then bundles it directly inside the QR matrix!
4. 📶 **WIFI**: Generates optimized configuration layouts with fields for Network SSID, Password, and cryptographic Encryption types (`WPA/WPA2`, `WEP`, `No Encryption`).
5. 📇 **CONTACT**: Standardizes complex business cards inside compliant `vCard` structural bodies (Name, Phone, Email, and Company details).

### 🛠️ 2. Advanced QR Stylization Controls
Customize the aesthetic appearance of your QR codes with the newly added styling dock below the preview:
- **Classic QR**: Standard sharp modular grid representing classical high-contrast pixel structures.
- **Logo QR (Dotted Art Layout)**: Generates a gorgeous, highly sought-after graphic design layout (as featured in print media):
  - **Dotted Matrix**: Data modules are rendered as smooth, styled rounded dots with a balanced `0.85` spacing ratio to maximize scanning accuracy.
  - **Crisp Finder Squares**: High-contrast, standard square finder patterns are preserved at the three critical corners to guarantee swift, seamless optical locks by mobile scanners.
- **Custom Color Swatches**: Real-time foreground and background HEX controllers to dial in perfect contrasts.

### 📷 3. Real-Time Camera & File Scanner ("Optical Ingestion")
- **Dual-Engine Hybrid Decoder**: Uses high-speed web-stream configurations via `navigator.mediaDevices` bound to `jsQR` for ultra-fast QR recognition, with an advanced falls-back module to help decode standard 1D/2D barcodes (Code 128, Code 39, EAN 13, etc.).
- **Enhanced Media QR Recognition**: Equipped to handle complex Base64 image codes. Decodes standard, inverted, or transparent PNGs seamlessly by pre-rendering alpha channels over solid white backgrounds.
- **Visual Decoded Image Preview**: If a scanned QR contains an embedded image payload, the scanner reveals a premium decoded media module with crisp pixelated image rendering, size specifications, and a dedicated **Save Image** downloader.
- **Micro-interactions**: Incorporates floating camera control toggles (including flash/torch for compatible devices), immediate confetti bursts upon success, and a user-friendly **Initialize Next Cycle** HUD to resume scanning effortlessly.

### 🕒 4. Ingested Session History Registry
- **Offline Persistence**: Retains previous scan lists safely inside standard client-side `localStorage`.
- **Media Thumbnails**: Visually indexes saved history entries with custom mini-thumbnails for easy categorization.
- **Management Deck**: One-tap copy-to-clipboard actions, browser URL navigation triggers, single-entry deletions, or a complete system database purge.

---

## 🛠️ Application Stack

- **Core Module Framework**: [React 18+](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Engine & Compilation Server**: [Vite 6](https://vite.dev/) powered with [TSX](https://github.com/privatenumber/tsx) and [esbuild](https://esbuild.github.io/)
- **Layout Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with adaptive glass effect styles
- **Orchestrated Animations**: [Motion (React/Framer-Motion)](https://motion.dev/) for tap states, exit transitions, and tab movements
- **QR Operations Engine**: `qrcode` (Generation matrix), `jsQR` (Inverted/standard high-speed decoder), & `@zxing/library` (Multi-format standard reader)
- **Haptic Animations & Icons**: `canvas-confetti` and `lucide-react`

---

## 📂 Project Tree

```
.
├── server.ts              # Express server layer with Vite Middleware routing
├── package.json           # Component configuration and framework package dependencies
├── metadata.json          # AI Studio Application details and camera access flags
├── src/
│   ├── App.tsx            # Root application layout and main Tab controls
│   ├── main.tsx           # Production-ready entry rendering point
│   ├── index.css          # Customized Tailwind CSS directives and custom scrollbars
│   ├── lib/
│   │   └── utils.ts       # Utility modules for dynamic styling maps (clsx, tailwind-merge)
│   └── components/
│       ├── QRGenerator.tsx # Configurable multi-type payload generator UI with styling docks
│       └── QRScanner.tsx   # Live camera video canvas, multi-format file reader, and visual history
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

# 4. Spin up the production server
npm run start
```

---

## 💡 Operational Instructions

### A. Constructing QR Codes
1. Select the **Generator** tab at the top layout header.
2. Select your desired content type from the sequential row: **URL**, **TEXT**, **MEDIA**, **WIFI**, or **CONTACT**. On small mobile displays, scroll the selection row horizontally to browse options.
3. If creating a **MEDIA QR**: Select any graphic image file. The engine will instantly compress, optimize, and encode the data.
4. Below the preview canvas, select either **Classic QR** (standard blocks) or **Logo QR** (dotted layout with square corner indicators).
5. Customize colors and tap the glowing **Download QR** button to download a high-definition 600px print-ready PNG.

### B. Ingesting & Decoding Scans
1. Select the **Scanner** tab.
2. **Video Scan**: Grant camera permissions and align any barcode or QR code in the active viewfinder. Tap the **Flash** toggle if scanning in low-light environments.
3. **File Upload Scan**: Tap the scanning area or browse to select a saved image or screenshot.
4. Active image scanning uses dual inversion attempts to decode both dark-on-light and light-on-dark colored matrices safely.
5. If the scan contains compressed image data, tap the green **Save Image** button to save the original graphic to your downloads directory.
6. Tap **Initialize Next Cycle** inside the HUD to scan another code.
