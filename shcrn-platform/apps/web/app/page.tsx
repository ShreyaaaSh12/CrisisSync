"use client";

import { useState } from "react";
import { MOCK_INCIDENTS as initialData, Incident } from "../lib/mock-data";

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>(initialData);
  const [isUploading, setIsUploading] = useState(false);
  
  // NEW: State for our manual entry form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [manualText, setManualText] = useState("");

  // The central function to send ANY file to the AI
  const processWithAI = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/extract-incident", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("AI Service is offline.");

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
      
      // Close and clear the form on success
      setIsFormOpen(false);
      setManualText("");

    } catch (error) {
      console.error("Connection Error:", error);
      alert("Error: Could not reach the AI Service.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handler for traditional file uploads (Images/Existing Docs)
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processWithAI(file);
    event.target.value = ""; // reset input
  };

  // NEW: Handler for manual text entry
  const handleManualSubmit = () => {
    if (!manualText.trim()) return;
    
    // The Trick: Convert typed text into a virtual .txt file in memory!
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
          
          {/* NEW: The Interactive Input Area */}
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
                placeholder="Type dispatch details here... (e.g., '12 trapped in factory fire on 5th street')"
                className="w-full bg-slate-900 text-sm p-3 rounded-lg border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none h-24 mb-3 placeholder:text-slate-600"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                disabled={isUploading}
              />
              
              <div className="flex gap-2">
                {/* Submit Text Button */}
                <button 
                  onClick={handleManualSubmit}
                  disabled={isUploading || !manualText.trim()}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 transition-all ${
                    isUploading || !manualText.trim() ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg'
                  }`}
                >
                  {isUploading ? "🤖 ANALYZING..." : "SEND TO AI"}
                </button>

                {/* Upload Image/File Button */}
                <label className={`px-4 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                  isUploading ? 'bg-slate-700 text-slate-500' : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}>
                  📁 FILE
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} accept="image/*,text/plain" />
                </label>
                
                {/* Cancel Button */}
                <button 
                  onClick={() => setIsFormOpen(false)}
                  disabled={isUploading}
                  className="px-3 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Incident List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {incidents.map((incident) => (
            <div key={incident.id} className={`p-4 rounded-xl border transition-all hover:border-slate-500 group ${incident.urgency > 8 ? 'border-red-500/40 bg-red-500/5 hover:bg-red-500/10' : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'}`}>
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${incident.category === 'Flood' ? 'bg-blue-500/20 text-blue-400' : incident.category === 'Fire' ? 'bg-orange-500/20 text-orange-400' : 'bg-purple-500/20 text-purple-400'}`}>
                  {incident.category}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">{incident.timestamp}</span>
              </div>
              <p className="text-sm font-medium leading-relaxed text-slate-200 group-hover:text-white transition-colors">{incident.summary}</p>
              <div className="mt-4 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1 text-slate-400">
                  <span>📍</span>
                  <span className="truncate w-32 font-medium">{incident.location_context}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${incident.urgency > 8 ? 'text-red-400 bg-red-400/10' : 'text-slate-300 bg-slate-700'}`}>
                    {incident.urgency}/10
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Map View Placeholder */}
      <main className="flex-1 relative bg-[#0b0f1a] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        <div className="text-center relative z-10 px-6">
          <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20 shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)]">
            <span className="text-4xl animate-pulse">🛰️</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Geospatial Intelligence Layer</h2>
          <p className="text-slate-400 text-sm mt-3 max-w-sm mx-auto leading-relaxed">
            Real-time satellite tracking and coordinate mapping. <br/>
            Waiting for PostGIS database synchronization...
          </p>
        </div>
        <div className="absolute bottom-8 right-8 flex gap-4">
          <div className="bg-slate-900/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-700/50 shadow-2xl">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 text-center">Impacted Souls</p>
            <p className="text-3xl font-bold text-blue-400 text-center tabular-nums">{incidents.reduce((acc, curr) => acc + curr.affected_people, 0)}</p>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-700/50 shadow-2xl">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 text-center">Open Cases</p>
            <p className="text-3xl font-bold text-orange-400 text-center tabular-nums">{incidents.length.toString().padStart(2, '0')}</p>
          </div>
        </div>
      </main>
    </div>
  );
}