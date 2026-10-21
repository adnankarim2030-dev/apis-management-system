import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Navigation,
  RefreshCw,
  Smartphone,
  Battery,
  Clock,
  ShieldAlert,
  Search,
  User,
  Radio,
  ExternalLink,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export interface StaffLocationItem {
  userId: string;
  name: string;
  email: string;
  employeeId: string;
  designation?: string;
  avatarUrl?: string;
  department?: string;
  location?: {
    id: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    device?: string;
    battery?: number;
    address?: string;
    updatedAt: string;
  } | null;
}

export const LiveTrackingHub: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const userEmail = (user?.email || '').toLowerCase();

  // STRICT ACCESS: ONLY Adnan Karim and CEO Khurram Jaffrani can view this page
  const isAuthorized = ['khurram@apis.com', 'adnan@apis.com'].includes(userEmail);

  const [staffLocations, setStaffLocations] = useState<StaffLocationItem[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffLocationItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdatingSelfLocation, setIsUpdatingSelfLocation] = useState(false);
  const [selfLocationStatus, setSelfLocationStatus] = useState<string | null>(null);

  const fetchLocations = async () => {
    if (!isAuthorized) return;
    try {
      setIsLoading(true);
      const res = await api.get<StaffLocationItem[]>('/locations/live');
      setStaffLocations(res.data);
      if (res.data.length > 0 && !selectedStaff) {
        // Select first staff with valid coordinates or first user
        const withCoords = res.data.find((s) => s.location);
        setSelectedStaff(withCoords || res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load staff locations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 15000); // 15s live refresh
    return () => clearInterval(interval);
  }, [userEmail]);

  // Transmit current device GPS to backend
  const handleTransmitCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsUpdatingSelfLocation(true);
    setSelfLocationStatus('Acquiring high-accuracy GPS fix...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude, accuracy, speed, heading } = pos.coords;
          await api.post('/locations/ping', {
            latitude,
            longitude,
            accuracy,
            speed: speed || 0,
            heading: heading || 0,
            device: /iPhone|iPad|iPod/i.test(navigator.userAgent)
              ? 'ios'
              : /Android/i.test(navigator.userAgent)
              ? 'android'
              : 'web',
            battery: 92,
            address: 'Live GPS Pin Broadcast',
          });
          setSelfLocationStatus('GPS location relayed successfully!');
          fetchLocations();
          setTimeout(() => setSelfLocationStatus(null), 3000);
        } catch (e: any) {
          setSelfLocationStatus('Failed to send GPS: ' + e.message);
        } finally {
          setIsUpdatingSelfLocation(false);
        }
      },
      (err) => {
        setSelfLocationStatus('GPS Error: ' + err.message);
        setIsUpdatingSelfLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // If user is not Adnan Karim or Khurram Jaffrani, show Access Denied
  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-xl">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Restricted Tracking Terminal</h2>
        <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
          Google Map Live GPS Telemetry is classified executive intelligence strictly restricted to{' '}
          <strong className="text-white">CEO Khurram Jaffrani</strong> and{' '}
          <strong className="text-white">Adnan Karim</strong>. This terminal is hidden and protected from all other staff members.
        </p>
        <button
          onClick={() => onNavigate('/')}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const filteredStaff = staffLocations.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.designation || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCoord = selectedStaff?.location
    ? { lat: selectedStaff.location.latitude, lng: selectedStaff.location.longitude }
    : { lat: 24.8607, lng: 67.0011 }; // Default Karachi center

  // Dynamic OpenStreetMap / Google Map embed URL
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${activeCoord.lng - 0.015}%2C${
    activeCoord.lat - 0.01
  }%2C${activeCoord.lng + 0.015}%2C${activeCoord.lat + 0.01}&layer=mapnik&marker=${activeCoord.lat}%2C${
    activeCoord.lng
  }`;

  const googleMapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${activeCoord.lat},${activeCoord.lng}`;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <MapPin className="w-6 h-6 text-brand-400" />
              Live Staff Location & GPS Telemetry
            </h1>
            <span className="text-[10px] font-mono uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
              Classified View
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Realtime Google Map coordinates relay • Visible exclusively to <strong>Adnan Karim</strong> & <strong>CEO Khurram Jaffrani</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTransmitCurrentLocation}
            disabled={isUpdatingSelfLocation}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Radio className={`w-4 h-4 ${isUpdatingSelfLocation ? 'animate-pulse' : ''}`} />
            <span>{isUpdatingSelfLocation ? 'Pinging GPS...' : 'Broadcast My Location'}</span>
          </button>

          <button
            onClick={fetchLocations}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {selfLocationStatus && (
        <div className="p-3 bg-brand-500/10 border border-brand-500/30 rounded-2xl text-xs text-brand-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
          <span>{selfLocationStatus}</span>
        </div>
      )}

      {/* Main Grid: Left Staff List, Right Live Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Staff Telemetry Directory (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Staff Members ({staffLocations.length})
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Tracking Active
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff by name or role..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Staff List */}
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {filteredStaff.map((staff) => {
                const isSelected = selectedStaff?.userId === staff.userId;
                const hasLocation = !!staff.location;

                return (
                  <div
                    key={staff.userId}
                    onClick={() => setSelectedStaff(staff)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-brand-600/15 border-brand-500/40 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={staff.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80'}
                          alt={staff.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            {staff.name}
                            {staff.email === 'khurram@apis.com' && (
                              <span className="text-[9px] font-mono text-amber-400 font-bold bg-amber-500/15 px-1 rounded">CEO</span>
                            )}
                            {staff.email === 'adnan@apis.com' && (
                              <span className="text-[9px] font-mono text-brand-400 font-bold bg-brand-500/15 px-1 rounded">LEAD</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">{staff.designation || 'Staff'}</div>
                        </div>
                      </div>

                      {hasLocation ? (
                        <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Online
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                          Standby
                        </span>
                      )}
                    </div>

                    {hasLocation ? (
                      <div className="text-[11px] text-slate-400 bg-slate-900/70 p-2 rounded-lg border border-slate-850 flex items-center justify-between font-mono">
                        <span className="truncate max-w-[170px] text-slate-300">
                          {staff.location?.address || `${staff.location?.latitude.toFixed(4)}, ${staff.location?.longitude.toFixed(4)}`}
                        </span>
                        <span className="text-[10px] text-brand-400 uppercase">
                          {staff.location?.device || 'mobile'}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic pl-1">
                        GPS pin will automatically show when mobile app is logged in
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Map View (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            {/* Map Header Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Selected Staff Member
                </div>
                <div className="text-base font-extrabold text-white mt-0.5 flex items-center gap-2">
                  <span>{selectedStaff?.name || 'Select Staff'}</span>
                  <span className="text-xs font-mono text-brand-400 font-normal">
                    ({selectedStaff?.employeeId || 'ID'})
                  </span>
                </div>
              </div>

              {selectedStaff?.location && (
                <div className="flex items-center gap-2">
                  <a
                    href={googleMapsExternalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-600/30"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Live Map Embed Container */}
            <div className="relative w-full h-[460px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
              <iframe
                title="Staff Live GPS Telemetry"
                src={mapEmbedUrl}
                className="w-full h-full border-0 filter invert-[90%] hue-rotate-180 contrast-125"
                loading="lazy"
              />

              {/* Floating Map Overlay Badge */}
              <div className="absolute top-4 left-4 z-10 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-3 rounded-2xl shadow-xl flex items-center gap-3">
                <div className="p-2 rounded-xl bg-brand-500/15 text-brand-400 border border-brand-500/30">
                  <Navigation className="w-5 h-5 animate-pulse" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>{selectedStaff?.name}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-1.5 rounded">
                      GPS Active
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                    Lat: {activeCoord.lat.toFixed(5)} • Lng: {activeCoord.lng.toFixed(5)}
                  </div>
                </div>
              </div>
            </div>

            {/* Telemetry Detail Grid */}
            {selectedStaff?.location ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Latitude / Longitude</div>
                  <div className="font-mono text-xs font-bold text-white mt-0.5">
                    {selectedStaff.location.latitude.toFixed(4)}, {selectedStaff.location.longitude.toFixed(4)}
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Device Client</div>
                  <div className="font-mono text-xs font-bold text-brand-400 mt-0.5 uppercase">
                    {selectedStaff.location.device || 'Android Field Client'}
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">GPS Precision</div>
                  <div className="font-mono text-xs font-bold text-emerald-400 mt-0.5">
                    ±{selectedStaff.location.accuracy ? Math.round(selectedStaff.location.accuracy) : 5} meters
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Last Pinged</div>
                  <div className="font-mono text-xs font-bold text-slate-300 mt-0.5">
                    {new Date(selectedStaff.location.updatedAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Waiting for next live GPS telemetry update from this employee's mobile device...</span>
                <span className="font-mono text-[10px] text-amber-400">STATUS: STANDBY</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
