import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import { Camera, RefreshCw, Copy, ExternalLink, AlertCircle, Maximize2, Clock, Trash2, History, Zap, ZapOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import confetti from 'canvas-confetti';

interface HistoryItem {
  id: string;
  data: string;
  timestamp: number;
}

interface QRScannerProps {
  maxHistory?: number;
}

export default function QRScanner({ maxHistory = 50 }: QRScannerProps) {
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  
  // Clean initialization of history with immediate fallback to avoid overwriting localStorage with [] on mount
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const savedHistory = localStorage.getItem('qr_scan_history');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (e) {
      console.error('Failed to parse history from localStorage', e);
      return [];
    }
  });

  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const activeStreamRef = useRef<MediaStream | null>(null);

  // Synchronize history with localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('qr_scan_history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to sync history to localStorage', e);
    }
  }, [history]);

  const startCamera = async () => {
    try {
      setError(null);
      
      // Prevent stream double-initialization
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => track.stop());
        activeStreamRef.current = null;
      }

      // Check secure context and mediaDevices API capability
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera access is not supported or requires a secure (HTTPS) connection context.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      activeStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playError: any) {
          if (playError.name !== 'AbortError') {
            console.error('Video play error:', playError);
          }
        }
        setScanning(true);
        setResult(null);

        // Check for flashlight/torch capability safely on the video track
        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities = typeof track.getCapabilities === 'function' ? track.getCapabilities() : null;
          setHasTorch(!!(capabilities && 'torch' in capabilities));
        }
        setTorchOn(false);
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera access denied. Please enable camera permissions in your browser settings to use the scanner.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera detected on this device.');
      } else {
        setError('An unexpected error occurred while accessing the camera.');
      }
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    if (activeStreamRef.current) {
      const track = activeStreamRef.current.getVideoTracks()[0];
      if (track) {
        const newTorchState = !torchOn;
        try {
          await track.applyConstraints({
            advanced: [{ torch: newTorchState } as any]
          });
          setTorchOn(newTorchState);
        } catch (e) {
          console.warn('Failed to apply torch constraints:', e);
        }
      }
    }
  };

  const scan = () => {
    if (videoRef.current && canvasRef.current && scanning) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d', { willReadFrequently: true });

      if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          onSuccess(code.data);
          return;
        }
      }
      requestRef.current = requestAnimationFrame(scan);
    }
  };

  const onSuccess = (data: string) => {
    setScanning(false);
    setResult(data);
    setFlash(true);

    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

    const newItem: HistoryItem = {
      id: id,
      data: data,
      timestamp: Date.now()
    };
    setHistory(prev => [newItem, ...prev].slice(0, maxHistory)); // Keep history within limit

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#10b981', '#ffffff']
    });
    setTimeout(() => setFlash(false), 200);
    stopCamera();
  };

  const reset = () => {
    setResult(null);
    setError(null);
    startCamera();
  };

  const clearHistory = () => {
    if (confirm('Clear all scan history?')) {
      setHistory([]);
    }
  };

  const removeFromHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (scanning) {
      requestRef.current = requestAnimationFrame(scan);
    }
  }, [scanning]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  const formatTime = (ts: number) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(ts);
  };

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto w-full flex-1 gap-8 md:gap-12">
      <div className="relative w-full aspect-square md:max-w-[600px] glass rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]">
        
        {/* Flash Effect */}
        <AnimatePresence>
          {flash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white z-50 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Viewfinder Overlay */}
        {scanning && !error && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            {/* Corner Markers */}
            <div className="absolute top-12 left-12 w-16 h-16 border-t-[3px] border-l-[3px] border-cyan-400 rounded-tl-3xl opacity-60" />
            <div className="absolute top-12 right-12 w-16 h-16 border-t-[3px] border-r-[3px] border-cyan-400 rounded-tr-3xl opacity-60" />
            <div className="absolute bottom-12 left-12 w-16 h-16 border-b-[3px] border-l-[3px] border-cyan-400 rounded-bl-3xl opacity-60" />
            <div className="absolute bottom-12 right-12 w-16 h-16 border-b-[3px] border-r-[3px] border-cyan-400 rounded-br-3xl opacity-60" />
            
            {/* Scanning Line */}
            <div className="scanner-line z-20 animate-scan" style={{ top: '20%' }} />
            
            {/* Status Indicator */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-slate-900/60 backdrop-blur-xl rounded-full border border-white/10 z-30">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-cyan-400">Scanner Live</span>
            </div>

            {/* Flashlight/Torch Toggle Button */}
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={cn(
                  "absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full border transition-all active:scale-95 pointer-events-auto z-35 shadow-[0_4px_20px_rgba(0,0,0,0.4)]",
                  torchOn ? "border-amber-400 text-amber-400 bg-amber-400/5 shadow-[0_0_15px_rgba(251,191,36,0.25)]" : "border-white/10 hover:border-white/30"
                )}
                title="Toggle Flashlight"
              >
                {torchOn ? <Zap className="w-4 h-4 fill-amber-400" /> : <ZapOff className="w-4 h-4 animate-pulse" />}
                <span className="text-[9px] uppercase font-bold tracking-widest">
                  {torchOn ? "Flash ON" : "Flash OFF"}
                </span>
              </button>
            )}

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 glass px-6 py-2 rounded-2xl border-white/5">
              <p className="text-[10px] uppercase tracking-[0.3em] font-mono text-slate-500">Aligning Neural Matrix...</p>
            </div>
          </div>
        )}

        {/* Scan Again Button after result */}
        {!scanning && result && (
          <button 
            onClick={reset}
            className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-slate-900/80 hover:bg-cyan-400 text-cyan-400 hover:text-slate-950 backdrop-blur-xl rounded-full border border-cyan-400/20 hover:border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.1)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all active:scale-95 group pointer-events-auto z-40"
          >
            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-[10px] uppercase font-black tracking-[0.25em]">
              Initialize Next Cycle
            </span>
          </button>
        )}

        {/* Video & Canvas */}
        <video
          ref={videoRef}
          className={cn(
            "w-full h-full object-cover opacity-90 transition-transform duration-300",
            !scanning && "opacity-20 blur-xl scale-110"
          )}
          playsInline
          muted
          autoPlay
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Success State Overlay */}
        {!scanning && result && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 z-30"
          >
            <div className="glass p-6 sm:p-10 rounded-[2.5rem] border-cyan-400/30 flex flex-col items-center w-full max-w-lg shadow-[0_0_80px_rgba(0,0,0,0.6)]">
              <div className="p-4 bg-emerald-500/20 rounded-full mb-6 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Maximize2 className="w-8 h-8 text-emerald-400" />
              </div>
              
              <h3 className="text-sm font-bold text-cyan-400 mb-6 uppercase tracking-[0.4em]">Payload Extracted</h3>
              
              <div className="w-full bg-slate-950/80 p-6 rounded-2xl border border-white/5 mb-8 font-mono text-sm break-all text-slate-300 text-center max-h-48 overflow-y-auto leading-relaxed">
                {result}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <button
                  onClick={() => handleCopy(result)}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all font-bold text-[10px] uppercase tracking-widest text-slate-300 border border-white/10"
                >
                  <Copy className="w-4 h-4" />
                  Copy Data
                </button>
                {isUrl(result) && (
                  <a
                    href={result}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-4 glow-button"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Portal
                  </a>
                )}
              </div>
              <button
                onClick={reset}
                className="mt-8 text-slate-500 hover:text-cyan-400 text-[10px] flex items-center gap-2 transition-all uppercase tracking-[0.3em] font-black"
              >
                <RefreshCw className="w-3 h-3" />
                Initialize Next Cycle
              </button>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-40 bg-slate-950/90 backdrop-blur-3xl">
            <AlertCircle className="w-16 h-16 text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
            <p className="text-white text-xl font-bold text-center mb-8 uppercase tracking-widest leading-tight">{error}</p>
            <button
              onClick={startCamera}
              className="glow-button px-12"
            >
              Force Re-Authorization
            </button>
          </div>
        )}
      </div>

      {/* History Section */}
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-cyan-500/10 rounded-lg">
                <History className="w-5 h-5 text-cyan-400" />
             </div>
             <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Ingestion History</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Local Storage Persistence Active</p>
             </div>
          </div>
          {history.length > 0 && (
            <button 
              onClick={clearHistory}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-red-500/20 transition-all flex items-center gap-2"
            >
              <Trash2 className="w-3 h-3" />
              Purge All
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="glass p-12 rounded-[2rem] flex flex-col items-center justify-center text-center border-dashed">
            <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
               <Clock className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-sm text-slate-500 uppercase tracking-widest font-medium">Archive Empty</p>
            <p className="text-[10px] text-slate-600 mt-1">Scan a document to begin indexing data</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence initial={false}>
              {history.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="glass p-4 rounded-2xl border border-white/5 flex flex-col gap-3 group hover:border-cyan-400/30 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded uppercase">
                      {formatTime(item.timestamp)}
                    </span>
                    <button 
                      onClick={() => removeFromHistory(item.id)}
                      className="p-1 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs font-mono text-slate-300 break-all line-clamp-2 min-h-[2rem]">
                    {item.data}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => handleCopy(item.data)}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[9px] font-bold uppercase tracking-widest rounded-lg border border-white/5 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                    {isUrl(item.data) && (
                      <a
                        href={item.data}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 text-[9px] font-bold uppercase tracking-widest rounded-lg border border-cyan-400/10 transition-all flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-x-8 gap-y-4 text-[9px] font-mono text-slate-600 uppercase tracking-widest">
        <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_6px_#22d3ee]" />
          Optics: Verified
        </div>
        <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
          Neural Integrity: 99.8%
        </div>
        <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_6px_#22d3ee]" />
          Latency: Sub-ms
        </div>
      </div>
    </div>
  );
}

