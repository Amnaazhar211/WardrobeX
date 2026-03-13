
import React, { useState, useEffect, useRef } from 'react';
import StoreScene from './components/StoreScene';
import Auth from './components/Auth';
import TryOnStudio from './components/TryOnStudio';
import Dashboard from './components/Dashboard';
import AIPicks from './components/AIPicks';
import Profile from './components/Profile';
import { User, ViewState, ClothingItem } from './types';
import { Shirt, Sparkles, Heart, User as UserIcon, LogOut, ArrowUpRight, Crown, Key, RefreshCw, ExternalLink } from 'lucide-react';
import { SAMPLE_CLOTHING } from './constants';
import { Canvas } from '@react-three/fiber';
import { Float, Sparkles as SparkleEffect, Environment, useTexture } from '@react-three/drei';

const Group = 'group' as any;
const Mesh = 'mesh' as any;
const CylinderGeometry = 'cylinderGeometry' as any;
const MeshStandardMaterial = 'meshStandardMaterial' as any;
const CapsuleGeometry = 'capsuleGeometry' as any;
const AmbientLight = 'ambientLight' as any;
const PointLight = 'pointLight' as any;
const TorusGeometry = 'torusGeometry' as any;

const HeroDressModel = ({ clothing }: { clothing?: ClothingItem | null }) => {
  const meshRef = useRef<any>(null);
  const ringRef = useRef<any>(null);
  const texture = clothing?.imageUrl ? useTexture(clothing.imageUrl) : null;

  return (
    <Float speed={3} rotationIntensity={0.5} floatIntensity={1}>
      <Group ref={meshRef}>
        <Mesh position={[0, 0.4, 0]} castShadow>
          <CapsuleGeometry args={[0.22, 0.7, 16, 32]} />
          <MeshStandardMaterial 
            color={texture ? "#ffffff" : "#B76E79"} 
            map={texture}
            metalness={texture ? 0.2 : 1} 
            roughness={texture ? 0.8 : 0.1} 
            emissive="#B76E79" 
            emissiveIntensity={0.1} 
          />
        </Mesh>
        <Mesh position={[0, -0.6, 0]} castShadow>
          <CylinderGeometry args={[0.35, 0.7, 1.4, 64]} />
          <MeshStandardMaterial 
            color={texture ? "#ffffff" : "#B76E79"} 
            map={texture}
            metalness={texture ? 0.2 : 1} 
            roughness={texture ? 0.8 : 0.1} 
            emissive="#B76E79" 
            emissiveIntensity={0.05} 
          />
        </Mesh>
        <Group rotation={[Math.PI / 6, 0, 0]}>
          <Mesh ref={ringRef}>
            <TorusGeometry args={[1.1, 0.005, 16, 100]} />
            <MeshStandardMaterial color="#B76E79" emissive="#B76E79" emissiveIntensity={1} transparent opacity={0.5} />
          </Mesh>
        </Group>
        <Mesh position={[0, 0, 0]} scale={[1.2, 1.2, 1.2]}>
           <CapsuleGeometry args={[0.3, 1.5, 4, 16]} />
           <MeshStandardMaterial color="#B76E79" transparent opacity={0.05} wireframe />
        </Mesh>
        <SparkleEffect count={60} scale={2.5} size={2} speed={0.8} color="#B76E79" />
      </Group>
    </Float>
  );
};

const HeroDressPreview = ({ clothing }: { clothing?: ClothingItem | null }) => {
  return (
    <div className="w-80 h-96 mb-4 z-10">
      <Canvas camera={{ position: [0, 0, 5], fov: 40 }} dpr={[1, 2]}>
        <Environment preset="city" />
        <AmbientLight intensity={0.4} />
        <PointLight position={[10, 10, 10]} intensity={500} color={clothing?.price === 'Bespoke' ? '#B76E79' : '#ffffff'} />
        <React.Suspense fallback={null}>
          <HeroDressModel clothing={clothing} />
        </React.Suspense>
      </Canvas>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('AUTH');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(true);
  
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>(SAMPLE_CLOTHING);
  const [selectedClothing, setSelectedClothing] = useState<ClothingItem | null>(SAMPLE_CLOTHING[0]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    // Debug log to check all Vite environment variables
    console.log('ALL VITE ENV:', import.meta.env);
    console.log('VITE_GEMINI_API_KEY:', (import.meta as any).env?.VITE_GEMINI_API_KEY);
    const checkKey = async () => {
      // Priority 1: Check if GEMINI_API_KEY is already in the environment (Free/Platform key)
      if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
        setHasApiKey(true);
        setIsCheckingKey(false);
        return;
      }
      if (typeof import.meta !== 'undefined' && (import.meta as any).env && (((import.meta as any).env as any).VITE_GEMINI_API_KEY || ((import.meta as any).env as any).VITE_API_KEY)) {
        setHasApiKey(true);
        setIsCheckingKey(false);
        return;
      }

      // Priority 2: Check for selected paid key via AI Studio dialog
      if ((window as any).aistudio) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } else {
        // Fallback for local development
        setHasApiKey(typeof process !== 'undefined' && process.env ? !!process.env.API_KEY : false);
      }
      setIsCheckingKey(false);
    };
    checkKey();
  }, []);

  const handleOpenKeySelection = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  useEffect(() => {
    if (user && view === 'AUTH') {
      setView('HOME');
    }
  }, [user, view]);

  const handleLogout = () => {
    setUser(null);
    setView('AUTH');
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const deleteItem = (id: string) => {
    setWardrobe(prev => prev.filter(item => item.id !== id));
    setFavorites(prev => prev.filter(f => f !== id));
  };

  const handleSaveTryOn = (resultImageUrl: string) => {
    const newItem: ClothingItem = {
      id: `saved-${Date.now()}`,
      name: `Atelier Creation ${history.length + 1}`,
      category: 'Virtual Try-On',
      imageUrl: resultImageUrl,
      price: 'Bespoke'
    };
    setWardrobe(prev => [newItem, ...prev]);
    setHistory(prev => [resultImageUrl, ...prev]);
  };

  if (isCheckingKey) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <RefreshCw className="w-12 h-12 text-rose-gold animate-spin" />
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md w-full glass p-12 rounded-[40px] border-rose-gold/20 text-center space-y-8 animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 bg-rose-gold/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Key className="text-rose-gold w-10 h-10" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl serif text-white">Unlock High-Couture AI</h1>
            <p className="text-neutral-400 font-light text-sm leading-relaxed">
              To provide cinematic-quality virtual fittings, WardrobeX requires a paid Google Gemini API key. 
              Please connect your key to enter the atelier.
            </p>
            <div className="pt-2">
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[10px] text-rose-gold hover:text-white transition-colors uppercase tracking-widest font-bold border-b border-rose-gold/30 pb-1"
              >
                Billing Documentation <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <button 
            onClick={handleOpenKeySelection}
            className="w-full py-5 bg-rose-gold text-white rounded-2xl font-bold text-xs uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-rose-gold/20"
          >
            Connect API Key
          </button>
        </div>
      </div>
    );
  }

  if (view === 'AUTH') {
    return <Auth onLogin={setUser} />;
  }

  const renderContent = () => {
    switch (view) {
      case 'HOME':
        return (
          <div className="relative w-full h-screen overflow-hidden">
            <StoreScene />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/60 via-transparent to-black/90" />
            <div className="absolute inset-0 flex flex-col justify-end px-8 md:px-20 pb-20 pointer-events-none">
              <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row md:items-end justify-between gap-12">
                <div className="space-y-8 animate-in slide-in-from-left-12 duration-1000 delay-300">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-[1px] bg-rose-gold" />
                     <span className="text-rose-gold uppercase tracking-[0.5em] text-[10px] font-bold">The Paradigm of Virtual Couture</span>
                  </div>
                  <h2 className="text-7xl md:text-9xl font-light serif text-white leading-[0.9] flex flex-col">
                    <span>VIRTUAL</span>
                    <span className="text-rose-gold italic md:ml-24">PRESENCE</span>
                  </h2>
                  <p className="text-neutral-400 font-light max-w-lg text-lg leading-relaxed md:ml-1">
                    Enter the digital atelier. We bridge the gap between imagination and fit with our industry-leading Neural Try-On™ technology.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4 pointer-events-auto animate-in slide-in-from-right-12 duration-1000 delay-500">
                  <HeroDressPreview clothing={selectedClothing} />
                  <button 
                    onClick={() => setView('STUDIO')}
                    className="group relative px-10 py-5 bg-rose-gold text-white rounded-full font-bold text-xs uppercase tracking-[0.3em] overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(183,110,121,0.4)] w-full md:w-auto"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <span className="relative flex items-center justify-center gap-3">
                      Enter Fitting Room <Sparkles className="w-4 h-4" />
                    </span>
                  </button>
                  <button 
                    onClick={() => setView('WARDROBE')}
                    className="group px-10 py-5 border border-white/20 text-white rounded-full font-bold text-xs uppercase tracking-[0.3em] backdrop-blur-md hover:bg-white hover:text-black transition-all w-full md:w-auto"
                  >
                    <span className="flex items-center justify-center gap-3">
                      View Collection <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
            <div className="absolute top-32 left-8 md:left-20 animate-in fade-in duration-1000 delay-1000">
               <div className="glass px-4 py-2 rounded-full border-white/10 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-rose-gold animate-pulse" />
                  <span className="text-[10px] uppercase tracking-widest text-neutral-300 font-bold">Atelier Status: Online</span>
               </div>
            </div>
          </div>
        );
      case 'STUDIO':
        return (
          <TryOnStudio 
            collection={wardrobe}
            onBack={() => setView('HOME')} 
            onSave={handleSaveTryOn} 
            onKeyError={() => setHasApiKey(false)}
            onSelectClothing={setSelectedClothing}
          />
        );
      case 'WARDROBE':
      case 'FAVORITES':
        return (
          <Dashboard 
            items={wardrobe} 
            favorites={favorites} 
            history={history}
            onToggleFavorite={toggleFavorite}
            onDelete={deleteItem}
            onSelectItem={(item) => {
              setSelectedClothing(item);
              setView('HOME');
            }}
          />
        );
      case 'PICKS':
        return <AIPicks />;
      case 'PROFILE':
        return user ? (
          <Profile user={user} onLogout={handleLogout} stats={{ looks: history.length, wardrobe: wardrobe.length }} />
        ) : null;
      default:
        return <div className="p-20 text-center text-white">Feature coming soon in Next Generation update.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-charcoal text-ivory">
      <header className="fixed top-8 left-0 w-full z-50 px-8 md:px-20 pointer-events-none">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <button onClick={() => setView('HOME')} className="flex items-center gap-3 text-rose-gold group pointer-events-auto">
            <div className="w-12 h-12 glass border-rose-gold/20 rounded-2xl flex items-center justify-center group-hover:bg-rose-gold group-hover:text-white transition-all duration-500 shadow-2xl">
              <Crown className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl serif tracking-[0.3em] leading-none">WARDROBEX</span>
              <span className="text-[8px] uppercase tracking-[0.5em] text-neutral-500">Elite Couture AI</span>
            </div>
          </button>
          <nav className="hidden md:flex items-center gap-2 pointer-events-auto glass p-2 rounded-full border-white/5 backdrop-blur-2xl shadow-2xl">
            <NavBtn icon={<Shirt className="w-4 h-4" />} label="Studio" active={view === 'STUDIO'} onClick={() => setView('STUDIO')} />
            <NavBtn icon={<Heart className="w-4 h-4" />} label="Atelier" active={view === 'WARDROBE' || view === 'FAVORITES'} onClick={() => setView('WARDROBE')} />
            <NavBtn icon={<Sparkles className="w-4 h-4" />} label="Intelligence" active={view === 'PICKS'} onClick={() => setView('PICKS')} />
            <NavBtn icon={<UserIcon className="w-4 h-4" />} label="Identity" active={view === 'PROFILE'} onClick={() => setView('PROFILE')} />
            <div className="w-px h-6 bg-white/10 mx-2" />
            <button onClick={handleLogout} className="p-3 text-neutral-500 hover:text-rose-gold transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </header>
      <main className={`min-h-screen ${view === 'HOME' ? 'pt-0' : 'pt-32'}`}>
        {renderContent()}
      </main>
      <div className="fixed inset-0 pointer-events-none z-[60] border-[1px] border-white/5 m-4 rounded-[40px] shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
    </div>
  );
};

interface NavBtnProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavBtn: React.FC<NavBtnProps> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all text-xs font-bold uppercase tracking-[0.2em] whitespace-nowrap group ${active ? 'bg-rose-gold text-white shadow-xl shadow-rose-gold/30 scale-105' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}>
    <span className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>{icon}</span>
    <span className="hidden lg:inline">{label}</span>
  </button>
);

export default App;
