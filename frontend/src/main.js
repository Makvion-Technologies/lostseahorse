import './styles.css';
import * as THREE from 'three';

const root = document.querySelector('#app');

root.innerHTML = `
  <canvas id="ocean-canvas" aria-hidden="true"></canvas>
  <div class="page-shell" id="top">
    <header class="nav">
      <div class="brand">
        <div class="brand-mark">LS</div>
        <div>
          <div class="brand-name">Lost Seahorse</div>
          <div class="brand-sub">Immersive ocean adventures</div>
        </div>
      </div>
      <nav class="nav-links">
        <a href="#features">World</a>
        <a href="#modes">Modes</a>
        <a href="#community">Community</a>
        <a class="pill" href="/game.html">Play Now</a>
      </nav>
    </header>

    <main>
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">Dive into the bioluminescent blue</p>
          <h1>Explore a living ocean sculpted in 3D.</h1>
          <p class="lede">Glide with rays, weave through coral cathedrals, and follow the lost seahorse in a world that reacts to every ripple.</p>
          <div class="cta-row">
            <a class="cta primary" href="/game.html">Play Now</a>
            <a class="cta ghost" href="#features">Preview the world</a>
          </div>
          <div class="hero-metrics">
            <div class="metric"><span class="metric-value">+120</span><span class="metric-label">Dynamic reefs</span></div>
            <div class="metric"><span class="metric-value">4K</span><span class="metric-label">Underwater vistas</span></div>
            <div class="metric"><span class="metric-value">Live</span><span class="metric-label">Tidal weather</span></div>
          </div>
        </div>
        <div class="hero-card">
          <div class="card-header">
            <div class="glow-dot"></div>
            <div>
              <p class="card-kicker">Exclusive Snapshot</p>
              <p class="card-title">Crystal Bloom Ridge</p>
            </div>
          </div>
          <div class="card-body">
            <div class="card-stat">
              <span>Depth</span>
              <strong>42m</strong>
            </div>
            <div class="card-stat">
              <span>Currents</span>
              <strong>Soft Drift</strong>
            </div>
            <div class="card-stat">
              <span>Creatures</span>
              <strong>Jelly Choir</strong>
            </div>
          </div>
          <div class="card-footer">
            <div class="bubble-group">
              <span class="bubble b1"></span>
              <span class="bubble b2"></span>
              <span class="bubble b3"></span>
            </div>
            <p>Hold your breath. The ridge sings when you arrive.</p>
          </div>
        </div>
      </section>

      <section id="features" class="panel features">
        <div class="panel-header">
          <p class="eyebrow">Why dive here</p>
          <h2>Water that listens to you.</h2>
          <p class="lede">Adaptive tides, shimmering caustics, and reactive flora make every session unique.</p>
        </div>
        <div class="feature-grid">
          <article class="feature-card">
            <div class="icon-ring"><span>🌊</span></div>
            <h3>Tactile Currents</h3>
            <p>Every movement sculpts real-time waves powered by GPU particles.</p>
          </article>
          <article class="feature-card">
            <div class="icon-ring"><span>🐚</span></div>
            <h3>Living Reefs</h3>
            <p>Corals bloom, retreat, and glow based on your path through the water.</p>
          </article>
          <article class="feature-card">
            <div class="icon-ring"><span>💠</span></div>
            <h3>Biolum Trails</h3>
            <p>Leave sparkling ribbons behind as you chase currents and light.</p>
          </article>
        </div>
      </section>

      <section id="modes" class="panel modes">
        <div class="panel-header">
          <p class="eyebrow">Choose your flow</p>
          <h2>From chill drift to challenge dives.</h2>
        </div>
        <div class="mode-cards">
          <div class="mode-card">
            <h3>Zen Drift</h3>
            <p>Float with soft currents, meditative soundscapes, and endless blue.</p>
            <span class="chip">Relax</span>
          </div>
          <div class="mode-card">
            <h3>Beacon Hunt</h3>
            <p>Track biolum signals, collect shells, and race playful dolphins.</p>
            <span class="chip accent">Explore</span>
          </div>
          <div class="mode-card">
            <h3>Abyss Run</h3>
            <p>Descend into stormy trenches with reactive storms and glowing caverns.</p>
            <span class="chip">Challenge</span>
          </div>
        </div>
      </section>

      <section id="community" class="panel community">
        <div class="community-card">
          <div>
            <p class="eyebrow">Coming with the game</p>
            <h2>Community tides.</h2>
            <p class="lede">Squads gather, rescue runs launch, and screenshots shimmer in real-time galleries.</p>
          </div>
          <div class="cta-stack">
            <a class="cta primary" href="/game.html">Play Now</a>
            <a class="cta ghost" href="#top">Back to top</a>
          </div>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="brand-footer">
        <div class="brand-mark">LS</div>
        <div>
          <div class="brand-name">Lost Seahorse</div>
          <div class="brand-sub">Ocean-built experiences</div>
        </div>
      </div>
      <div class="footer-links">
        <a href="#features">World</a>
        <a href="#modes">Modes</a>
        <a href="#community">Community</a>
        <a href="/game.html">Play Now</a>
      </div>
      <p class="footer-note">Breathe in the blue. Crafted with Three.js and imagination.</p>
    </footer>
  </div>
`;

const canvas = document.querySelector('#ocean-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x031727, 0.06);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  120
);
camera.position.set(0, 2, 16);

const ambient = new THREE.AmbientLight(0x94eaff, 0.48);
const dir = new THREE.DirectionalLight(0x7ef3ff, 1.12);
dir.position.set(-6, 8, 4);
const fill = new THREE.PointLight(0x1dd0ff, 0.7);
fill.position.set(8, 3, -6);
scene.add(ambient, dir, fill);

const bubbleCount = 50;
const bubbleGeometry = new THREE.SphereGeometry(0.22, 16, 16);
const bubbleMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xb9f4ff,
  transparent: true,
  opacity: 0.12,
  roughness: 0.25,
  metalness: 0.08,
  transmission: 0.35,
  thickness: 0.6,
  clearcoat: 0.25,
  emissive: new THREE.Color(0x0b3f64),
  emissiveIntensity: 0.08,
  depthWrite: false
});
const bubbles = new THREE.InstancedMesh(bubbleGeometry, bubbleMaterial, bubbleCount);
const dummy = new THREE.Object3D();
const bubbleSpeed = new Float32Array(bubbleCount);
const bubblePhase = new Float32Array(bubbleCount);
const bubbleScale = new Float32Array(bubbleCount);

for (let i = 0; i < bubbleCount; i++) {
  dummy.position.set((Math.random() - 0.5) * 22, Math.random() * 18 - 9, (Math.random() - 0.5) * 14);
  dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  const scale = 0.6 + Math.random() * 0.9;
  dummy.scale.setScalar(scale);
  dummy.updateMatrix();
  bubbles.setMatrixAt(i, dummy.matrix);
  bubbleSpeed[i] = 0.12 + Math.random() * 0.35;
  bubblePhase[i] = Math.random() * Math.PI * 2;
  bubbleScale[i] = scale;
}
scene.add(bubbles);
bubbles.instanceMatrix.needsUpdate = true;

const sparkCount = 680;
const sparkGeometry = new THREE.BufferGeometry();
const sparkPositions = new Float32Array(sparkCount * 3);
const sparkOpacity = new Float32Array(sparkCount);
for (let i = 0; i < sparkCount; i++) {
  sparkPositions[i * 3] = (Math.random() - 0.5) * 26;
  sparkPositions[i * 3 + 1] = Math.random() * 22 - 8;
  sparkPositions[i * 3 + 2] = (Math.random() - 0.5) * 18;
  sparkOpacity[i] = 0.4 + Math.random() * 0.6;
}
sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
sparkGeometry.setAttribute('alpha', new THREE.BufferAttribute(sparkOpacity, 1));
const sparkMaterial = new THREE.PointsMaterial({
  color: 0x7ef3ff,
  size: 0.08,
  transparent: true,
  opacity: 0.75,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  sizeAttenuation: true
});
const sparks = new THREE.Points(sparkGeometry, sparkMaterial);
scene.add(sparks);

const waveGeometry = new THREE.PlaneGeometry(42, 42, 140, 140);
const waveMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 }
  },
  vertexShader: `
    uniform float uTime;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 pos = position;
      float wave1 = sin(pos.x * 0.26 + uTime * 0.6) * 0.55;
      float wave2 = cos(pos.y * 0.24 + uTime * 0.5) * 0.45;
      float ripple = sin((pos.x + pos.y) * 0.35 + uTime * 0.8) * 0.25;
      pos.z += wave1 + wave2 + ripple;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    void main() {
      float fres = smoothstep(0.1, 0.9, vUv.y);
      vec3 deep = vec3(0.03, 0.11, 0.18);
      vec3 light = vec3(0.08, 0.48, 0.62);
      vec3 color = mix(deep, light, fres);
      float caustic = smoothstep(0.6, 1.0, sin(vUv.x * 30.0) * cos(vUv.y * 20.0));
      color += vec3(0.1, 0.35, 0.45) * caustic * 0.4;
      gl_FragColor = vec4(color, 0.32);
    }
  `,
  transparent: true,
  side: THREE.DoubleSide
});
const waves = new THREE.Mesh(waveGeometry, waveMaterial);
waves.rotation.x = -Math.PI / 2.2;
waves.position.y = -6;
scene.add(waves);

const ribbonGeometry = new THREE.BufferGeometry();
const ribbonPoints = 180;
const ribbonPositions = new Float32Array(ribbonPoints * 3);
for (let i = 0; i < ribbonPoints; i++) {
  const t = (i / ribbonPoints) * Math.PI * 2;
  ribbonPositions[i * 3] = Math.sin(t * 0.7) * 10;
  ribbonPositions[i * 3 + 1] = Math.cos(t * 0.5) * 2 - 1;
  ribbonPositions[i * 3 + 2] = Math.cos(t * 0.9) * 6 - 4;
}
ribbonGeometry.setAttribute('position', new THREE.BufferAttribute(ribbonPositions, 3));
const ribbonMaterial = new THREE.LineBasicMaterial({
  color: 0x36d1dc,
  transparent: true,
  opacity: 0.35,
  linewidth: 2
});
const ribbon = new THREE.LineLoop(ribbonGeometry, ribbonMaterial);
ribbon.rotation.y = Math.PI * 0.2;
ribbon.position.y = -1;
scene.add(ribbon);

const mouse = new THREE.Vector2();
window.addEventListener('pointermove', (event) => {
  mouse.x = (event.clientX / window.innerWidth - 0.5) * 2;
  mouse.y = (event.clientY / window.innerHeight - 0.5) * 2;
});

window.addEventListener('resize', () => {
  const { innerWidth, innerHeight } = window;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const clock = new THREE.Clock();
const matrix = new THREE.Matrix4();
const tempObj = new THREE.Object3D();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = clock.elapsedTime;

  waveMaterial.uniforms.uTime.value = time;
  ribbon.rotation.y += delta * 0.15;
  ribbon.rotation.x = Math.sin(time * 0.2) * 0.08;

  for (let i = 0; i < bubbleCount; i++) {
    bubbles.getMatrixAt(i, matrix);
    tempObj.matrix.copy(matrix);
    tempObj.matrix.decompose(tempObj.position, tempObj.quaternion, tempObj.scale);
    tempObj.position.y += bubbleSpeed[i] * delta * 4.5;
    tempObj.position.x += Math.sin(time * 0.6 + bubblePhase[i]) * 0.01 * bubbleScale[i];
    tempObj.position.z += Math.cos(time * 0.4 + bubblePhase[i]) * 0.008 * bubbleScale[i];
    if (tempObj.position.y > 12) {
      tempObj.position.y = -9;
      tempObj.position.x = (Math.random() - 0.5) * 20;
      tempObj.position.z = (Math.random() - 0.5) * 14;
    }
    tempObj.quaternion.setFromEuler(new THREE.Euler(0, time * 0.4 + bubblePhase[i], 0));
    tempObj.updateMatrix();
    bubbles.setMatrixAt(i, tempObj.matrix);
  }
  bubbles.instanceMatrix.needsUpdate = true;

  const camTargetX = mouse.x * 0.5;
  const camTargetY = 1.5 + mouse.y * 0.4;
  camera.position.x += (camTargetX - camera.position.x) * 0.04;
  camera.position.y += (camTargetY - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

animate();
