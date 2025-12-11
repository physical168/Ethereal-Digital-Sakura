import * as THREE from 'three';

// Simplex Noise and Curl Noise functions for GLSL
export const noiseChunk = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}

vec3 curlNoise(vec3 p) {
  const float e = 0.1;
  float n1 = snoise(vec3(p.x, p.y + e, p.z));
  float n2 = snoise(vec3(p.x, p.y - e, p.z));
  float n3 = snoise(vec3(p.x, p.y, p.z + e));
  float n4 = snoise(vec3(p.x, p.y, p.z - e));
  float n5 = snoise(vec3(p.x + e, p.y, p.z));
  float n6 = snoise(vec3(p.x - e, p.y, p.z));
  float x = n2 - n1;
  float y = n4 - n3;
  float z = n6 - n5;
  return normalize(vec3(y, z, x));
}
`;

export const sakuraVertexShader = `
uniform float uTime;
uniform float uProgress; // 0.0 to 1.0 (0 = Tree, 1 = Blizzard)
uniform float uSway;     // Global wind intensity

attribute vec3 aRandom; // x: random phase, y: random speed, z: random radius offset
attribute vec3 aCenter; // The original center of the instance

varying vec2 vUv;
varying float vProgress;
varying vec3 vViewPosition;
varying vec3 vNormal;

${noiseChunk}

// Rotation matrix
mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vProgress = uProgress;

  // 1. Original Tree Position Logic (with Wind Sway)
  vec3 treePos = instanceMatrix[3].xyz; 
  
  // Gentle wind sway when attached to tree
  float windWave = sin(uTime * 1.5 + treePos.x * 0.5 + treePos.y * 0.2) * (treePos.y * 0.05);
  vec3 swayedTreePos = treePos + vec3(windWave, 0.0, windWave * 0.5);

  // 2. Blizzard/Explosion Logic
  // Spiral/Vortex math
  float angle = uTime * (0.2 + aRandom.y * 0.5) + aRandom.x * 6.28;
  float radius = 15.0 + aRandom.z * 10.0 + sin(uTime * 0.5) * 5.0;
  
  // Curl noise for organic turbulence
  vec3 noisePos = treePos * 0.1 + vec3(uTime * 0.2, uTime * 0.1, 0.0);
  vec3 turbulence = curlNoise(noisePos) * 10.0;
  
  // Calculate target blizzard position
  vec3 blizzardPos = vec3(
    cos(angle) * radius,
    (aRandom.y - 0.5) * 30.0 + sin(uTime * 0.3) * 5.0, // Vertical spread
    sin(angle) * radius
  ) + turbulence;

  // 3. Mix positions based on uProgress
  // Use a smoothstep curve for nicer transition
  float t = smoothstep(0.0, 1.0, uProgress);
  
  // Delay individual particles slightly based on random attribute for "peeling" effect
  float activation = smoothstep(aRandom.x * 0.3, 1.0, uProgress);
  
  vec3 finalPos = mix(swayedTreePos, blizzardPos, activation);

  // 4. Rotation Logic
  // Rotate the petal itself (local rotation)
  float spinSpeed = 5.0 * activation;
  mat4 localRot = rotationMatrix(vec3(1.0, 1.0, 0.0), uTime * spinSpeed + aRandom.x * 10.0);
  
  vec4 localPosition = localRot * vec4(position, 1.0);
  
  // Move to final position
  vec4 mvPosition = viewMatrix * vec4(finalPos + localPosition.xyz, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const sakuraFragmentShader = `
uniform vec3 uColor1; // Sakura Pink
uniform vec3 uColor2; // Magenta/Purple
uniform float uProgress;

varying vec2 vUv;
varying vec3 vViewPosition;
varying vec3 vNormal;
varying float vProgress;

void main() {
  // Basic Shape Mask (Petal shape)
  float dist = distance(vUv, vec2(0.5));
  // Simple petal shape math
  float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
  float radius = 0.5 * (0.8 + 0.2 * sin(angle * 2.0)); // Bilobed shape approx
  
  // Discard corners
  if (dist > 0.5) discard;

  // Base Color Gradient
  vec3 baseColor = mix(uColor1, uColor2, vUv.y + sin(vUv.x * 10.0) * 0.1);

  // Subsurface Scattering Approximation (Fake SSS)
  // Backlighting effect: High when view vector and light vector align behind object
  vec3 viewDir = normalize(vViewPosition);
  vec3 lightDir = normalize(vec3(0.5, 1.0, 1.0)); // Simulated sun direction
  
  float sss = pow(max(dot(viewDir, -lightDir), 0.0), 2.0) * 0.6;
  float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 3.0);

  // Cyber Glow when flying (uProgress high)
  float glow = uProgress * 2.0;
  
  vec3 finalColor = baseColor + vec3(sss) * 0.8 + vec3(fresnel) * 0.5;
  
  // Add bio-luminescence/energy vein
  float vein = step(0.48, abs(vUv.x - 0.5));
  finalColor += vein * vec3(1.0, 0.8, 0.8) * 0.5;

  gl_FragColor = vec4(finalColor * (1.0 + glow), 1.0);
  
  // Apply a simplified tone mapping helper for bloom trigger
  if (glow > 0.5) {
     gl_FragColor.rgb *= 1.5; 
  }
}
`;

export const trunkVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const trunkFragmentShader = `
uniform vec3 uColor;

varying vec2 vUv;
varying vec3 vNormal;

void main() {
  // Crystal/Glassy look
  vec3 viewDir = normalize(cameraPosition - vNormal); // Approximation
  float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
  
  vec3 col = uColor * 0.2;
  col += vec3(0.1, 0.8, 0.5) * fresnel * 2.0; // Bio-luminescent Green edges
  
  gl_FragColor = vec4(col, 0.9);
}
`;
