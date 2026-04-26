"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// We pass the incidents down from the main dashboard
export default function LiveMap({ incidents }: { incidents: any[] }) {
  // Center the map (Defaulting to a central coordinate, you can change this later!)
  const defaultCenter: [number, number] = [40.7128, -74.0060]; // New York

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={12} 
        style={{ height: '100%', width: '100%', background: '#0b0f1a' }}
        zoomControl={false}
      >
        {/* A beautiful dark-mode map skin from CartoDB */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* Loop through incidents and plot them */}
        {incidents.map((incident, index) => {
          // For now, we will mathematically scatter the pins slightly around the center
          // so they don't stack on top of each other, until we hook up the AI Geocoder!
          const offsetLat = defaultCenter[0] + (Math.sin(index) * 0.05);
          const offsetLng = defaultCenter[1] + (Math.cos(index) * 0.05);

          return (
            <CircleMarker 
              key={incident.id}
              center={[offsetLat, offsetLng]} 
              radius={incident.urgency > 8 ? 12 : 8}
              color={incident.urgency > 8 ? '#ef4444' : '#3b82f6'}
              fillColor={incident.urgency > 8 ? '#ef4444' : '#3b82f6'}
              fillOpacity={0.5}
              className={`${incident.urgency > 8 ? 'animate-pulse' : ''}`}
            >
              <Popup className="custom-popup">
                <div className="bg-slate-900 text-white p-2 rounded border border-slate-700">
                  <span className="text-xs font-bold uppercase text-slate-400 block mb-1">{incident.category}</span>
                  <p className="text-sm">{incident.summary}</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}