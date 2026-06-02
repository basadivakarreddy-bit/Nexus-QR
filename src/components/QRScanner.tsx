import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Camera, RefreshCw, Copy, ExternalLink, AlertCircle, Maximize2, Clock, Trash2, History, Zap, ZapOff, Image as ImageIcon, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import confetti from 'canvas-confetti';

interface HistoryItem {
  id: string;
  data: string;
  timestamp: number;
  format?: string;
}

interface QRScannerProps {
  maxHistory?: number;
}

export default function QRScanner({ maxHistory = 50 }: QRScannerProps) {
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null);
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

  const frameCountRef = useRef(0);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const isDecodingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const img = new window.Image();
      img.onload = () => {
        try {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          const ctx = tempCanvas.getContext('2d');
          if (!ctx) {
            setError('Could not process the uploaded image.');
            return;
          }
          // Set solid white background to support transparent PNG formats gracefully
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          
          // Try jsQR first for high performance, allowing both inverted and standard scans
          const code = jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: "attemptBoth"
          });
          if (code) {
            onSuccess(code.data, 'QR_CODE');
            return;
          }

          // Fallback to ZXing MultiFormat reader for Barcodes
          const zxingReader = getCodeReader();
          zxingReader.decodeFromImage(undefined, dataUrl)
            .then((res) => {
              if (res) {
                const text = res.getText();
                let formatName = 'BARCODE';
                try {
                  const format = res.getBarcodeFormat();
                  formatName = format !== undefined && format !== null ? String(format) : 'BARCODE';
                } catch (err) {}
                onSuccess(text, formatName);
              } else {
                setError('No QR code or barcode found in the image. Please try a cleaner or higher resolution image.');
              }
            })
            .catch((err) => {
              console.warn('ZXing image decoding failed:', err);
              setError('Could not decode any QR code or barcode from the uploaded image. Please ensure it is clearly visible.');
            });
        } catch (err) {
          console.error(err);
          setError('An error occurred while processing the uploaded image file.');
        }
      };
      img.onerror = () => {
        setError('Failed to load image file.');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be uploaded again
    event.target.value = '';
  };

  const getCodeReader = () => {
    if (!codeReaderRef.current) {
      codeReaderRef.current = new BrowserMultiFormatReader();
    }
    return codeReaderRef.current;
  };

  const translateFormatName = (format: string | number) => {
    const formatStr = String(format);
    const formatMap: Record<string, string> = {
      '0': 'Aztec',
      '1': 'Codabar',
      '2': 'Code 39',
      '3': 'Code 93',
      '4': 'Code 128',
      '5': 'Data Matrix',
      '6': 'EAN 8',
      '7': 'EAN 13',
      '8': 'ITF',
      '9': 'MaxiCode',
      '10': 'PDF 417',
      '11': 'QR Code',
      '12': 'RSS 14',
      '13': 'RSS Expanded',
      '14': 'UPC-A',
      '15': 'UPC-E',
      '16': 'UPC/EAN Extension',
      'AZTEC': 'Aztec',
      'CODABAR': 'Codabar',
      'CODE_39': 'Code 39',
      'CODE_93': 'Code 93',
      'CODE_128': 'Code 128',
      'DATA_MATRIX': 'Data Matrix',
      'EAN_8': 'EAN 8',
      'EAN_13': 'EAN 13',
      'ITF': 'ITF',
      'MAXICODE': 'MaxiCode',
      'PDF_417': 'PDF 417',
      'QR_CODE': 'QR Code',
      'RSS_14': 'RSS 14',
      'RSS_EXPANDED': 'RSS Expanded',
      'UPC_A': 'UPC-A',
      'UPC_E': 'UPC-E',
      'UPC_EAN_EXTENSION': 'UPC/EAN Extension'
    };
    return formatMap[formatStr.toUpperCase()] || formatStr;
  };

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
        
        // 1. Check for QR Code first via fast jsQR, optimizing for colored and inverted codes
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        if (code) {
          onSuccess(code.data, 'QR_CODE');
          return;
        }

        // 2. Fall back to Barcodes through ZXing MultiFormat reader on a throttled loop to keep CPU low
        frameCountRef.current++;
        if (frameCountRef.current % 6 === 0 && !isDecodingRef.current) {
          isDecodingRef.current = true;
          try {
            const reader = getCodeReader();
            const res = reader.decode(video);
            if (res && scanning) {
              const text = res.getText();
              let formatName = 'BARCODE';
              try {
                const format = res.getBarcodeFormat();
                formatName = format !== undefined && format !== null ? String(format) : 'BARCODE';
              } catch (err) {}
              onSuccess(text, formatName);
            }
          } catch (err) {
            // No barcode found on this frame is normal during constant scan loops
          } finally {
            isDecodingRef.current = false;
          }
        }
      }
      requestRef.current = requestAnimationFrame(scan);
    }
  };

  const onSuccess = (data: string, format: string = 'QR_CODE') => {
    setScanning(false);
    setResult(data);
    const resolvedFormat = translateFormatName(format);
    setDetectedFormat(resolvedFormat);
    setFlash(true);

    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

    const newItem: HistoryItem = {
      id: id,
      data: data,
      timestamp: Date.now(),
      format: resolvedFormat
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
    setDetectedFormat(null);
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

  const isImagePayload = (str: string) => {
    if (!str) return false;
    if (str.startsWith('data:image/')) return true;
    // Check if it starts with standard http/https and ends with standard image extensions
    if (/^https?:\/\/.*\.(png|jpg|jpeg|gif|webp|svg|bmp)(?:\?.*)?$/i.test(str)) {
      return true;
    }
    return false;
  };

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

            {/* Control Toolbar */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-auto z-35 bg-slate-900/80 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              {hasTorch && (
                <button
                  onClick={toggleTorch}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-white rounded-full border transition-all active:scale-95",
                    torchOn ? "border-amber-400/30 text-amber-400 bg-amber-400/10 shadow-[0_0_12px_rgba(251,191,36,0.15)]" : "border-transparent text-slate-300"
                  )}
                  title="Toggle Flashlight"
                >
                  {torchOn ? <Zap className="w-3.5 h-3.5 fill-amber-400" /> : <ZapOff className="w-3.5 h-3.5" />}
                  <span className="text-[9px] uppercase font-bold tracking-widest">
                    {torchOn ? "Flash ON" : "Flash OFF"}
                  </span>
                </button>
              )}

              {/* Image Scanner Trigger */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-slate-300 hover:text-cyan-400 rounded-full border border-transparent hover:border-cyan-500/25 transition-all active:scale-95"
                title="Scan QR/Barcode from file"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="text-[9px] uppercase font-bold tracking-widest">
                  Scan Image
                </span>
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

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
              
              <h3 className="text-sm font-bold text-cyan-400 mb-6 uppercase tracking-[0.4em]">
                {detectedFormat ? `${detectedFormat} Extracted` : "Payload Extracted"}
              </h3>
              
              {isImagePayload(result) ? (
                <div className="w-full flex flex-col items-center gap-4 mb-8">
                  <div className="relative group overflow-hidden rounded-2xl border border-white/15 bg-slate-950 p-2.5 max-w-[260px] shadow-[0_8px_32px_rgba(34,211,238,0.15)] flex items-center justify-center">
                    <img
                      src={result}
                      alt="Scanned media payload"
                      className="max-h-44 max-w-full object-contain rounded-xl h-auto"
                      referrerPolicy="no-referrer"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <div className="absolute top-4 right-4 bg-emerald-500 text-slate-950 text-[8px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md shadow-lg border border-emerald-400/30">
                      Decoded Image
                    </div>
                  </div>
                  <div className="w-full text-center">
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider bg-slate-950/40 px-3 py-1.5 rounded-lg border border-white/5 inline-block">
                      Media Payload • {result.length} Chars
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full bg-slate-950/80 p-6 rounded-2xl border border-white/5 mb-8 font-mono text-sm break-all text-slate-300 text-center max-h-48 overflow-y-auto leading-relaxed">
                  {result}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={() => handleCopy(result)}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all font-bold text-[10px] uppercase tracking-widest text-slate-300 border border-white/10"
                >
                  <Copy className="w-4 h-4" />
                  Copy Data
                </button>
                
                {isImagePayload(result) && (
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = result;
                      const mimeMatch = result.match(/^data:(image\/[a-zA-Z+-]+);base64,/);
                      const ext = mimeMatch ? mimeMatch[1].split('/')[1] : 'png';
                      link.download = `scanned_image_${Date.now()}.${ext}`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400 hover:text-emerald-300 rounded-2xl transition-all font-bold text-[10px] uppercase tracking-widest border border-emerald-400/20 shadow-[0_4px_16px_rgba(16,185,129,0.1)] active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    Save Image
                  </button>
                )}

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
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-40 bg-slate-950/95 backdrop-blur-3xl">
            <AlertCircle className="w-16 h-16 text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
            <p className="text-white text-base md:text-lg font-bold text-center mb-8 uppercase tracking-widest leading-tight max-w-md px-4">{error}</p>
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm px-4">
              <button
                onClick={startCamera}
                className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-2xl transition-all font-black text-center"
              >
                Retry Camera
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all font-bold text-[10px] uppercase tracking-widest text-slate-300 border border-white/10"
              >
                <ImageIcon className="w-4 h-4" />
                Scan Image File
              </button>
            </div>
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
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[9px] font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded uppercase">
                        {formatTime(item.timestamp)}
                      </span>
                      {item.format && (
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded uppercase">
                          {item.format}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => removeFromHistory(item.id)}
                      className="p-1 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {isImagePayload(item.data) ? (
                    <div className="flex items-center gap-3 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-slate-950 flex-shrink-0 flex items-center justify-center">
                        <img
                          src={item.data}
                          alt="Payload thumbnail"
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> Decoded Image
                        </p>
                        <p className="text-[9px] font-mono text-slate-500 truncate mt-0.5">
                          Size • {item.data.length} characters
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-mono text-slate-300 break-all line-clamp-2 min-h-[2rem]">
                      {item.data}
                    </p>
                  )}
                  
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => handleCopy(item.data)}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[9px] font-bold uppercase tracking-widest rounded-lg border border-white/5 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                    
                    {isImagePayload(item.data) && (
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = item.data;
                          const mimeMatch = item.data.match(/^data:(image\/[a-zA-Z+-]+);base64,/);
                          const ext = mimeMatch ? mimeMatch[1].split('/')[1] : 'png';
                          link.download = `scanned_image_${item.timestamp}.${ext}`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="flex-1 py-2 bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400 text-[9px] font-bold uppercase tracking-widest rounded-lg border border-emerald-400/10 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3 h-3" />
                        Save
                      </button>
                    )}

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

