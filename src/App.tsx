import React, { useState } from 'react';
import { QrCode, Scan, Shield, Cpu, Activity, Zap } from 'lucide-react';
import QRGenerator from './components/QRGenerator';
import QRScanner from './components/QRScanner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

type Tab = 'generate' | 'scan';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('generate');

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 flex flex-col p-4 md:p-8 gap-6 md:gap-10 relative overflow-hidden selection:bg-cyan-500/30 font-sans">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />

      <header className="flex flex-col md:flex-row justify-between items-center z-10 gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)]">
            <QrCode className="text-slate-950 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase italic">
              NEXUS<span className="text-cyan-400">QR</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">Futuristic Code Engine</p>
          </div>
        </div>

        <div className="glass p-1 rounded-full flex gap-1">
          <button
            onClick={() => setActiveTab('generate')}
            className={cn(
              "px-5 md:px-8 py-2.5 md:py-2 rounded-full text-[11px] md:text-xs font-bold transition-all duration-300 uppercase tracking-widest",
              activeTab === 'generate' 
                ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30" 
                : "text-slate-400 hover:bg-white/5"
            )}
          >
            Generator
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={cn(
              "px-5 md:px-8 py-2.5 md:py-2 rounded-full text-[11px] md:text-xs font-bold transition-all duration-300 uppercase tracking-widest",
              activeTab === 'scan' 
                ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30" 
                : "text-slate-400 hover:bg-white/5"
            )}
          >
            Live Scanner
          </button>
        </div>

        <div className="text-right hidden md:block">
          <p className="text-[10px] uppercase tracking-widest opacity-40">System Status</p>
          <div className="flex items-center gap-2 justify-end">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-xs font-mono">SCANNER_READY</span>
          </div>
        </div>
      </header>

      <main className="flex-1 z-10 max-w-7xl mx-auto w-full flex flex-col">
        <AnimatePresence mode="wait">
          {activeTab === 'generate' ? (
            <motion.div
              key="generate"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-6 md:mb-10">
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400 mb-2">Matrix Deployment</h2>
                <p className="text-slate-500 text-sm max-w-xl">
                  Real-time spectral QR generation with automated parity checks and parity-optimized density.
                </p>
              </div>
              <QRGenerator />
            </motion.div>
          ) : (
            <motion.div
              key="scan"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-6 md:mb-10 text-center">
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400 mb-2">Optical Ingestion</h2>
                <p className="text-slate-500 text-sm mx-auto max-w-xl">
                  Neural-vision based capture protocol with sub-millisecond payload extraction.
                </p>
              </div>
              <QRScanner maxHistory={20} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="z-10 flex flex-col md:flex-row justify-between items-end border-t border-white/10 pt-6 md:pt-8 pb-4 gap-6">
        <div className="flex flex-wrap gap-8">
          <div className="space-y-1">
            <p className="text-[9px] uppercase tracking-widest text-slate-500">Encryption</p>
            <p className="text-xs font-mono text-slate-400">AES-256-GCM</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] uppercase tracking-widest text-slate-500">Engine</p>
            <p className="text-xs font-mono text-slate-400">V8-QUBIT-CORE</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] uppercase tracking-widest text-slate-500">Latency</p>
            <p className="text-xs font-mono text-cyan-400">0.04ms</p>
          </div>
        </div>
        <p className="text-[10px] text-slate-600 uppercase tracking-widest opacity-50">&copy; {new Date().getFullYear()} NEURAL-QR NETWORKS. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
}
