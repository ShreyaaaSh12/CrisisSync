"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MOCK_INCIDENTS as initialData, Incident } from "../lib/mock-data";

// Dynamically import the map to prevent Server-Side Rendering crashes
const LiveMap = dynamic(() => import("../components/LiveMap"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-[#0b0f1a]">
      <span className="text-4xl animate-pulse mb-4">🛰️</span>
      <div className="animate-pulse font-medium tracking-wide">Initializing Geospatial Layer...</div>
    </div>
  )
});

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>(initialData);
  const [isUploading, setIsUploading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [manualText, setManualText] = useState("");
  
  // Cooldown state
  const [cooldown, setCooldown] = useState(0);

  // The Timer Engine
  useEffect(() => {
    if (cooldown > 0) {
      const timerId = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [cooldown]);

  const processWithAI = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://10.50.0.52:8000/extract-incident", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();

      const newIncident: Incident = {
        id: Math.random().toString(36).substring(2, 9),
        category: data.category || "Other",
        urgency: data.urgency || 5,
        affected_people: data.affected_people || 0,
        summary: data.summary || "No summary provided.",
        location_context: data.location_context || "Unknown Location",
        timestamp: "Just now"
      };

      setIncidents((prev) => [newIncident, ...prev]);
      
      // If the AI triggers our Fallback System Alert, start the 60s cooldown!
      if (data.summary.includes("SYSTEM ALERT")) {
        setCooldown(60);
      } else {
        // Only close the form if it was a successful, real generation
        setIsFormOpen(false);
        setManualText("");
      }

    } catch (error: any) {
      console.error("Connection Error:", error);
      alert(`AI Extraction Failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processWithAI(file);
    event.target.value = ""; 
  };

  const handleManualSubmit = () => {
    if (!manualText.trim() || cooldown > 0) return;
    const blob = new Blob([manualText], { type: "text/plain" });
    const virtualFile = new File([blob], "dispatch-log.txt", { type: "text/plain" });
    processWithAI(virtualFile);
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans selection:bg-blue-500/30 overflow-hidden">
      
      <aside className="w-96 border-r border-slate-700 flex flex-col shadow-2xl z-10 bg-slate-900">
        <div className="p-6 border-b border-slate-700 bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-bold tracking-tight text-blue-400">SHCRN Command</h1>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-medium text-green-500 uppercase tracking-wider">Live</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-6">Incident Intelligence</p>
          
          {!isFormOpen ? (
            <button 
              onClick={() => setIsFormOpen(true)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-[11px] font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="text-lg">+</span> REPORT NEW INCIDENT
            </button>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-600 p-3 shadow-inner animate-in fade-in slide-in-from-top-2 duration-200">
              <textarea 
                placeholder="Type dispatch details here..."
                className={`w-full bg-slate-900 text-sm p-3 rounded-lg border focus:ring-1 outline-none resize-none h-24 mb-3 placeholder:text-slate-600 transition-colors ${
                  cooldown > 0 ? 'border-red-900/50 text-slate-500 cursor-not-allowed focus:border-red-900 focus:ring-red-900' : 'border-slate-700 focus:border-blue-500 focus:ring-blue-500'
                }`}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                disabled={isUploading || cooldown > 0}
              />
              
              <div className="flex gap-2">
                {/* The Dynamic Cooldown Button */}
                <button 
                  onClick={handleManualSubmit}
                  disabled={isUploading || !manualText.trim() || cooldown > 0}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 transition-all ${
                    cooldown > 0 
                      ? 'bg-red-950 text-red-500 cursor-not-allowed border border-red-900/50' 
                      : isUploading || !manualText.trim() 
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-500 text-white shadow-lg'
                  }`}
                >
                  {cooldown > 0 
                    ? `⏳ SYSTEM LOCKED (${cooldown}s)` 
                    : isUploading 
                      ? "🤖 ANALYZING..." 
                      : "SEND TO AI"}
                </button>

                <label className={`px-4 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all ${
                  isUploading || cooldown > 0 ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 text-white cursor-pointer'
                }`}>
                  📁 FILE
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading || cooldown > 0} accept="image/*,text/plain" />
                </label>
                
                <button 
                  onClick={() => {
                    setIsFormOpen(false);
                    setManualText("");
                  }}
                  disabled={isUploading || cooldown > 0}
                  className="px-3 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {incidents.map((incident) => (
            <div key={incident.id} className={`p-4 rounded-xl border transition-all hover:border-slate-500 group ${incident.summary.includes('SYSTEM ALERT') ? 'border-red-600 bg-red-950/30 animate-pulse' : incident.urgency > 8 ? 'border-red-500/40 bg-red-500/5 hover:bg-red-500/10' : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'}`}>
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${incident.summary.includes('SYSTEM ALERT') ? 'bg-red-600 text-white' : incident.category === 'Flood' ? 'bg-blue-500/20 text-blue-400' : incident.category === 'Fire' ? 'bg-orange-500/20 text-orange-400' : 'bg-purple-500/20 text-purple-400'}`}>
                  {incident.summary.includes('SYSTEM ALERT') ? 'SYSTEM' : incident.category}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">{incident.timestamp}</span>
              </div>
              <p className={`text-sm font-medium leading-relaxed transition-colors ${incident.summary.includes('SYSTEM ALERT') ? 'text-red-400' : 'text-slate-200 group-hover:text-white'}`}>{incident.summary}</p>
              <div className="mt-4 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1 text-slate-400">
                  <span>📍</span>
                  <span className="truncate w-32 font-medium">{incident.location_context}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${incident.summary.includes('SYSTEM ALERT') ? 'text-red-300 bg-red-900' : incident.urgency > 8 ? 'text-red-400 bg-red-400/10' : 'text-slate-300 bg-slate-700'}`}>
                    {incident.summary.includes('SYSTEM ALERT') ? 'ERR' : `${incident.urgency}/10`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Map View */}
      <main className="flex-1 relative bg-[#0b0f1a] flex items-center justify-center overflow-hidden z-0">
        
        {/* THE NEW LIVE MAP */}
        <LiveMap incidents={incidents} />

        <div className="absolute bottom-8 right-8 flex gap-4 pointer-events-none z-10">
          <div className="bg-slate-900/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-700/50 shadow-2xl pointer-events-auto">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 text-center">Impacted Souls</p>
            <p className="text-3xl font-bold text-blue-400 text-center tabular-nums">{incidents.reduce((acc, curr) => acc + curr.affected_people, 0)}</p>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-700/50 shadow-2xl pointer-events-auto">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 text-center">Open Cases</p>
            <p className="text-3xl font-bold text-orange-400 text-center tabular-nums">{incidents.length.toString().padStart(2, '0')}</p>
          </div>
        </div>
      </main>
    </div>
  );
}