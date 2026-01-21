
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface MapProps {
  center: { lat: number, lng: number };
  zoom?: number;
  markers?: { id: string, lat: number, lng: number, title?: string, icon?: string }[];
  radarRadius?: number; // in meters
  showRouteTo?: { lat: number, lng: number };
  onMarkerClick?: (id: string) => void;
  className?: string;
}

const MapView: React.FC<MapProps> = ({ 
  center, 
  zoom = 13, 
  markers = [], 
  radarRadius, 
  showRouteTo,
  onMarkerClick,
  className = "h-full w-full"
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerGroup = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    leafletMap.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([center.lat, center.lng], zoom);

    // Enterprise Dark Style Tiles (using CartoDB Voyager as a base)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(leafletMap.current);

    markerGroup.current = L.layerGroup().addTo(leafletMap.current);

    return () => {
      leafletMap.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!leafletMap.current || !markerGroup.current) return;

    // Clear old markers
    markerGroup.current.clearLayers();

    // Add Center/Self Marker
    const selfIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="w-8 h-8 bg-indigo-600 rounded-[1rem] border-4 border-white shadow-2xl flex items-center justify-center text-white font-black text-xs relative">
                S
                <div class="absolute -inset-4 bg-indigo-600/10 rounded-full animate-pulse pointer-events-none"></div>
             </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    L.marker([center.lat, center.lng], { icon: selfIcon }).addTo(markerGroup.current);

    // Add Radius Circle (Radar Mode)
    if (radarRadius) {
      L.circle([center.lat, center.lng], {
        radius: radarRadius,
        color: '#4F46E5',
        weight: 1,
        fillColor: '#4F46E5',
        fillOpacity: 0.05
      }).addTo(markerGroup.current);
    }

    // Add Job/Lead Markers
    markers.forEach(m => {
      const jobIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-10 h-10 bg-white rounded-[1.2rem] border-2 border-indigo-100 shadow-xl flex items-center justify-center text-xl relative group">
                  ${m.icon || '🛠️'}
                  <div class="absolute -inset-2 bg-indigo-600/20 rounded-full animate-ping opacity-30 pointer-events-none"></div>
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([m.lat, m.lng], { icon: jobIcon })
        .on('click', () => onMarkerClick?.(m.id))
        .addTo(markerGroup.current!);
      
      if (m.title) {
        marker.bindTooltip(m.title, { 
          permanent: false, 
          direction: 'top', 
          className: 'bg-white border-none rounded-lg shadow-xl font-black text-[10px] uppercase tracking-widest px-3 py-1.5'
        });
      }
    });

    // Transit Vector
    if (showRouteTo) {
      const destIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-lg"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      L.marker([showRouteTo.lat, showRouteTo.lng], { icon: destIcon }).addTo(markerGroup.current);

      L.polyline([
        [center.lat, center.lng],
        [showRouteTo.lat, showRouteTo.lng]
      ], {
        color: '#4F46E5',
        weight: 3,
        dashArray: '10, 10',
        opacity: 0.5
      }).addTo(markerGroup.current);
    }

    // Update view if center changes significantly
    leafletMap.current.panTo([center.lat, center.lng]);

  }, [center, markers, radarRadius, showRouteTo]);

  return (
    <div className={`relative rounded-[3rem] overflow-hidden shadow-inner ${className}`}>
      <div ref={mapRef} className="h-full w-full" />
      
      {/* Tactical HUD Overlays */}
      <div className="absolute top-6 left-6 z-[400] flex flex-col gap-2">
         <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-white flex items-center gap-3">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>
            <span className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Spatial Stream Active</span>
         </div>
      </div>
    </div>
  );
};

export default MapView;