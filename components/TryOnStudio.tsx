
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Upload, Camera, Sparkles, Download, Save, ChevronLeft, ChevronRight, RefreshCw, Layers, Grid, AlertCircle, Box, Wind, MousePointer2 } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, MeshDistortMaterial, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { GeminiService } from '../services/geminiService';
import { AIRecommendation, ClothingItem } from '../types';

/* Fix Three.js JSX intrinsic element errors by defining element constants cast to any */
const Group = 'group' as any;
const Mesh = 'mesh' as any;
const PlaneGeometry = 'planeGeometry' as any;
const AmbientLight = 'ambientLight' as any;
const PointLight = 'pointLight' as any;

const isRemoteUrl = (value: string) => /^https?:\/\//i.test(value);

const dataUrlSizeBytes = (dataUrl: string) => {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.ceil((base64.length * 3) / 4);
};

const resizeImage = async (
  dataUrl: string,
  maxSize = 768,
  quality = 0.8,
  maxBytes = 800 * 1024
): Promise<string> => {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const scale = Math.min(1, maxSize / width, maxSize / height);
      let targetW = Math.round(width * scale);
      let targetH = Math.round(height * scale);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to resize image'));
        return;
      }

      const render = (w: number, h: number, q: number) => {
        canvas.width = w;
        canvas.height = h;
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        return canvas.toDataURL('image/jpeg', q);
      };

      let currentQuality = quality;
      let out = render(targetW, targetH, currentQuality);

      while (dataUrlSizeBytes(out) > maxBytes && currentQuality > 0.55) {
        currentQuality -= 0.05;
        out = render(targetW, targetH, currentQuality);
      }

      while (dataUrlSizeBytes(out) > maxBytes && targetW > 420 && targetH > 420) {
        targetW = Math.round(targetW * 0.85);
        targetH = Math.round(targetH * 0.85);
        out = render(targetW, targetH, currentQuality);
      }

      resolve(out);
    };
    img.onerror = () => reject(new Error('Failed to load image for resize'));
    img.src = dataUrl;
  });
};

const toDataUrl = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image (${response.status})`);
  }
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image data'));
    reader.readAsDataURL(blob);
  });
};

// --- Fabric Simulation Component ---
const FabricPhysicsPreview = ({ color = "#B76E79", textureUrl, materialType }: { color?: string, textureUrl?: string, materialType?: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const texture = useMemo(() => {
    if (!textureUrl) return null;
    const loader = new THREE.TextureLoader();
    return loader.load(textureUrl);
  }, [textureUrl]);
  
  // Use Perlin-like noise for wind simulation
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Distort the geometry to simulate fabric waving in wind
    const pos = meshRef.current.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      
      // Calculate displacement based on wave functions
      const wave = Math.sin(x * 2 + time * 2) * 0.1 * (y + 1);
      const wave2 = Math.cos(y * 3 + time * 1.5) * 0.05;
      
      pos.setZ(i, wave + wave2);
    }
    pos.needsUpdate = true;
    
    // Interaction based on pointer
    if (materialRef.current) {
      materialRef.current.distort = THREE.MathUtils.lerp(materialRef.current.distort, 0.4, 0.05);
    }
  });

  const materialProps = useMemo(() => {
    const props: any = {
      color: texture ? "#ffffff" : color,
      map: texture,
      speed: 2,
      distort: 0.3,
      radius: 1,
      metalness: 0.2,
      roughness: 0.8,
      emissive: color,
      emissiveIntensity: 0.05,
      side: THREE.DoubleSide,
    };

    if (materialType?.toLowerCase().includes('silk') || materialType?.toLowerCase().includes('satin')) {
      props.metalness = 0.8;
      props.roughness = 0.1;
      props.emissiveIntensity = 0.2;
    } else if (materialType?.toLowerCase().includes('leather')) {
      props.metalness = 0.4;
      props.roughness = 0.3;
    } else if (materialType?.toLowerCase().includes('denim') || materialType?.toLowerCase().includes('cotton')) {
      props.metalness = 0;
      props.roughness = 1;
    }

    return props;
  }, [color, texture, materialType]);

  return (
    /* Use Group, Mesh, and PlaneGeometry constants instead of lowercase tags to avoid JSX intrinsic element errors */
    <Group position={[0, -0.2, 0]}>
      <Mesh ref={meshRef} rotation={[-0.2, 0, 0]}>
        <PlaneGeometry args={[2.5, 3.5, 32, 32]} />
        <MeshDistortMaterial
          ref={materialRef}
          {...materialProps}
        />
      </Mesh>
    </Group>
  );
};

interface Props {
  onBack: () => void;
  onSave: (result: string) => void;
  collection: ClothingItem[];
  onKeyError: () => void;
  onSelectClothing?: (item: ClothingItem) => void;
}

const TryOnStudio: React.FC<Props> = ({ onBack, onSave, collection, onKeyError, onSelectClothing }) => {
  const [step, setStep] = useState(1);
  const [bodyImage, setBodyImage] = useState<string | null>(null);
  const [clothingImage, setClothingImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recommendations, setRecommendations] = useState<AIRecommendation | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [showCollection, setShowCollection] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [physicsMode, setPhysicsMode] = useState(false);
  const [clothingAnalysis, setClothingAnalysis] = useState<{ primaryColor: string, materialType: string, clothingType: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [processingStage, setProcessingStage] = useState<'analysis' | 'tryon' | null>(null);

  const bodyInputRef = useRef<HTMLInputElement>(null);
  const clothingInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isProcessing || !processingStage) return;
    const cap = processingStage === 'analysis' ? 92 : 99;
    const timer = window.setInterval(() => {
      setProgress((p) => {
        const bump = processingStage === 'analysis' ? 4 : 1.2;
        return Math.min(p + bump + Math.random() * bump, cap);
      });
    }, 220);
    return () => window.clearInterval(timer);
  }, [isProcessing, processingStage]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void, isClothing: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const resized = await resizeImage(base64);
        setter(resized);
        if (isClothing) {
          setIsProcessing(true);
          setErrorMsg(null);
          setProcessingStage('analysis');
          setProgress(10);
          setProgressLabel('Analyzing garment');
          try {
            const analysis = await GeminiService.analyzeClothingFor3D(resized);
            setClothingAnalysis(analysis);
            setPhysicsMode(true);
            if (onSelectClothing) {
              onSelectClothing({
                id: `upload-${Date.now()}`,
                name: 'Custom Upload',
                category: 'Custom',
                imageUrl: resized,
                price: 'Bespoke'
              });
            }
          } catch (err) {
            console.error("Analysis error:", err);
            setErrorMsg("Failed to analyze the garment. Please try another image.");
          } finally {
            setProgress(100);
            setProgressLabel('Ready');
            setProcessingStage(null);
            setIsProcessing(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const processTryOn = async () => {
    if (!bodyImage || !clothingImage) return;
    setIsProcessing(true);
    setErrorMsg(null);
    setProcessingStage('tryon');
    setProgress(5);
    setProgressLabel('Preparing images');
    try {
      const bodyDataRaw = isRemoteUrl(bodyImage) ? await toDataUrl(bodyImage) : bodyImage;
      const clothingDataRaw = isRemoteUrl(clothingImage) ? await toDataUrl(clothingImage) : clothingImage;
      setProgress(25);
      setProgressLabel('Optimizing for speed');
      const bodyData = await resizeImage(bodyDataRaw);
      const clothingData = await resizeImage(clothingDataRaw);
      setProgress(40);
      setProgressLabel('Neural fitting in progress');
      const result = await GeminiService.performVirtualTryOn(bodyData, clothingData);
      setResultImage(result);
      setProgress(95);
      setProgressLabel('Finalizing render');
      
      try {
        GeminiService.getStyleRecommendations(result)
          .then((recs) => setRecommendations(recs))
          .catch((recError) => console.warn("Style recommendations failed, but try-on succeeded:", recError));
      } catch (recError) {
        console.warn("Style recommendations failed, but try-on succeeded:", recError);
      }
      
      setStep(3);
    } catch (error: any) {
      console.error("Try-on Process Error:", error);
      const msg = error?.message || String(error);
      
      if (msg.includes("Requested entity was not found") || msg.includes("API key")) {
        setErrorMsg("API access error. Please re-select your Elite API key.");
        setTimeout(() => onKeyError(), 2000);
      } else {
        setErrorMsg(`Atelier Error: ${msg.split('.')[0]}. Please ensure your images are clear and try again.`);
      }
    } finally {
      setProgress(100);
      setProgressLabel('Complete');
      setProcessingStage(null);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-6 duration-700 min-h-[90vh] flex flex-col">
      <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
        <div className="flex flex-col gap-1">
          <button onClick={onBack} className="flex items-center text-rose-gold gap-2 hover:opacity-70 transition-all group w-fit">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium uppercase tracking-[0.2em] text-xs">Exit Atelier</span>
          </button>
          <h1 className="text-4xl serif text-white mt-2">Elite Fitting Studio</h1>
        </div>

        <div className="flex gap-8 items-center glass px-8 py-4 rounded-full border-rose-gold/10">
          {[
            { id: 1, label: 'Profile' },
            { id: 2, label: 'Wardrobe' },
            { id: 3, label: 'Couture' }
          ].map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 border-2 ${
                  step === s.id ? 'bg-rose-gold border-rose-gold text-white scale-125 shadow-lg shadow-rose-gold/30' : 
                  step > s.id ? 'bg-rose-gold/20 border-rose-gold/40 text-rose-gold' : 'border-neutral-800 text-neutral-600'
                }`}
              >
                {s.id}
              </div>
              <span className={`text-[10px] uppercase tracking-[0.2em] hidden sm:inline ${step >= s.id ? 'text-white' : 'text-neutral-600'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="mb-8 p-6 bg-red-500/10 border border-red-500/30 rounded-3xl flex items-center gap-4 text-red-500 animate-in slide-in-from-top-4 shadow-2xl">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="text-sm font-semibold tracking-wide">{errorMsg}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-10 items-stretch flex-1">
        <div className="lg:col-span-4 space-y-6">
          {step === 1 && (
            <div className="glass p-10 rounded-[40px] border-rose-gold/10 space-y-8 animate-in zoom-in-95 h-full flex flex-col">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-rose-gold/10 rounded-2xl flex items-center justify-center">
                  <Camera className="text-rose-gold w-6 h-6" />
                </div>
                <h2 className="text-3xl font-light serif text-white leading-tight">Digital Profile <br /><span className="text-rose-gold">Calibration</span></h2>
                <p className="text-neutral-500 font-light text-sm leading-relaxed">Our neural engine requires a high-fidelity reference of your silhouette.</p>
              </div>
              
              <div className="relative aspect-[3/4] border border-neutral-800 bg-neutral-900/40 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-rose-gold/40 transition-all cursor-pointer group overflow-hidden" onClick={() => bodyInputRef.current?.click()}>
                {bodyImage ? (
                  <img src={bodyImage} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Body" />
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full border border-neutral-700 flex items-center justify-center group-hover:scale-110 group-hover:border-rose-gold/50 transition-all">
                      <Upload className="text-neutral-500 group-hover:text-rose-gold transition-colors" />
                    </div>
                    <p className="text-neutral-500 text-xs uppercase tracking-widest">Select Reference File</p>
                  </>
                )}
                <input type="file" ref={bodyInputRef} onChange={(e) => handleFileUpload(e, setBodyImage)} className="hidden" accept="image/*" />
              </div>
              
              <button disabled={!bodyImage} onClick={() => setStep(2)} className="w-full py-5 bg-rose-gold text-white rounded-2xl font-bold text-xs uppercase tracking-[0.3em] disabled:opacity-20 hover:bg-rose-gold/90 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-rose-gold/20 mt-auto">
                Next Phase <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="glass p-10 rounded-[40px] border-rose-gold/10 space-y-8 animate-in zoom-in-95 h-full flex flex-col">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-rose-gold/10 rounded-2xl flex items-center justify-center">
                  <Layers className="text-rose-gold w-6 h-6" />
                </div>
                <h2 className="text-3xl font-light serif text-white leading-tight">Couture <br /><span className="text-rose-gold">Selection</span></h2>
                <p className="text-neutral-500 font-light text-sm">Pick from our curated Atelier or upload your own.</p>
              </div>

              {!showCollection ? (
                <div className="space-y-4 flex-1">
                  <div 
                    className="relative aspect-[3/4] border border-neutral-800 bg-neutral-900/40 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-rose-gold/40 transition-all cursor-pointer group overflow-hidden"
                    onClick={() => clothingInputRef.current?.click()}
                  >
                    {clothingImage ? (
                      <img src={clothingImage} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Clothing" />
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full border border-neutral-700 flex items-center justify-center group-hover:scale-110 group-hover:border-rose-gold/50 transition-all">
                          <Upload className="text-neutral-500 group-hover:text-rose-gold transition-colors" />
                        </div>
                        <p className="text-neutral-500 text-xs uppercase tracking-widest">Upload Custom Couture</p>
                      </>
                    )}
                    <input type="file" ref={clothingInputRef} onChange={(e) => handleFileUpload(e, setClothingImage, true)} className="hidden" accept="image/*" />
                  </div>
                  
                  <button 
                    onClick={() => setShowCollection(true)}
                    className="w-full py-4 border border-rose-gold/20 text-rose-gold rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-gold/10 transition-all text-xs font-bold uppercase tracking-widest"
                  >
                    <Grid className="w-4 h-4" /> Pick from Collection
                  </button>
                </div>
              ) : (
                <div className="flex-1 overflow-hidden flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-2 gap-3">
                    {collection.map(item => (
                      <button 
                        key={item.id}
                        onClick={async () => {
                          setShowCollection(false);
                          setIsProcessing(true);
                          setErrorMsg(null);
                          setProcessingStage('analysis');
                          setProgress(10);
                          setProgressLabel('Loading selection');
                          try {
                            const dataUrlRaw = isRemoteUrl(item.imageUrl) ? await toDataUrl(item.imageUrl) : item.imageUrl;
                            const dataUrl = await resizeImage(dataUrlRaw);
                            setClothingImage(dataUrl);
                            if (onSelectClothing) {
                              onSelectClothing({ ...item, imageUrl: dataUrl });
                            }
                            const analysis = await GeminiService.analyzeClothingFor3D(dataUrl);
                            setClothingAnalysis(analysis);
                            setPhysicsMode(true);
                          } catch (err) {
                            console.error("Analysis error:", err);
                            setErrorMsg("Failed to load the selected item. Please try another.");
                          } finally {
                            setProgress(100);
                            setProgressLabel('Ready');
                            setProcessingStage(null);
                            setIsProcessing(false);
                          }
                        }}
                        className={`group relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all ${clothingImage === item.imageUrl ? 'border-rose-gold scale-95 shadow-lg shadow-rose-gold/20' : 'border-transparent hover:border-rose-gold/40'}`}
                      >
                        <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-[8px] text-white uppercase tracking-widest font-bold">Select</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowCollection(false)} className="py-3 text-neutral-500 text-xs uppercase tracking-widest hover:text-white transition-colors">
                    Back to Upload
                  </button>
                </div>
              )}

              <div className="flex gap-4 mt-auto">
                <button onClick={() => setStep(1)} className="flex-1 py-5 border border-neutral-800 text-neutral-500 rounded-2xl hover:bg-neutral-800 transition-all text-xs uppercase tracking-widest font-bold">Prev</button>
                <button 
                  disabled={!clothingImage || isProcessing}
                  onClick={processTryOn}
                  className="flex-[2] py-5 bg-rose-gold text-white rounded-2xl font-bold text-xs uppercase tracking-[0.3em] disabled:opacity-20 hover:bg-rose-gold/90 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-rose-gold/20"
                >
                  {isProcessing ? <><RefreshCw className="w-4 h-4 animate-spin" /> Neural Tailoring...</> : <><Sparkles className="w-4 h-4" /> Finalize Fit</>}
                </button>
              </div>
            </div>
          )}

          {step === 3 && resultImage && (
            <div className="glass p-10 rounded-[40px] border-rose-gold/10 space-y-8 animate-in slide-in-from-left-6 h-full flex flex-col">
              <h2 className="text-3xl font-light serif text-white">Neural Render Complete</h2>
              <div className="space-y-6">
                <div className="p-6 bg-neutral-900/80 rounded-3xl border border-neutral-800/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest">AI Style Confidence</span>
                    <span className="text-rose-gold font-bold text-xs">98.4%</span>
                  </div>
                  <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-gold w-[98.4%]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => onSave(resultImage)} className="py-4 bg-rose-gold/10 border border-rose-gold/30 text-rose-gold rounded-2xl hover:bg-rose-gold hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest">
                    <Save className="w-4 h-4" /> Archive
                  </button>
                  <a href={resultImage} download="atelier-look.png" className="py-4 bg-neutral-800 text-white rounded-2xl hover:bg-neutral-700 transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest">
                    <Download className="w-4 h-4" /> Export
                  </a>
                </div>
              </div>
              <button onClick={() => { setStep(2); setResultImage(null); }} className="w-full py-5 border border-neutral-800 text-neutral-500 rounded-2xl hover:bg-neutral-800 transition-all text-xs font-bold uppercase tracking-widest mt-auto">Modify Outfit</button>
            </div>
          )}
        </div>

        <div className="lg:col-span-8 relative">
          <div className={`h-full glass rounded-[40px] border-rose-gold/10 overflow-hidden relative flex flex-col ${isProcessing ? 'animate-pulse' : ''}`}>
            
            {/* Real-time Fabric Physics Lab View */}
            {physicsMode && step === 2 && clothingImage && !isProcessing && (
              <div className="absolute inset-0 z-20 flex flex-col animate-in fade-in duration-500">
                <div className="flex-1 relative">
                  <Canvas shadows dpr={[1, 2]}>
                    <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
                    <Environment preset="studio" />
                    {/* Use AmbientLight and PointLight constants instead of lowercase to fix JSX intrinsic element errors */}
                    <AmbientLight intensity={0.5} />
                    <PointLight position={[10, 10, 10]} intensity={500} color={clothingAnalysis?.primaryColor || "#B76E79"} />
                    <FabricPhysicsPreview 
                      textureUrl={clothingImage} 
                      color={clothingAnalysis?.primaryColor} 
                      materialType={clothingAnalysis?.materialType}
                    />
                    <ContactShadows opacity={0.4} scale={10} blur={2.5} far={10} resolution={256} color="#000000" />
                  </Canvas>
                  
                  {/* Physics Overlays */}
                  <div className="absolute top-8 left-8 space-y-4 pointer-events-none">
                     <div className="flex items-center gap-3 glass px-4 py-2 rounded-full border-rose-gold/20">
                        <Box className="w-3 h-3 text-rose-gold" />
                        <span className="text-[10px] text-white uppercase tracking-widest font-bold">Fabric Physics Engine: Active</span>
                     </div>
                     <div className="flex items-center gap-3 glass px-4 py-2 rounded-full border-white/5">
                        <Wind className="w-3 h-3 text-neutral-500" />
                        <span className="text-[10px] text-neutral-400 uppercase tracking-widest">Wind Resistance: 0.12 Pa</span>
                     </div>
                     {clothingAnalysis && (
                       <div className="glass px-4 py-3 rounded-2xl border-rose-gold/20 space-y-2 max-w-xs">
                         <p className="text-[9px] text-neutral-500 uppercase tracking-widest">Material & Texture</p>
                         <div className="flex items-center gap-3">
                           <div
                             className="w-5 h-5 rounded-full border border-white/10"
                             style={{ backgroundColor: clothingAnalysis.primaryColor || '#B76E79' }}
                           />
                           <div className="flex flex-col">
                             <span className="text-[11px] text-white uppercase tracking-widest font-semibold">
                               {clothingAnalysis.materialType || 'Unknown material'}
                             </span>
                             <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
                               {clothingAnalysis.clothingType || 'Unknown type'}
                             </span>
                           </div>
                         </div>
                       </div>
                     )}
                  </div>
                  
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 glass px-6 py-3 rounded-2xl border-rose-gold/10 flex items-center gap-4 animate-bounce">
                     <MousePointer2 className="w-4 h-4 text-rose-gold" />
                     <span className="text-[10px] text-neutral-300 uppercase tracking-[0.2em]">Touch to interact with drape</span>
                  </div>
                  
                  <button 
                    onClick={() => setPhysicsMode(false)}
                    className="absolute top-8 right-8 w-12 h-12 glass border-white/10 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
                  >
                    <Grid className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            )}

            {isProcessing && bodyImage && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
                <div className="relative w-full h-full max-w-lg mx-auto p-12 flex flex-col items-center justify-center space-y-8 text-center">
                   <div className="relative w-48 h-48">
                      <div className="absolute inset-0 border-4 border-rose-gold/10 rounded-full" />
                      <div className="absolute inset-0 border-4 border-t-rose-gold rounded-full animate-spin" />
                      <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-rose-gold animate-pulse" />
                   </div>
                   <div className="space-y-4 w-full">
                     <div className="space-y-2">
                       <p className="text-xl serif text-white">
                         {processingStage === 'analysis' ? 'Analyzing Garment' : 'Neural Fitting in Progress'}
                       </p>
                       <p className="text-xs text-neutral-400 uppercase tracking-[0.3em]">
                         {progressLabel || 'Preparing'}
                       </p>
                     </div>
                     <div className="w-full">
                       <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-neutral-500 mb-2">
                         <span>Progress</span>
                         <span className="text-rose-gold font-bold">{Math.round(progress)}%</span>
                       </div>
                       <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                         <div
                           className="h-full bg-rose-gold transition-all duration-300"
                           style={{ width: `${Math.round(progress)}%` }}
                         />
                       </div>
                     </div>
                   </div>
                </div>
              </div>
            )}

            {step === 3 && resultImage ? (
              <div className="flex-1 relative group cursor-crosshair">
                <img src={resultImage} className="w-full h-full object-contain md:object-cover" alt="Elite Result" />
                <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" style={{ width: `${sliderPos}%` }}>
                  <img src={bodyImage!} className="w-[100vw] max-w-none h-full object-contain md:object-cover grayscale brightness-50" alt="Reference" />
                </div>
                <div className="absolute top-0 bottom-0 w-[2px] bg-rose-gold z-30 pointer-events-none shadow-[0_0_15px_rgba(183,110,121,0.8)]" style={{ left: `${sliderPos}%` }}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass border border-rose-gold/40 flex flex-col items-center justify-center gap-1 shadow-2xl">
                    <div className="flex gap-0.5"><div className="w-0.5 h-3 bg-rose-gold/60 rounded-full" /><div className="w-0.5 h-3 bg-rose-gold/60 rounded-full" /><div className="w-0.5 h-3 bg-rose-gold/60 rounded-full" /></div>
                  </div>
                </div>
                <input type="range" min="0" max="100" value={sliderPos} onChange={(e) => setSliderPos(Number(e.target.value))} className="absolute inset-0 opacity-0 cursor-ew-resize z-40" />
                <div className="absolute top-6 left-6 flex gap-3 z-30">
                  <div className="bg-black/50 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 text-[10px] uppercase tracking-widest text-neutral-400">Before</div>
                  <div className="bg-rose-gold/20 backdrop-blur-xl px-4 py-2 rounded-full border border-rose-gold/30 text-[10px] uppercase tracking-widest text-rose-gold">After</div>
                </div>
              </div>
            ) : (
              <div className={`flex-1 flex flex-col items-center justify-center p-20 text-center space-y-8 relative overflow-hidden ${physicsMode && step === 2 ? 'invisible' : ''}`}>
                <div className="absolute inset-0 pointer-events-none"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-to-br from-rose-gold/5 via-transparent to-transparent rotate-12" /></div>
                <div className="relative"><div className="w-32 h-32 rounded-[40px] border border-rose-gold/20 flex items-center justify-center relative group"><div className="absolute inset-0 bg-rose-gold/5 blur-3xl rounded-full scale-150 animate-pulse" /><Sparkles className="w-12 h-12 text-rose-gold/40 group-hover:text-rose-gold transition-colors duration-700" /></div></div>
                <div className="space-y-4 max-w-sm relative">
                  <h3 className="text-2xl serif text-white">Awaiting Calibration</h3>
                  <p className="text-neutral-500 font-light text-sm leading-relaxed">Complete the profile and couture selection to initiate the elite neural fitting engine.</p>
                </div>
              </div>
            )}

            {step === 3 && recommendations && (
              <div className="absolute right-6 bottom-6 w-80 glass p-6 rounded-[32px] border-rose-gold/20 animate-in slide-in-from-right-10 z-30 shadow-2xl">
                 <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-gold/10 flex items-center justify-center"><Sparkles className="text-rose-gold w-4 h-4" /></div>
                      <h4 className="serif text-white text-lg">AI Style Analysis</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Complimentary Hues</p>
                        <div className="flex flex-wrap gap-2">{recommendations.colorSuggestions.map((c, i) => (<span key={i} className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-[10px] text-neutral-300">{c}</span>))}</div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Occasion Fit</p>
                        <p className="text-xs text-rose-gold italic">"{recommendations.occasionTips}"</p>
                      </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TryOnStudio;
