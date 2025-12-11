import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import SakuraTree from './components/SakuraTree';
import PostProcessing from './components/PostProcessing';
import * as THREE from 'three';

// UI Overlay Component
const Overlay = () => (
  <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-8 text-white z-10">
    <div className="flex flex-col items-start">
      <h1 className="text-4xl md:text-6xl font-bold font-serif tracking-wider" style={{ fontFamily: '"Cinzel", serif', textShadow: '0 0 20px rgba(255, 183, 197, 0.8)' }}>
        Ethereal Sakura
      </h1>
      <h2 className="text-xl md:text-2xl mt-2 text-pink-200 font-light tracking-widest opacity-80" style={{ fontFamily: '"Zen Maru Gothic", sans-serif' }}>
        灵境·纷飞樱花
      </h2>
    </div>

    <div className="flex flex-col items-center justify-center opacity-70 mb-10">
      <div className="flex items-center gap-10">
        <div className="text-center group">
          <div className="w-16 h-1 bg-gradient-to-l from-pink-500 to-transparent mb-2 transition-all duration-500 group-hover:w-24"></div>
          <p className="text-sm font-light tracking-widest">DRAG LEFT</p>
          <p className="text-xs text-pink-300">DECONSTRUCT</p>
        </div>
        
        <div className="w-[1px] h-12 bg-white/30"></div>

        <div className="text-center group">
          <div className="w-16 h-1 bg-gradient-to-r from-pink-500 to-transparent mb-2 transition-all duration-500 group-hover:w-24"></div>
          <p className="text-sm font-light tracking-widest">DRAG RIGHT</p>
          <p className="text-xs text-pink-300">RECONSTRUCT</p>
        </div>
      </div>
    </div>
  </div>
);

// Background Gradient Plane
const Background = () => {
  return (
    <mesh position={[0, 0, -50]} scale={[200, 200, 1]}>
      <planeGeometry />
      <meshBasicMaterial 
        color="#0f2027" // Chitose Green-ish dark base
        depthWrite={false}
      >
      </meshBasicMaterial>
    </mesh>
  );
}

const App: React.FC = () => {
  const [progress, setProgress] = useState(0); // 0 = Tree, 1 = Blizzard
  const dragStartRef = useRef<number | null>(null);
  const currentProgressRef = useRef(0);

  // Simple Drag Logic (Platform agnostic)
  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartRef.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartRef.current === null) return;
    
    const delta = e.clientX - dragStartRef.current;
    const sensitivity = 0.005; // Adjust sensitivity
    
    // If dragging LEFT (negative delta), we want to increase progress (Explode)
    // If dragging RIGHT (positive delta), we want to decrease progress (Reconstruct)
    let newProgress = currentProgressRef.current - delta * sensitivity;
    
    // Clamp 0 to 1
    newProgress = Math.max(0, Math.min(1, newProgress));
    
    setProgress(newProgress);
  };

  const handlePointerUp = () => {
    // When releasing, update the ref to the current state so next drag continues smoothly
    currentProgressRef.current = progress;
    dragStartRef.current = null;
  };

  // Sync state ref
  useEffect(() => {
    currentProgressRef.current = progress;
  }, [progress]);

  return (
    <div 
      className="relative w-full h-screen bg-[#0f2027] overflow-hidden select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <Overlay />
      
      <Canvas 
        dpr={[1, 2]} 
        gl={{ 
          antialias: false, 
          toneMapping: THREE.ReinhardToneMapping, 
          toneMappingExposure: 1.0 // Reduced from 1.5
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 40]} fov={45} />
        
        <Suspense fallback={null}>
          <color attach="background" args={['#0f2027']} />
          
          {/* Lighting: Cyber Zen Atmosphere */}
          <ambientLight intensity={0.2} color="#001133" />
          <spotLight position={[10, 20, 10]} angle={0.5} penumbra={1} intensity={1.5} color="#FFB7C5" />
          <pointLight position={[-10, 5, -10]} intensity={1} color="#00ffcc" distance={20} />
          
          {/* Main 3D Elements */}
          <group position={[0, -5, 0]}>
            <SakuraTree progress={progress} />
          </group>

          {/* Environment Particles */}
          <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
          
          {/* Post Processing */}
          <PostProcessing />
          
          {/* Background Gradient Mesh (optional, or use css) */}
          <fog attach="fog" args={['#0f2027', 10, 80]} />
        </Suspense>

        {/* Camera Controls - restricted for cinematic feel */}
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          minDistance={10} 
          maxDistance={60} 
          maxPolarAngle={Math.PI / 2}
          autoRotate={progress < 0.1} // Auto rotate when tree is formed
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};

export default App;
