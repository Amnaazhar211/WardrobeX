import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  PerspectiveCamera, 
  Float, 
  Text, 
  ContactShadows,
  MeshReflectorMaterial,
  Sparkles
} from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { X, Search } from 'lucide-react';

const Group = 'group' as any;
const Mesh = 'mesh' as any;
const CylinderGeometry = 'cylinderGeometry' as any;
const MeshStandardMaterial = 'meshStandardMaterial' as any;
const CapsuleGeometry = 'capsuleGeometry' as any;
const MeshBasicMaterial = 'meshBasicMaterial' as any;
const BoxGeometry = 'boxGeometry' as any;
const PlaneGeometry = 'planeGeometry' as any;
const RectAreaLight = 'rectAreaLight' as any;
const AmbientLight = 'ambientLight' as any;
const SpotLight = 'spotLight' as any;
const PointLight = 'pointLight' as any;

const Mannequin = ({ position, rotation, color = "#F5F5F1", onInspect }: { 
  position: [number, number, number], 
  rotation: [number, number, number], 
  color?: string,
  onInspect: (pos: [number, number, number]) => void 
}) => {
  return (
    <Group 
      position={position} 
      rotation={rotation} 
      onClick={(e: any) => {
        e.stopPropagation();
        onInspect(position);
      }}
    >
      <Mesh position={[0, -0.05, 0]}>
        <CylinderGeometry args={[0.3, 0.35, 0.05, 32]} />
        <MeshStandardMaterial color="#050505" metalness={1} roughness={0.1} />
      </Mesh>
      <Mesh position={[0, 0.8, 0]}>
        <CylinderGeometry args={[0.015, 0.015, 1.6, 12]} />
        <MeshStandardMaterial color="#B76E79" metalness={1} roughness={0} />
      </Mesh>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <Mesh position={[0, 1.4, 0]}>
          <CapsuleGeometry args={[0.22, 0.5, 8, 24]} />
          <MeshStandardMaterial color={color} metalness={0.2} roughness={0.7} />
        </Mesh>
        <Mesh position={[0, 1.4, 0]} scale={[1.1, 1.1, 1.1]}>
          <CapsuleGeometry args={[0.22, 0.5, 8, 24]} />
          <MeshBasicMaterial color="#B76E79" transparent opacity={0.05} wireframe />
        </Mesh>
      </Float>
    </Group>
  );
};

const DisplayPedestal = ({ position }: { position: [number, number, number] }) => (
  <Group position={position}>
    <Mesh position={[0, 0.25, 0]}>
      <BoxGeometry args={[1.5, 0.5, 1.5]} />
      <MeshStandardMaterial color="#080808" metalness={0.9} roughness={0.1} />
    </Mesh>
    <Mesh position={[0, 0.51, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <PlaneGeometry args={[1.4, 1.4]} />
      <MeshStandardMaterial color="#B76E79" emissive="#B76E79" emissiveIntensity={0.5} />
    </Mesh>
  </Group>
);

const LuxuryRoom = () => (
  <Group>
    <Mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <PlaneGeometry args={[100, 100]} />
      <MeshReflectorMaterial
        blur={[400, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={60}
        roughness={1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#0a0a0a"
        metalness={0.8}
        mirror={1}
      />
    </Mesh>
    <Mesh position={[0, 5, -12]}>
      <PlaneGeometry args={[40, 15]} />
      <MeshStandardMaterial color="#050505" />
    </Mesh>
    {[-8, -4, 0, 4, 8].map((x) => (
      <Mesh key={x} position={[x, 5, -11.9]}>
        <BoxGeometry args={[0.05, 10, 0.1]} />
        <MeshStandardMaterial color="#B76E79" metalness={1} roughness={0.1} />
      </Mesh>
    ))}
    <Group position={[0, 8, -5]}>
      <RectAreaLight width={20} height={0.5} intensity={5} color="#B76E79" rotation={[-Math.PI / 2, 0, 0]} />
    </Group>
  </Group>
);

const StoreScene: React.FC = () => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const controlsRef = useRef<any>(null);
  const [zoomedPos, setZoomedPos] = useState<[number, number, number] | null>(null);

  const handleInspect = (pos: [number, number, number]) => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    setZoomedPos(pos);
    
    // Animate camera and controls target
    gsap.to(controlsRef.current.target, {
      x: pos[0],
      y: pos[1] + 1.4,
      z: pos[2],
      duration: 2,
      ease: 'power3.inOut'
    });
    
    gsap.to(cameraRef.current.position, {
      x: pos[0],
      y: pos[1] + 1.8,
      z: pos[2] + 2.5,
      duration: 2,
      ease: 'power3.inOut'
    });
  };

  const resetZoom = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    setZoomedPos(null);
    
    gsap.to(controlsRef.current.target, { x: 0, y: 0, z: 0, duration: 2, ease: 'power3.inOut' });
    gsap.to(cameraRef.current.position, { x: 0, y: 2, z: 8, duration: 2, ease: 'power3.inOut' });
  };

  useEffect(() => {
    if (cameraRef.current) {
      gsap.fromTo(
        cameraRef.current.position,
        { x: -10, y: 8, z: 20 },
        { x: 0, y: 2, z: 8, duration: 4, ease: 'power3.inOut' }
      );
    }
  }, []);

  return (
    <div className="w-full h-full absolute inset-0 z-0 bg-[#050505]">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 2, 10]} fov={45} />
        <OrbitControls 
          ref={controlsRef}
          enableZoom={true} 
          maxPolarAngle={Math.PI / 2.05} 
          minPolarAngle={Math.PI / 4}
          autoRotate={!zoomedPos}
          autoRotateSpeed={0.3}
          enableDamping
        />
        
        <Environment preset="city" />
        <AmbientLight intensity={0.2} />
        <SpotLight position={[10, 15, 10]} angle={0.25} penumbra={1} intensity={1500} castShadow shadow-bias={-0.0001} />
        <PointLight position={[-10, 5, -5]} intensity={500} color="#B76E79" />
        
        <LuxuryRoom />
        
        <Mannequin position={[-4.5, 0, -6]} rotation={[0, 0.6, 0]} color="#F5F5F1" onInspect={handleInspect} />
        <Mannequin position={[-3.5, 0, -8]} rotation={[0, 0.3, 0]} color="#E0E0E0" onInspect={handleInspect} />
        <DisplayPedestal position={[0, 0, -5]} />
        <Mannequin position={[0, 0.5, -5]} rotation={[0, 0, 0]} color="#ffffff" onInspect={handleInspect} />
        <Mannequin position={[4.5, 0, -6]} rotation={[0, -0.6, 0]} color="#F5F5F1" onInspect={handleInspect} />
        <Mannequin position={[3.5, 0, -8]} rotation={[0, -0.3, 0]} color="#E0E0E0" onInspect={handleInspect} />

        <Sparkles count={100} scale={15} size={1} speed={0.4} color="#B76E79" opacity={0.2} />
        <ContactShadows opacity={0.6} scale={30} blur={2.5} far={10} resolution={512} color="#000000" />
        
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <Text
            font="https://fonts.gstatic.com/s/cormorantgaramond/v16/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYpHtK.woff"
            fontSize={0.8}
            position={[0, 4.5, -10]}
            color="#B76E79"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.1}
          >
            THE ATELIER
          </Text>
        </Float>
      </Canvas>

      {/* Fabric Zoom Detail Overlay */}
      {zoomedPos && (
        <div className="absolute top-1/2 right-12 -translate-y-1/2 w-80 glass p-8 rounded-[40px] border-rose-gold/20 animate-in slide-in-from-right-10 pointer-events-auto">
          <button onClick={resetZoom} className="absolute top-6 right-6 p-2 text-neutral-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Search className="text-rose-gold w-4 h-4" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-rose-gold font-bold">Fabric Inspection</span>
            </div>
            
            <div className="space-y-2">
              <h3 className="serif text-2xl text-white">Italian Silk Organza</h3>
              <p className="text-xs text-neutral-400 font-light leading-relaxed">
                Hand-woven in the Como region, this ultra-fine silk features a structured yet ethereal finish with a soft pearlescent sheen.
              </p>
            </div>

            <div className="aspect-square rounded-3xl overflow-hidden border border-white/5 relative">
              <img 
                src="https://images.unsplash.com/photo-1549439602-43ebca2327af?q=80&w=400&auto=format&fit=crop" 
                className="w-full h-full object-cover scale-150" 
                alt="Fabric Detail" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[8px] text-neutral-500 uppercase tracking-widest mb-1">Drape Index</p>
                <p className="text-xs text-white">Elite Structure</p>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[8px] text-neutral-500 uppercase tracking-widest mb-1">Reflectivity</p>
                <p className="text-xs text-white">92% Satin</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!zoomedPos && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 px-6 py-3 glass rounded-full border-rose-gold/10 pointer-events-none animate-pulse">
          <p className="text-[10px] text-neutral-500 uppercase tracking-[0.4em] font-medium flex items-center gap-3">
             <Search className="w-3 h-3" /> Select Mannequin to inspect textures
          </p>
        </div>
      )}
    </div>
  );
};

export default StoreScene;