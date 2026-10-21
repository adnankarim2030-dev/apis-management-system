import React, { useState } from 'react';
import {
  Smartphone,
  Apple,
  Download,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  X,
  ExternalLink,
  MapPin,
  Wifi,
  Battery,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

interface MobileDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTracking?: () => void;
  canViewTracking?: boolean;
}

export const MobileDownloadModal: React.FC<MobileDownloadModalProps> = ({
  isOpen,
  onClose,
  onNavigateTracking,
  canViewTracking = false,
}) => {
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const appVersion = 'v2.4.0 (Enterprise Build)';
  const apkDownloadUrl = '/downloads/apis-field-tracker-release.apk';
  const pwaInstallUrl = window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">APIS Mobile Companion</h2>
            <p className="text-xs text-slate-400">Install native field telemetry & client workspace app</p>
          </div>
        </div>

        {/* Platform Switcher */}
        <div className="grid grid-cols-2 gap-2 my-5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'android'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android (APK / PWA)</span>
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ios'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>Apple iOS (Web App)</span>
          </button>
        </div>

        {/* Android Tab */}
        {activeTab === 'android' && (
          <div className="space-y-4">
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    Direct Android Package (.APK)
                    <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      Ready
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Version {appVersion} • 18.4 MB</div>
                </div>
                <a
                  href={apkDownloadUrl}
                  download="APIS-Field-Tracker-v2.4.apk"
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/25 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download APK</span>
                </a>
              </div>

              <div className="text-[11px] text-slate-400 border-t border-slate-850 pt-2.5 space-y-1">
                <div className="flex items-center gap-2 text-slate-300 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Includes background GPS beacon, offline timesheet logging, and task sync.</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs font-bold text-white mb-1.5">How to install on Android:</div>
              <ol className="text-[11px] text-slate-400 space-y-1 list-decimal list-inside">
                <li>Click <strong>Download APK</strong> button above to download the installer.</li>
                <li>Tap the downloaded file in your notification panel or Downloads folder.</li>
                <li>If prompted, enable <em>"Install from Unknown Sources"</em> for your browser.</li>
                <li>Login with your official APIS email and private password.</li>
              </ol>
            </div>
          </div>
        )}

        {/* iOS Tab */}
        {activeTab === 'ios' && (
          <div className="space-y-4">
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    Apple iOS Home Screen App (PWA)
                    <span className="text-[10px] font-mono bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                      No App Store Needed
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Instant zero-install enterprise profile</div>
                </div>
              </div>

              <div className="text-xs font-bold text-white pt-2 border-t border-slate-850">
                Install in 3 simple steps on Safari:
              </div>
              <ol className="text-[11px] text-slate-400 space-y-2 list-decimal list-inside">
                <li>
                  Open <strong>Safari</strong> on your iPhone and visit this portal URL:
                  <div className="flex items-center gap-2 mt-1.5 bg-slate-900 border border-slate-800 p-2 rounded-xl">
                    <span className="font-mono text-xs text-brand-300 truncate flex-1">{pwaInstallUrl}</span>
                    <button
                      onClick={handleCopyLink}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </li>
                <li>Tap the <strong>Share</strong> button (box with upward arrow) at the bottom of Safari.</li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong> (icon with a plus sign).</li>
                <li>Tap <strong>Add</strong> at top right. Launch the APIS app from your home screen icon!</li>
              </ol>
            </div>
          </div>
        )}

        {/* Tracking Note */}
        <div className="mt-5 p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-start gap-3">
          <MapPin className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <div className="font-bold text-white">Live GPS Location Telemetry</div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              When logged in, your mobile app relays accurate live field coordinates so managers can support client campaigns.
            </p>
            {canViewTracking && onNavigateTracking && (
              <div className="mt-2.5 pt-2 border-t border-slate-850 flex items-center justify-between">
                <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Executive Map Access Available
                </span>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateTracking();
                  }}
                  className="px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Open Live Map →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
