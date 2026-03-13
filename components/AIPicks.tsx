
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, ArrowUpRight, RefreshCw, Heart } from 'lucide-react';
import { GeminiService, AIPickItem } from '../services/geminiService';

const FASHION_SEEDS = [
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1550639525-c97d455acf70?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=800&auto=format&fit=crop"
];

const AIPicks: React.FC = () => {
  const [picks, setPicks] = useState<AIPickItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPicks = async () => {
    setLoading(true);
    try {
      const data = await GeminiService.generateAIPicks();
      setPicks(data);
    } catch (error) {
      console.error("Failed to fetch picks", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPicks();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-rose-gold uppercase tracking-[0.2em] text-xs font-semibold">
            <Sparkles className="w-4 h-4" /> High-Intelligence Curation
          </div>
          <h1 className="text-5xl serif text-white">AI Studio Picks</h1>
          <p className="text-neutral-400 font-light">Exclusive style selections analyzed against current high-fashion indices.</p>
        </div>
        
        <button 
          onClick={fetchPicks}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-full border border-neutral-800 hover:border-rose-gold/50 hover:bg-rose-gold/5 transition-all text-neutral-400 hover:text-rose-gold disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analyzing Trends...' : 'Refresh Studio'}
        </button>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4 opacity-50">
          <Loader2 className="w-12 h-12 text-rose-gold animate-spin" />
          <p className="serif text-xl text-neutral-400">Consulting Digital Stylist...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {picks.map((pick, idx) => (
            <div 
              key={pick.id || idx} 
              className="group glass rounded-[32px] overflow-hidden flex flex-col md:flex-row h-full transition-all duration-500 hover:shadow-2xl hover:shadow-rose-gold/10 hover:-translate-y-1"
            >
              <div className="w-full md:w-1/2 aspect-square relative overflow-hidden bg-neutral-900">
                <img 
                  src={FASHION_SEEDS[idx % FASHION_SEEDS.length]} 
                  alt={pick.name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-[10px] text-rose-gold border border-rose-gold/20 rounded-full font-bold uppercase tracking-widest">
                    {pick.vibe}
                  </span>
                </div>
              </div>
              
              <div className="p-8 flex flex-col justify-between md:w-1/2">
                <div className="space-y-4">
                  <div>
                    <p className="text-rose-gold/60 text-xs font-bold uppercase tracking-widest mb-1">{pick.category}</p>
                    <h3 className="text-2xl serif text-white leading-tight group-hover:text-rose-gold transition-colors">{pick.name}</h3>
                  </div>
                  
                  <p className="text-neutral-400 text-sm font-light leading-relaxed">
                    {pick.description}
                  </p>
                  
                  <div className="pt-4 border-t border-neutral-800/50">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> Synthesis Analysis
                    </p>
                    <p className="text-xs text-neutral-300 italic font-light italic">
                      "{pick.reason}"
                    </p>
                  </div>
                </div>

                <div className="pt-8 flex items-center gap-3">
                  <button className="flex-1 py-3 bg-neutral-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all">
                    View Lookbook <ArrowUpRight className="w-4 h-4" />
                  </button>
                  <button className="p-3 bg-rose-gold/10 text-rose-gold rounded-xl hover:bg-rose-gold hover:text-white transition-all">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIPicks;
