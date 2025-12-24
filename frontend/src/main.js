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
          <p class="eyebrow">Guide the lost seahorse home</p>
          <h1>3D Open-world undersea learning, in motion.</h1>
          <p class="lede">Steer a baby seahorse through an expanding ocean, meet real species, unlock facts, and follow the story back to family.</p>
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
              <p class="card-kicker">Story Glimpse</p>
              <p class="card-title">Coral Classroom</p>
            </div>
          </div>
          <div class="card-body">
            <div class="card-stat">
              <span>Depth</span>
              <strong>38m</strong>
            </div>
            <div class="card-stat">
              <span>Waypoint</span>
              <strong>Family Trail</strong>
            </div>
            <div class="card-stat">
              <span>Discovery</span>
              <strong>Leafy Seahorse</strong>
            </div>
          </div>
          <div class="card-footer">
            <div class="bubble-group">
              <span class="bubble b1"></span>
              <span class="bubble b2"></span>
              <span class="bubble b3"></span>
            </div>
            <p>Approach to unlock its name, habitat, and a hint toward the missing parents.</p>
          </div>
        </div>
      </section>

      <section id="features" class="panel features">
        <div class="panel-header">
          <p class="eyebrow">Why dive here</p>
          <h2>Learn as you explore.</h2>
          <p class="lede">Every encounter brings a “learn more” pop-up with species names, habitats, uses, and mysteries of the deep.</p>
        </div>
        <div class="feature-grid">
          <article class="feature-card">
            <div class="icon-ring"><span>🌊</span></div>
            <h3>Tactile Currents</h3>
            <p>Swim a living ocean—currents, caustics, and coral respond as you guide the seahorse.</p>
          </article>
          <article class="feature-card">
            <div class="icon-ring"><span>🐚</span></div>
            <h3>Living Reefs</h3>
            <p>Discover real species; get instant scientific names, habitats, and human connections.</p>
          </article>
          <article class="feature-card">
            <div class="icon-ring"><span>💠</span></div>
            <h3>Biolum Trails</h3>
            <p>Follow glowing clues to reunite the seahorse family while leaving shimmering wakes.</p>
          </article>
        </div>
      </section>

      <section id="modes" class="panel modes">
        <div class="panel-header">
          <p class="eyebrow">Choose your flow</p>
          <h2>Explore, learn, rescue.</h2>
        </div>
        <div class="mode-cards">
          <div class="mode-card">
            <h3>Discovery Swim</h3>
            <p>Glide slowly, meet species, and read quick fact cards as you explore.</p>
            <span class="chip">Learn</span>
          </div>
          <div class="mode-card">
            <h3>Beacon Hunt</h3>
            <p>Track biolum signals and uncover new creatures that expand the world map.</p>
            <span class="chip accent">Explore</span>
          </div>
          <div class="mode-card">
            <h3>Rescue Run</h3>
            <p>Chase the family trail through trenches, storms, and glowing caverns.</p>
            <span class="chip">Story</span>
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
      <p class="footer-note">Breathe in the blue. Crafted with imagination.</p>
    </footer>
  </div>
`;

const canvas = document.querySelector('#ocean-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x031727, 0.06);

// Smooth scroll for in-page nav links
document.querySelectorAll('.nav a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

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
const fishGeometry = new THREE.PlaneGeometry(1.15, 0.6);
const fishPalettes = [
  { body: ['rgba(126,243,255,0.9)', 'rgba(91,141,243,0.7)', 'rgba(54,209,220,0.6)'], fin: 'rgba(126,243,255,0.55)', eye: '#dff9ff' },
  { body: ['rgba(255,215,128,0.85)', 'rgba(255,128,149,0.7)', 'rgba(255,255,255,0.5)'], fin: 'rgba(255,175,120,0.6)', eye: '#fff4d6' },
  { body: ['rgba(160,255,199,0.85)', 'rgba(91,229,193,0.7)', 'rgba(60,146,255,0.5)'], fin: 'rgba(137,255,203,0.55)', eye: '#e2fffd' }
];
let rippleMesh;
let rippleMaterial;
let ripplePhase;
const rippleObj = new THREE.Object3D();

function createFishTexture(palette) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(24, 64, 230, 64);
  gradient.addColorStop(0, palette.body[0]);
  gradient.addColorStop(0.45, palette.body[1]);
  gradient.addColorStop(1, palette.body[2]);

  // body
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(230, 64);
  ctx.quadraticCurveTo(190, 24, 140, 32);
  ctx.quadraticCurveTo(90, 26, 54, 48);
  ctx.lineTo(30, 30);
  ctx.lineTo(18, 64);
  ctx.lineTo(30, 98);
  ctx.lineTo(54, 80);
  ctx.quadraticCurveTo(90, 102, 140, 96);
  ctx.quadraticCurveTo(190, 104, 230, 64);
  ctx.closePath();
  ctx.fill();

  // tail
  ctx.fillStyle = palette.body[1];
  ctx.beginPath();
  ctx.moveTo(18, 64);
  ctx.lineTo(0, 32);
  ctx.lineTo(0, 96);
  ctx.closePath();
  ctx.fill();

  // dorsal fin
  ctx.fillStyle = palette.fin;
  ctx.beginPath();
  ctx.moveTo(120, 40);
  ctx.lineTo(145, 10);
  ctx.lineTo(168, 44);
  ctx.closePath();
  ctx.fill();

  // ventral fin
  ctx.beginPath();
  ctx.moveTo(120, 88);
  ctx.lineTo(145, 118);
  ctx.lineTo(168, 84);
  ctx.closePath();
  ctx.fill();

  // pectoral fin
  ctx.beginPath();
  ctx.moveTo(160, 64);
  ctx.quadraticCurveTo(182, 72, 170, 90);
  ctx.quadraticCurveTo(152, 80, 160, 64);
  ctx.fill();

  // stripes
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 3;
  [90, 130, 170, 200].forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, 50);
    ctx.lineTo(x - 12, 78);
    ctx.stroke();
  });

  // eye
  ctx.fillStyle = palette.eye;
  ctx.beginPath();
  ctx.arc(210, 60, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(20,40,60,0.8)';
  ctx.beginPath();
  ctx.arc(213, 60, 4, 0, Math.PI * 2);
  ctx.fill();

  // gill line
  ctx.strokeStyle = 'rgba(20,40,60,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(190, 52);
  ctx.quadraticCurveTo(184, 64, 190, 76);
  ctx.stroke();

  // speckles
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  for (let i = 0; i < 16; i++) {
    const sx = 70 + Math.random() * 120;
    const sy = 44 + Math.random() * 36;
    const r = 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // highlight
  const shine = ctx.createLinearGradient(70, 40, 200, 80);
  shine.addColorStop(0, 'rgba(255,255,255,0.16)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.beginPath();
  ctx.ellipse(140, 60, 90, 30, Math.PI / 12, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const fishGroups = [];

function spawnFishGroups() {
  const counts = [2, 1, 1]; // keep just a few unique swimmers
  const totalFish = counts.reduce((a, b) => a + b, 0);
  fishPalettes.forEach((palette, idx) => {
    const texture = createFishTexture(palette);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.vertexShader = shader.vertexShader
        .replace(
          'void main() {',
          'attribute float instPhase;\nuniform float uTime;\nvoid main() {'
        )
        .replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>
          float tailMask = smoothstep(0.35, 1.0, 1.0 - uv.x);
          float gate = smoothstep(0.15, 0.6, (sin(uTime * 1.0 + instPhase * 0.2) + 1.0) * 0.5);
          float baseWave = sin(uTime * 4.0 + instPhase * 0.8) * 0.07;
          float microWave = sin(uTime * 6.0 + instPhase * 1.3) * 0.03;
          float tailDribble = (baseWave + microWave) * tailMask * gate;
          transformed.y += tailDribble * 0.7;
          transformed.x -= tailDribble * 0.28;
          float headMask = smoothstep(0.0, 0.22, uv.x);
          float headGate = smoothstep(0.2, 0.65, (sin(uTime * 0.9 + instPhase * 0.2) + 1.0) * 0.5);
          float headNod = sin(uTime * 2.0 + instPhase * 0.35) * 0.018 * headGate;
          transformed.y += headNod * headMask;
          transformed.x += headNod * 0.18 * headMask;
          `
        );
      material.userData.shader = shader;
    };
    material.customProgramCacheKey = () => 'fish-tail-dribble';
    const count = counts[idx];
    const geo = fishGeometry.clone();
    const mesh = new THREE.InstancedMesh(geo, material, count);
    const speed = new Float32Array(count);
    const phase = new Float32Array(count);
    const yOffset = new Float32Array(count);
    const dir = new Float32Array(count);
    const instPhase = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const d = Math.random() > 0.5 ? 1 : -1;
      dir[i] = d;
      speed[i] = 0.85 + Math.random() * 0.9;
      phase[i] = Math.random() * Math.PI * 2;
      instPhase[i] = Math.random() * Math.PI * 2;
      yOffset[i] = Math.random() * 2 - 1;
      dummy.position.set((Math.random() - 0.5) * 20, yOffset[i], (Math.random() - 0.5) * 12);
      dummy.rotation.set(0, d === 1 ? 0 : Math.PI, 0);
      const scale = 0.9 + Math.random() * 0.7;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    geo.setAttribute('instPhase', new THREE.InstancedBufferAttribute(instPhase, 1));
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
    fishGroups.push({ mesh, speed, phase, yOffset, dir });
  });
  // wakes for each fish
  const rippleGeometry = new THREE.PlaneGeometry(1.6, 1.0);
  ripplePhase = new Float32Array(totalFish);
  rippleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0x5ee2ff) }
    },
    vertexShader: `
      attribute float instPhase;
      uniform float uTime;
      varying vec2 vUv;
      varying float vAlpha;
      void main() {
        vUv = uv;
        float pulse = sin(uTime * 2.0 + instPhase) * 0.5 + 0.5;
        float scale = mix(0.5, 1.8, pulse);
        vec3 pos = position;
        pos.xy *= scale;
        vAlpha = smoothstep(1.0, 0.15, pulse) * 0.45;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec2 vUv;
      varying float vAlpha;
      void main() {
        vec2 c = vUv - 0.5;
        float d = length(c);
        float ring = smoothstep(0.5, 0.2, d);
        float alpha = ring * vAlpha;
        if (alpha < 0.02) discard;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  rippleMesh = new THREE.InstancedMesh(rippleGeometry, rippleMaterial, totalFish);
  const phaseAttr = new Float32Array(totalFish);
  for (let i = 0; i < totalFish; i++) {
    phaseAttr[i] = Math.random() * Math.PI * 2;
    ripplePhase[i] = phaseAttr[i];
    rippleObj.position.set(0, -50, 0);
    rippleObj.updateMatrix();
    rippleMesh.setMatrixAt(i, rippleObj.matrix);
  }
  rippleGeometry.setAttribute('instPhase', new THREE.InstancedBufferAttribute(phaseAttr, 1));
  rippleMesh.instanceMatrix.needsUpdate = true;
  scene.add(rippleMesh);
}
spawnFishGroups();

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

  fishGroups.forEach(({ mesh, speed, phase, yOffset, dir }) => {
    const shader = mesh.material.userData?.shader;
    if (shader?.uniforms?.uTime) {
      shader.uniforms.uTime.value = time;
    }
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, matrix);
      tempObj.matrix.copy(matrix);
      tempObj.matrix.decompose(tempObj.position, tempObj.quaternion, tempObj.scale);

      const d = dir[i];
      tempObj.position.x += d * speed[i] * delta * 2.1;
      tempObj.position.y = yOffset[i] + Math.sin(time * 0.9 + phase[i]) * 0.6;
      tempObj.position.z += Math.sin(time * 0.5 + phase[i]) * 0.05;

      if (tempObj.position.x > 13) {
        tempObj.position.x = -13;
      } else if (tempObj.position.x < -13) {
        tempObj.position.x = 13;
      }

      const yaw = Math.sin(time * 2 + phase[i]) * 0.22;
      const roll = Math.sin(time * 1.4 + phase[i]) * 0.08;
      tempObj.rotation.set(0, d === 1 ? 0 : Math.PI, 0);
      tempObj.rotation.y += yaw;
      tempObj.rotation.z = roll;
      tempObj.updateMatrix();
      mesh.setMatrixAt(i, tempObj.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  const camTargetX = mouse.x * 0.5;
  const camTargetY = 1.5 + mouse.y * 0.4;
  camera.position.x += (camTargetX - camera.position.x) * 0.04;
  camera.position.y += (camTargetY - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

animate();
