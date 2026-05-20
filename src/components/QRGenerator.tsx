import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check, RefreshCw } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type ContentType = 'URL' | 'WIFI' | 'CONTACT' | 'TEXT';

export default function QRGenerator() {
  const [contentType, setContentType] = useState<ContentType>('URL');
  const [text, setText] = useState('https://github.com');
  const [wifi, setWifi] = useState({ ssid: '', password: '', encryption: 'WPA' });
  const [vcard, setVcard] = useState({ name: '', phone: '', email: '', company: '' });
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [size, setSize] = useState(300);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQR = async () => {
    let finalPayload = '';
    
    if (contentType === 'URL' || contentType === 'TEXT') {
      finalPayload = text;
    } else if (contentType === 'WIFI') {
      finalPayload = `WIFI:S:${wifi.ssid};T:${wifi.encryption};P:${wifi.password};;`;
    } else if (contentType === 'CONTACT') {
      finalPayload = `BEGIN:VCARD\nVERSION:3.0\nN:${vcard.name}\nORG:${vcard.company}\nTEL:${vcard.phone}\nEMAIL:${vcard.email}\nEND:VCARD`;
    }

    if (!finalPayload.trim()) {
      setQrDataUrl('');
      return;
    }
    try {
      const url = await QRCode.toDataURL(finalPayload, {
        width: size,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    generateQR();
  }, [text, wifi, vcard, contentType, fgColor, bgColor, size]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qr-code-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async () => {
    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
      {/* Configuration & Customization (Col 7) */}
      <section className="lg:col-span-7 flex flex-col gap-6 h-full">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass p-4 sm:p-6 rounded-[2rem] flex flex-col gap-4 flex-1"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-400">Input Configuration</h2>
            <span className="text-[10px] text-slate-500 font-mono">v2.0.4-STABLE</span>
          </div>

          <div className="space-y-4 flex-1 flex flex-col">
            <div className="space-y-2">
              <label className="text-xs font-medium opacity-60 uppercase tracking-widest">Content Type</label>
              <div className="flex overflow-x-auto sm:grid sm:grid-cols-4 gap-2 pb-4 sm:pb-0 custom-scrollbar">
                {(['URL', 'WIFI', 'CONTACT', 'TEXT'] as ContentType[]).map((type) => (
                  <button 
                    key={type}
                    onClick={() => setContentType(type)}
                    className={cn(
                      "flex-shrink-0 sm:flex-shrink bg-white/5 border p-3 rounded-xl text-center text-[12px] cursor-pointer transition-all uppercase font-black tracking-tight whitespace-nowrap min-w-[100px] sm:min-w-0",
                      contentType === type ? "border-cyan-400/30 text-cyan-400 bg-cyan-400/5 shadow-[0_0_15px_rgba(34,211,238,0.15)]" : "border-white/10 opacity-50 hover:opacity-100"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 flex flex-col gap-4">
              {contentType === 'URL' && (
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full flex-1 bg-slate-950/50 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-cyan-400/50 transition-all resize-none font-mono text-slate-200"
                  placeholder="Enter destination URL..."
                />
              )}
              {contentType === 'TEXT' && (
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full flex-1 bg-slate-950/50 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-cyan-400/50 transition-all resize-none font-mono text-slate-200"
                  placeholder="Enter plain text message..."
                />
              )}
              {contentType === 'WIFI' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Network SSID"
                    value={wifi.ssid}
                    onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-sm focus:border-cyan-400/50 transition-all outline-none"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={wifi.password}
                    onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-sm focus:border-cyan-400/50 transition-all outline-none"
                  />
                  <select
                    value={wifi.encryption}
                    onChange={(e) => setWifi({ ...wifi, encryption: e.target.value })}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-sm focus:border-cyan-400/50 transition-all outline-none text-slate-400"
                  >
                    <option value="WPA">WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None</option>
                  </select>
                </div>
              )}
              {contentType === 'CONTACT' && (
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={vcard.name}
                    onChange={(e) => setVcard({ ...vcard, name: e.target.value })}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-sm focus:border-cyan-400/50 transition-all outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={vcard.phone}
                    onChange={(e) => setVcard({ ...vcard, phone: e.target.value })}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-sm focus:border-cyan-400/50 transition-all outline-none"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={vcard.email}
                    onChange={(e) => setVcard({ ...vcard, email: e.target.value })}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-sm focus:border-cyan-400/50 transition-all outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Company"
                    value={vcard.company}
                    onChange={(e) => setVcard({ ...vcard, company: e.target.value })}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-sm focus:border-cyan-400/50 transition-all outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-4 sm:p-6 rounded-[2rem] flex flex-col gap-4"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-400">Customization</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono tracking-tighter">
                  <label className="uppercase">Dot_Density</label>
                  <span className="text-cyan-400">{(size/1024 * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${(size/1024 * 100)}%` }} />
                </div>
                <input
                  type="range"
                  min="128"
                  max="1024"
                  step="8"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full h-2 opacity-0 cursor-pointer -mt-2 absolute"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono tracking-tighter">
                  <label className="uppercase">Spectrum_Shift</label>
                  <span className="text-cyan-400">Active</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 w-[60%]" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-full bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center p-3 transition-colors hover:border-cyan-400/30">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-10 h-10 rounded-full cursor-pointer bg-transparent border-none appearance-none overflow-hidden"
                />
                <span className="text-[9px] uppercase tracking-tighter mt-1">Primary</span>
              </div>
              <div className="flex-1 h-full bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center p-3 transition-colors hover:border-white/30">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-10 h-10 rounded-full cursor-pointer bg-transparent border-none appearance-none overflow-hidden"
                />
                <span className="text-[9px] uppercase tracking-tighter mt-1">Background</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Preview Section (Col 5) */}
      <section className="lg:col-span-5 flex flex-col gap-6 w-full">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-[2rem] p-4 sm:p-8 flex flex-col items-center justify-center gap-6 sm:gap-8 relative overflow-hidden h-full"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.05),transparent)] pointer-events-none" />
          
          <div className="p-4 bg-white rounded-3xl neon-border relative group">
            <AnimatePresence mode="wait">
              {qrDataUrl && (
                <motion.img
                  key={qrDataUrl}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.9 }}
                  exit={{ opacity: 0 }}
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-60 h-60 object-contain"
                />
              )}
            </AnimatePresence>
            <div className="absolute inset-0 border-[16px] border-white rounded-3xl pointer-events-none" />
          </div>

          <div className="w-full space-y-3">
            <button
              onClick={handleDownload}
              className="w-full glow-button flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>
            <button
              onClick={handleCopy}
              className="w-full py-4 bg-white/5 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy to Clipboard'}
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
