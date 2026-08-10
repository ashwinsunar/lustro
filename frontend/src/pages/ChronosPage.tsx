import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { toast } from 'sonner';
import {
  ArrowRight,
  Rotate3d,
  MousePointerClick,
  Shield,
  Layers,
  Activity,
  Droplets,
  BatteryCharging,
  Satellite,
} from 'lucide-react';
import { cn } from '../lib/utils';

gsap.registerPlugin(ScrollTrigger);

interface Accent {
  key: string;
  label: string;
  color: string;
  price: string;
}

const VARIANTS: Accent[] = [
  { key: 'obsidian', label: 'Obsidian', color: '#6366f1', price: '899' },
  { key: 'silver', label: 'Silver', color: '#d4d4d8', price: '849' },
  { key: 'gold', label: 'Gold', color: '#e3b341', price: '999' },
];

const FEATURES = [
  { icon: Droplets, title: '10 ATM Water Resistance', desc: 'Engineered for diving and high-impact water sports.' },
  { icon: BatteryCharging, title: '14-Day Battery Life', desc: 'Low-power coprocessor keeps the display alive without drainage.' },
  { icon: Satellite, title: 'Dual-Band GPS', desc: 'Pinpoint accuracy in urban canyons and dense forests.' },
];

const SPECS = [
  { icon: Shield, title: 'Case', desc: 'Grade 5 Titanium alloy with diamond-like carbon (DLC) coating.' },
  { icon: Layers, title: 'Display', desc: 'Sapphire crystal dome. 2000-nit peak brightness OLED.' },
  { icon: Activity, title: 'Strap', desc: 'High-performance fluoroelastomer with titanium buckle geometry.' },
];

function createWatchFaceTexture(accent: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 1024, 1024);

  ctx.translate(512, 512);

  // Minute ticks
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 4;
  for (let i = 0; i < 60; i++) {
    ctx.rotate(Math.PI / 30);
    ctx.beginPath();
    ctx.moveTo(0, 420);
    ctx.lineTo(0, 480);
    ctx.stroke();
  }

  // Hour indices
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 8;
  for (let i = 0; i < 12; i++) {
    ctx.rotate(Math.PI / 6);
    ctx.beginPath();
    ctx.moveTo(0, 400);
    ctx.lineTo(0, 480);
    ctx.stroke();
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);

  const drawSpaced = (text: string, y: number, font: string, style: string, spacing: number) => {
    ctx.font = font;
    ctx.fillStyle = style;
    const letters = Array.from(text);
    const widths = letters.map((c) => ctx.measureText(c).width);
    const total = widths.reduce((a, b) => a + b, 0) + spacing * (letters.length - 1);
    let x = 512 - total / 2;
    ctx.textBaseline = 'middle';
    letters.forEach((c, i) => {
      ctx.fillText(c, x, y);
      x += widths[i] + spacing;
    });
  };

  // Brand
  drawSpaced('C H R O N O S', 300, '500 30px Inter, sans-serif', '#ffffff', 6);

  ctx.font = '400 20px Inter, sans-serif';
  ctx.fillStyle = '#666';
  ctx.textAlign = 'center';
  ctx.fillText('AUTOMATIC', 512, 750);

  // Sub-dials
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(350, 512, 80, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(674, 512, 80, 0, Math.PI * 2);
  ctx.stroke();

  // Accent dot
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(674, 512, 5, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

type SceneHandles = {
  applyVariant: (index: number) => void;
};

export default function ChronosPage() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const specsCardRef = useRef<HTMLDivElement>(null);
  const sceneHandlesRef = useRef<SceneHandles | null>(null);
  const [variant, setVariant] = useState(0);

  useEffect(() => {
    document.title = 'CHRONOS OBSIDIAN | Precision Engineering';
    window.scrollTo({ top: 0 });
  }, []);

  // 3D scene + scroll choreography — built once, torn down cleanly on unmount.
  useEffect(() => {
    const container = canvasRef.current;
    const page = pageRef.current;
    const specsCard = specsCardRef.current;
    if (!container || !page || !specsCard) return;

    // ---------- Renderer / scene / camera ----------
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030304, 0.03);

    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // ---------- Lights ----------
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));

    const keyLight = new THREE.SpotLight(0xffffff, 1.5);
    keyLight.position.set(5, 5, 10);
    keyLight.angle = 0.5;
    keyLight.penumbra = 1;
    scene.add(keyLight);

    const accentLight = new THREE.SpotLight(VARIANTS[0].color, 3);
    accentLight.position.set(-5, 0, -5);
    accentLight.lookAt(0, 0, 0);
    scene.add(accentLight);

    scene.add(new THREE.PointLight(0xffffff, 0.5).translateY(-5).translateZ(5));

    // ---------- Watch ----------
    const watchGroup = new THREE.Group();
    scene.add(watchGroup);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.9 });

    const caseMesh = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.4, 64), metalMat);
    caseMesh.rotation.x = Math.PI / 2;
    watchGroup.add(caseMesh);

    const bezel = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.1, 16, 100),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.1, metalness: 0.8 })
    );
    watchGroup.add(bezel);

    const faceMat = new THREE.MeshStandardMaterial({
      map: createWatchFaceTexture(VARIANTS[0].color),
      roughness: 0,
      metalness: 0,
      emissive: 0xffffff,
      emissiveIntensity: 0.1,
    });
    const face = new THREE.Mesh(new THREE.CircleGeometry(2.0, 64), faceMat);
    face.position.z = 0.21;
    watchGroup.add(face);

    const handGroup = new THREE.Group();
    handGroup.position.z = 0.25;
    watchGroup.add(handGroup);

    const hHandMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const hHand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.02), hHandMat);
    hHand.geometry.translate(0, 0.4, 0);
    hHand.rotation.z = -1;
    handGroup.add(hHand);

    const mHandMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const mHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.8, 0.02), mHandMat);
    mHand.geometry.translate(0, 0.6, 0);
    mHand.rotation.z = 2.5;
    handGroup.add(mHand);

    const sHandMat = new THREE.MeshBasicMaterial({ color: VARIANTS[0].color });
    const sHand = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.9, 0.02), sHandMat);
    sHand.geometry.translate(0, 0.5, 0);
    handGroup.add(sHand);

    const strapMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, metalness: 0.1 });
    const topStrap = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2, 0.3), strapMat);
    topStrap.position.set(0, 2.2, -0.1);
    watchGroup.add(topStrap);

    const botStrap = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2, 0.3), strapMat);
    botStrap.position.set(0, -2.2, -0.1);
    watchGroup.add(botStrap);

    const lugGeo = new THREE.BoxGeometry(0.4, 0.6, 0.4);
    [
      [0.9, 2],
      [-0.9, 2],
      [0.9, -2],
      [-0.9, -2],
    ].forEach(([x, y]) => {
      const lug = new THREE.Mesh(lugGeo, metalMat);
      lug.position.set(x, y, 0);
      watchGroup.add(lug);
    });

    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.4, 16), metalMat);
    crown.rotation.z = Math.PI / 2;
    crown.position.set(2.2, 0, 0);
    watchGroup.add(crown);

    // ---------- Particles ----------
    const pCount = 300;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i++) pPos[i] = (Math.random() - 0.5) * 15;
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: VARIANTS[0].color,
      size: 0.03,
      transparent: true,
      opacity: 0,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Variant swatch recolors the watch (second hand, accent light, particles, dial dot).
    const applyVariant = (index: number) => {
      const accentVal = VARIANTS[index].color;
      sHandMat.color.set(accentVal);
      pMat.color.set(accentVal);
      accentLight.color.set(accentVal);
      const previous = faceMat.map;
      faceMat.map = createWatchFaceTexture(accentVal);
      faceMat.needsUpdate = true;
      if (previous) previous.dispose();
    };
    sceneHandlesRef.current = { applyVariant };

    // ---------- Drag to rotate ----------
    let isDragging = false;
    let previousMouse = { x: 0, y: 0 };
    let velocity = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMouse = { x: e.clientX, y: e.clientY };
      container.style.cursor = 'grabbing';
    };
    const onMouseUp = () => {
      isDragging = false;
      container.style.cursor = 'grab';
    };
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - previousMouse.x;
        const dy = e.clientY - previousMouse.y;
        watchGroup.rotation.y += dx * 0.005;
        watchGroup.rotation.x += dy * 0.005;
        velocity = { x: dx * 0.001, y: dy * 0.001 };
        previousMouse = { x: e.clientX, y: e.clientY };
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);

    // ---------- GSAP scroll choreography ----------
    watchGroup.rotation.x = 0;
    watchGroup.rotation.y = 0;
    watchGroup.scale.setScalar(window.innerWidth < 768 ? 0.8 : 1.2);

    const ctx = gsap.context(() => {
      gsap.to(watchGroup.rotation, {
        y: 0.5,
        x: 0.2,
        scrollTrigger: { trigger: '#chronos-overview', start: 'top top', end: 'bottom center', scrub: 2 },
      });

      const tlSpecs = gsap.timeline({
        scrollTrigger: { trigger: '#chronos-specs', start: 'top bottom', end: 'center center', scrub: 1.5 },
      });
      tlSpecs.to(watchGroup.position, { x: -3.5, z: 2 }).to(watchGroup.rotation, { y: 1.2, x: 0.5 }, '<');

      gsap.to(specsCard, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: { trigger: '#chronos-specs', start: 'top 60%', toggleActions: 'play none none reverse' },
      });

      const tlTech = gsap.timeline({
        scrollTrigger: { trigger: '#chronos-technology', start: 'top bottom', end: 'center center', scrub: 1 },
      });
      tlTech
        .to(watchGroup.position, { x: 0, y: 0, z: 5.5 })
        .to(watchGroup.rotation, { x: 0, y: 0, z: 0.2 }, '<')
        .to(pMat, { opacity: 0.6 }, '<');

      gsap.to(watchGroup.position, {
        y: 3,
        z: -5,
        scrollTrigger: { trigger: '#chronos-features', start: 'top bottom', end: 'center center', scrub: 1 },
      });

      gsap.to(pMat, {
        opacity: 0,
        scrollTrigger: { trigger: '#chronos-features', start: 'top bottom', end: '20% center', scrub: true },
      });
    }, page);

    // ---------- Render loop ----------
    const clock = new THREE.Clock();
    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      sHand.rotation.z = -t;
      mHand.rotation.z = -t / 60;

      if (!isDragging) {
        velocity.x *= 0.95;
        velocity.y *= 0.95;
        watchGroup.rotation.y += velocity.x;
        watchGroup.rotation.x += velocity.y;
        watchGroup.position.y += Math.sin(t) * 0.001;
      }

      particles.rotation.y = t * 0.05;
      renderer.render(scene, camera);
    };
    animate();

    // ---------- Resize ----------
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      watchGroup.scale.setScalar(window.innerWidth < 768 ? 0.8 : 1.2);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      ctx.revert();
      sceneHandlesRef.current = null;
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          const mat = obj.material as THREE.Material | THREE.Material[];
          (Array.isArray(mat) ? mat : [mat]).forEach((m) => {
            const map = m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshBasicMaterial ? m.map : null;
            if (map) map.dispose();
            m.dispose();
          });
        }
      });
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div
      ref={pageRef}
      className="bg-grid overflow-x-hidden bg-[#030304] text-white antialiased selection:bg-white/20 selection:text-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* 3D background */}
      <div ref={canvasRef} id="canvas-container" className="cursor-grab-custom fixed top-0 left-0 h-screen w-full z-0 outline-none" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center mix-blend-difference">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
          </span>
          <span className="text-sm font-medium tracking-tight text-white/90">CHRONOS</span>
        </button>

        <div className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-400 tracking-wide">
          {[
            ['OVERVIEW', 'chronos-overview'],
            ['SPECS', 'chronos-specs'],
            ['TECHNOLOGY', 'chronos-technology'],
          ].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)} className="hover:text-white transition-colors">
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => scrollTo('chronos-features')}
          className="group flex items-center gap-2 rounded bg-white px-4 py-2 text-xs font-medium text-black transition-all duration-300 hover:bg-zinc-200"
        >
          <span>PRE-ORDER</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </nav>

      {/* Overlay content */}
      <main className="relative z-10 w-full">
        {/* Hero */}
        <section id="chronos-overview" className="pointer-events-none flex h-screen w-full flex-col items-start justify-center px-6 md:px-24">
          <div className="max-w-2xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_10px_rgba(201,168,76,0.5)]" />
              <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">Series 01 Limited</span>
            </div>

            <h1 className="text-6xl leading-[0.9] font-medium tracking-tighter text-white md:text-7xl lg:text-9xl">
              TIME
              <br />
              <span className="text-zinc-600">REDEFINED.</span>
            </h1>

            <p className="max-w-sm text-base font-light leading-relaxed tracking-tight text-zinc-400 md:text-lg">
              Aerospace-grade titanium chassis meets an always-on retinal display. The future of timekeeping is here.
            </p>

            <div className="flex items-center gap-6 pt-8 pointer-events-auto">
              <span className="flex items-center gap-2 text-xs tracking-wide text-zinc-500">
                <Rotate3d className="h-4 w-4" /> INTERACT
              </span>
              <span className="h-px w-8 bg-zinc-800" />
              <span className="flex items-center gap-2 text-xs tracking-wide text-zinc-500">
                <MousePointerClick className="h-4 w-4" /> SCROLL
              </span>
            </div>
          </div>
        </section>

        {/* Composition */}
        <section id="chronos-specs" className="pointer-events-none flex min-h-screen w-full items-center justify-end px-6 py-24 md:px-24">
          <div
            ref={specsCardRef}
            className="glass-panel pointer-events-auto w-full max-w-sm translate-y-10 space-y-6 rounded-xl p-8 opacity-0"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-2xl font-medium tracking-tight text-white">Composition</h2>
              <span className="font-mono text-xs text-zinc-500">MAT-V1.0</span>
            </div>

            <div className="space-y-6">
              {SPECS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="cursor-default group">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-200">{title}</span>
                    <Icon className="h-4 w-4 text-zinc-500 transition-colors group-hover:text-white" />
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-500">{desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
              <span className="text-xs text-zinc-500">Weight: 42g</span>
              <span className="text-xs text-zinc-500">Thickness: 9mm</span>
            </div>
          </div>
        </section>

        {/* Technology */}
        <section id="chronos-technology" className="pointer-events-none flex h-screen w-full flex-col items-center justify-center px-6 text-center">
          <div className="relative z-20 flex flex-col items-center gap-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-black/80 px-3 py-1 backdrop-blur-md">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="text-[10px] font-medium tracking-widest text-zinc-400">HAPTIC ENGINE V2</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-4xl font-medium tracking-tighter text-white md:text-6xl lg:text-8xl">ZERO LATENCY</h2>
              <h3 className="text-4xl font-medium tracking-tighter text-zinc-800 md:text-6xl lg:text-8xl">FEEDBACK.</h3>
            </div>

            <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed tracking-tight text-zinc-500">
              Feel time pass with microscopic vibrations. A seamless connection between your digital life and physical reality.
            </p>
          </div>
        </section>

        {/* Features + Buy */}
        <section id="chronos-features" className="relative flex min-h-screen w-full flex-col items-center justify-center border-t border-white/5 bg-[#030304] px-6 py-32">
          <div className="z-10 mb-32 grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="glass-panel group flex h-48 flex-col justify-between rounded-lg p-6 transition-colors hover:bg-white/5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded bg-white/5 transition-colors group-hover:bg-white/10">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="mb-1 text-sm font-medium text-white">{title}</h4>
                  <p className="text-xs leading-relaxed text-zinc-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative z-10 flex flex-col items-center gap-8">
            <div className="text-center">
              <h2 className="mb-2 text-4xl font-medium tracking-tight text-white">The Collection</h2>
              <p className="text-sm text-zinc-500">Select your configuration.</p>
            </div>

            <div className="flex gap-4 rounded-lg bg-white/5 p-1 backdrop-blur-sm">
              {VARIANTS.map((v, i) => (
                <button
                  key={v.key}
                  onClick={() => {
                    setVariant(i);
                    sceneHandlesRef.current?.applyVariant(i);
                  }}
                  className={cn(
                    'rounded px-6 py-2 text-xs font-medium transition-all duration-300',
                    variant === i ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <div className="my-2 h-px w-24 bg-zinc-800" />

            <div className="space-y-6 text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-lg text-zinc-500">Rs</span>
                <span className="text-5xl font-semibold tracking-tighter text-white tabular-nums">
                  {VARIANTS[variant].price}
                </span>
              </div>

              <button
                onClick={() =>
                  toast.info('Chronos Obsidian is a concept showcase. Our concierge can compose a real timepiece for you.')
                }
                className="group mx-auto flex items-center gap-4 rounded-full bg-white py-3 pl-8 pr-6 text-sm font-medium tracking-wide text-black transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                <span>SECURE RESERVATION</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-white transition-transform group-hover:translate-x-1">
                  <ArrowRight className="h-3 w-3" />
                </span>
              </button>
              <p className="text-[10px] uppercase tracking-widest text-zinc-600">Ships Winter 2026 · Complimentary worldwide shipping</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="flex w-full flex-col items-center justify-between border-t border-white/5 px-6 py-12 text-xs font-medium tracking-wide text-zinc-600 md:flex-row">
          <div className="mb-4 flex items-center gap-2 md:mb-0">
            <span className="h-4 w-4 rounded-full border border-zinc-700" />
            <span>CHRONOS INC.</span>
          </div>
          <div className="flex gap-8">
            {['Warranty', 'Support', 'Legal'].map((l) => (
              <button key={l} className="transition-colors hover:text-white">
                {l}
              </button>
            ))}
          </div>
        </footer>
      </main>
    </div>
  );
}