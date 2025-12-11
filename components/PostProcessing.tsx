import React from 'react';
import { EffectComposer, Bloom, DepthOfField, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

const PostProcessing = () => {
  return (
    <EffectComposer disableNormalPass>
      <DepthOfField 
        focusDistance={0} 
        focalLength={0.02} 
        bokehScale={5} 
        height={480} 
      />
      <Bloom 
        luminanceThreshold={0.4} 
        luminanceSmoothing={0.9} 
        height={300} 
        intensity={1.5} 
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL} // Use NORMAL to see the effect
        offset={new THREE.Vector2(0.002, 0.002)}
      />
      <Vignette eskil={false} offset={0.1} darkness={1.1} />
    </EffectComposer>
  );
};

export default PostProcessing;
