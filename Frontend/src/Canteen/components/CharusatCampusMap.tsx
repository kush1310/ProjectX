import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Navigation, Compass, Phone, Bike, Clock, CheckCircle2,
  ExternalLink, Sparkles, Building2, User, RefreshCw, Layers
} from 'lucide-react';
import L from 'leaflet';
import api from '@/utils/api';

export interface CampusLocation {
  id: string;
  name: string;
  code: string;
  type: 'canteen' | 'building' | 'hostel' | 'landmark';
  lat: number;
  lng: number;
  description: string;
}

// Fallback CHARUSAT University Key Campus Coordinates
export const CHARUSAT_LOCATIONS: CampusLocation[] = [
  { id: 'cspit', name: 'CSPIT Engineering Building', code: 'CSPIT', type: 'building', lat: 22.6005, lng: 72.8201, description: 'Faculty of Technology & Engineering' },
  { id: 'depstar', name: 'DEPSTAR Tech Block', code: 'DEPSTAR', type: 'building', lat: 22.6012, lng: 72.8210, description: 'Devang Patel Institute of Advance Tech' },
  { id: 'pdpias', name: 'PDPIAS Applied Sciences', code: 'PDPIAS', type: 'building', lat: 22.5990, lng: 72.8198, description: 'P.D. Patel Institute of Applied Sciences' },
  { id: 'cmpica', name: 'CMPICA Computer Block', code: 'CMPICA', type: 'building', lat: 22.6015, lng: 72.8192, description: 'Smt. Chandaben Mohanbhai Patel Inst.' },
  { id: 'rpcp', name: 'RPCP Pharmacy College', code: 'RPCP', type: 'building', lat: 22.6000, lng: 72.8188, description: 'Ramanbhai Patel College of Pharmacy' },
  { id: 'sweet_spot', name: 'Sweet Spot', code: 'SWEET_SPOT', type: 'canteen', lat: 22.6002, lng: 72.8206, description: 'Student Activity Center' },
  { id: 'yogi_99', name: '99 Yogi', code: '99_YOGI', type: 'canteen', lat: 22.6008, lng: 72.8214, description: 'Central Food Plaza' },
  { id: 'dannys', name: "Danny's", code: 'DANNYS', type: 'canteen', lat: 22.6010, lng: 72.8195, description: 'Campus Changa' },
  { id: 'ice_berg', name: 'Ice Berg', code: 'ICE_BERG', type: 'canteen', lat: 22.5995, lng: 72.8202, description: 'Fresh Hub Plaza' },
  { id: 'pramukh', name: 'Pramukh', code: 'PRAMUKH', type: 'canteen', lat: 22.6018, lng: 72.8208, description: 'Pramukh Preet Point' },
  { id: 'gohunger', name: 'Go Hunger Cafe', code: 'GOHUNGER', type: 'canteen', lat: 22.5998, lng: 72.8212, description: 'Central Plaza Food Court' },
  { id: 'patel_puff', name: 'Patel Puff Canteen', code: 'PUFF', type: 'canteen', lat: 22.5985, lng: 72.8215, description: 'Student Corner' },
  { id: 'boys_hostel', name: 'Boys Hostel Complex', code: 'BOYS_HOSTEL', type: 'hostel', lat: 22.6025, lng: 72.8220, description: 'Shreedeep, Nisarg, Ohm & Royal Care' },
  { id: 'girls_hostel', name: 'Girls Hostel Complex (H1-H9)', code: 'GIRLS_HOSTEL', type: 'hostel', lat: 22.5975, lng: 72.8230, description: 'CHARUSAT Girls Residency H1-H9' },
  { id: 'admin', name: 'CHARUSAT Central Plaza Lawn', code: 'ADMIN', type: 'landmark', lat: 22.5996, lng: 72.8205, description: 'Main Entrance & Administrative Lawn' },
];

export interface DeliveryAgent {
  name: string;
  phone: string;
  vehicle: string;
  rating: number;
  photoUrl?: string;
}

const DEFAULT_AGENT: DeliveryAgent = {
  name: 'Rajeshkumar Patel',
  phone: '+91 98247 32106',
  vehicle: 'CHARUSAT E-Bike GJ-23-CE-8821',
  rating: 4.9,
};

interface CharusatCampusMapProps {
  mode?: 'select' | 'track';
  selectedLocation?: CampusLocation | null;
  onSelectLocation?: (loc: CampusLocation) => void;
  canteenName?: string;
  orderStatus?: string;
  orderNumber?: string;
  canteenLat?: number;
  canteenLng?: number;
  deliveryLat?: number;
  deliveryLng?: number;
  agent?: DeliveryAgent;
  height?: string;
}

export default function CharusatCampusMap({
  mode = 'select',
  selectedLocation,
  onSelectLocation,
  canteenName = 'Canteen Outlet',
  orderStatus = 'OUT_FOR_DELIVERY',
  orderNumber,
  canteenLat = 22.5998,
  canteenLng = 72.8212,
  deliveryLat = 22.6005,
  deliveryLng = 72.8201,
  agent = DEFAULT_AGENT,
  height = 'h-80',
}: CharusatCampusMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const polylineRef = useRef<L.Polyline | null>(null);
  const agentMarkerRef = useRef<L.Marker | null>(null);

  const [locations, setLocations] = useState<CampusLocation[]>(CHARUSAT_LOCATIONS);
  const [activeLoc, setActiveLoc] = useState<CampusLocation>(
    selectedLocation || CHARUSAT_LOCATIONS[0]
  );
  const [mapStyle, setMapStyle] = useState<'standard' | 'satellite'>('standard');
  const [progress, setProgress] = useState(0.45);
  const [etaMinutes, setEtaMinutes] = useState(12);
  const [distanceKm, setDistanceKm] = useState(0.8);
  const [routeWaypoints, setRouteWaypoints] = useState<[number, number][]>([
    [canteenLat, canteenLng],
    [(canteenLat + deliveryLat) / 2, (canteenLng + deliveryLng) / 2],
    [deliveryLat, deliveryLng]
  ]);

  // Fetch campus locations and config from Map Leaflet API
  useEffect(() => {
    async function loadMapData() {
      try {
        const res = await api.get('/map/locations');
        if (res.data && res.data.locations && Array.isArray(res.data.locations)) {
          setLocations(res.data.locations);
        }
      } catch (err) {
        console.warn('Map API locations endpoint fallback:', err);
      }

      try {
        const routeRes = await api.get('/map/route', {
          params: { startLat: canteenLat, startLng: canteenLng, endLat: deliveryLat, endLng: deliveryLng }
        });
        if (routeRes.data && routeRes.data.waypoints) {
          setRouteWaypoints(routeRes.data.waypoints);
          if (routeRes.data.etaMinutes) setEtaMinutes(routeRes.data.etaMinutes);
          if (routeRes.data.distanceKm) setDistanceKm(routeRes.data.distanceKm);
        }
      } catch (err) {
        console.warn('Map API route endpoint fallback:', err);
      }
    }
    loadMapData();
  }, [canteenLat, canteenLng, deliveryLat, deliveryLng]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [22.6005, 72.8201],
      zoom: 17,
      zoomControl: true,
      attributionControl: false
    });

    const standardUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const tileLayer = L.tileLayer(standardUrl, { maxZoom: 19 }).addTo(map);
    tileLayerRef.current = tileLayer;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Map Tiles on Style Switch
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    const url = mapStyle === 'satellite'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    tileLayerRef.current.setUrl(url);
  }, [mapStyle]);

  // Render Leaflet Markers for Campus Locations
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    if (mode === 'select') {
      locations.forEach((loc) => {
        const isSelected = activeLoc.id === loc.id;
        const iconBg = isSelected
          ? 'bg-rose-600 text-white ring-4 ring-rose-500/40 scale-125'
          : loc.type === 'canteen'
          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
          : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-600';

        const customIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `<div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xl transition-all ${iconBg}">
                   ${loc.type === 'canteen' ? '🏬' : loc.type === 'hostel' ? '🏡' : '🏢'}
                 </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);
        marker.bindTooltip(`<b>${loc.name}</b><br/><span style="font-size:10px">${loc.description}</span>`, {
          permanent: isSelected,
          direction: 'top',
          offset: [0, -10]
        });

        marker.on('click', () => {
          setActiveLoc(loc);
          if (onSelectLocation) onSelectLocation(loc);
          map.panTo([loc.lat, loc.lng]);
        });

        markersRef.current[loc.id] = marker;
      });
    }

    // Origin (Canteen) Marker
    const canteenIcon = L.divIcon({
      className: 'canteen-leaflet-marker',
      html: `<div class="w-9 h-9 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-black text-sm shadow-xl border-2 border-amber-300 ring-4 ring-amber-500/30">🏬</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
    const canteenMarker = L.marker([canteenLat, canteenLng], { icon: canteenIcon }).addTo(map);
    canteenMarker.bindTooltip(`<b>${canteenName}</b> (Origin)`, { direction: 'bottom', offset: [0, 10] });
    markersRef.current['canteen_origin'] = canteenMarker;

    // Delivery Location Marker
    const deliveryIcon = L.divIcon({
      className: 'delivery-leaflet-marker',
      html: `<div class="w-9 h-9 bg-emerald-500 text-white rounded-full flex items-center justify-center font-black text-sm shadow-xl border-2 border-emerald-300 ring-4 ring-emerald-500/30">📍</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
    const deliveryMarker = L.marker([deliveryLat, deliveryLng], { icon: deliveryIcon }).addTo(map);
    deliveryMarker.bindTooltip(`<b>Drop-off Location</b>`, { direction: 'bottom', offset: [0, 10] });
    markersRef.current['delivery_drop'] = deliveryMarker;

  }, [mode, locations, activeLoc, canteenLat, canteenLng, deliveryLat, deliveryLng, canteenName, onSelectLocation]);

  // Render Leaflet Polyline Route & Live Delivery Agent Tracking
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (polylineRef.current) polylineRef.current.remove();
    if (agentMarkerRef.current) agentMarkerRef.current.remove();

    // Route Polyline
    const polyline = L.polyline(routeWaypoints, {
      color: '#e23744',
      weight: 5,
      opacity: 0.8,
      dashArray: '8, 8'
    }).addTo(map);
    polylineRef.current = polyline;

    // Fit bounds to show canteen & delivery
    const bounds = L.latLngBounds([
      [canteenLat, canteenLng],
      [deliveryLat, deliveryLng]
    ]);
    map.fitBounds(bounds, { padding: [40, 40] });

    // Animated Delivery Agent Marker
    if (mode === 'track' && orderStatus !== 'COMPLETED' && orderStatus !== 'DELIVERED') {
      const curLat = canteenLat + (deliveryLat - canteenLat) * progress;
      const curLng = canteenLng + (deliveryLng - canteenLng) * progress;

      const agentIcon = L.divIcon({
        className: 'agent-leaflet-marker',
        html: `<div class="relative">
                 <span class="absolute -inset-2 rounded-full bg-rose-500/40 animate-ping"></span>
                 <div class="w-10 h-10 bg-[#e23744] text-white rounded-full flex items-center justify-center shadow-2xl ring-4 ring-rose-500/50 font-extrabold text-sm">
                   🛵
                 </div>
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const agentMarker = L.marker([curLat, curLng], { icon: agentIcon }).addTo(map);
      agentMarker.bindTooltip(`<b>Delivery Agent</b><br/>ETA: ~${etaMinutes} mins`, { permanent: true, direction: 'top', offset: [0, -15] });
      agentMarkerRef.current = agentMarker;
    }
  }, [routeWaypoints, canteenLat, canteenLng, deliveryLat, deliveryLng, mode, progress, orderStatus, etaMinutes]);

  // Animate progress over time in tracking mode
  useEffect(() => {
    if (mode !== 'track' || orderStatus === 'COMPLETED' || orderStatus === 'DELIVERED') {
      if (orderStatus === 'DELIVERED' || orderStatus === 'COMPLETED') setProgress(1);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 0.95) return 0.95;
        const next = prev + 0.02;
        setEtaMinutes(Math.max(1, Math.round((1 - next) * 15)));
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [mode, orderStatus]);

  const handleSelect = (loc: CampusLocation) => {
    setActiveLoc(loc);
    if (onSelectLocation) onSelectLocation(loc);
  };

  return (
    <div className="w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col relative z-0">
      {/* Map Header Controls */}
      <div className="bg-slate-900/95 backdrop-blur-md px-4 py-3 border-b border-slate-800/80 flex items-center justify-between z-10 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-[#e23744] flex items-center justify-center font-bold">
            <Navigation className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
              CHARUSAT Campus Map (Leaflet API)
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                Changa, Anand
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              {mode === 'select'
                ? 'Click map pins or location cards to select drop-off point'
                : `Live Leaflet Radar • Order ${orderNumber || '#ORD-8821'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMapStyle(mapStyle === 'standard' ? 'satellite' : 'standard')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all flex items-center gap-1.5 border border-slate-700 shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-rose-400" />
            {mapStyle === 'standard' ? 'Satellite View' : 'OpenStreetMap'}
          </button>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=CHARUSAT+University+Changa+Anand`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
            title="Open in Google Maps"
          >
            <ExternalLink className="w-4 h-4 text-sky-400" />
          </a>
        </div>
      </div>

      {/* Leaflet Interactive Map Canvas */}
      <div className={`relative w-full ${height} overflow-hidden select-none bg-slate-950`}>
        <div ref={mapContainerRef} className="w-full h-full z-0" />
      </div>

      {/* Map Footer Information */}
      {mode === 'select' ? (
        <div className="bg-slate-900 p-3.5 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">{activeLoc.name}</p>
              <p className="text-[11px] text-slate-400">{activeLoc.description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSelect(activeLoc)}
            className="px-4 py-2 bg-[#e23744] hover:bg-[#d62f3f] text-white text-xs font-bold rounded-xl shadow-md shadow-rose-900/30 transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Deliver Here
          </button>
        </div>
      ) : (
        /* Live Tracking Agent Info Bar */
        <div className="bg-slate-900/95 p-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-slate-800 border-2 border-rose-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                <User className="w-6 h-6 text-slate-300" />
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">{agent.name}</h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  ★ {agent.rating}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{agent.vehicle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end text-xs font-bold text-emerald-400">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>ETA: ~{etaMinutes} min ({distanceKm} km)</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Leaflet Campus Routing</p>
            </div>

            <a
              href={`tel:${agent.phone}`}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950 transition-all flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              Call Agent
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
