import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface WatchSceneTargets {
  /** ids of sections the watch should react to, in scroll order */
  overview: string;
  specs: string;
  technology: string;
  features: string;
}

interface Watch3DSceneProps {
  /** id the fixed canvas container div gets */
  id: string;
  className?: string;
  wordmark: string;
  /** hex accent for second hand / dial dot / rim light — defaults to champagne */
  accent?: string;
  targets: WatchSceneTargets;
  /** enable drag-to-rotate (used on dedicated concept pages) */
  draggable?: boolean;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}

function createWatchFaceTexture(wordmark: string, accent: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 1024, 1024);

  // Tick Marks
  ctx.translate(512, 512);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 4;
  for (let i = 0; i < 60; i++) {
    ctx.rotate(Math.PI / 30);
    ctx.beginPath();
    ctx.moveTo(0, 420);
    ctx.lineTo(0, 480);
    ctx.stroke();
  }

  // Hour Marks
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 8;
  for (let i = 0; i < 12; i++) {
    ctx.rotate(Math.PI / 6);
    ctx.beginPath();
    ctx.moveTo(0, 400);
    ctx.lineTo(0, 480);
    ctx.stroke();
  }

  // Reset Rotation for Text
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Wordmark
  ctx.fillStyle = '#ffffff';
  ctx.font = '500 30px Inter, sans-serif';
  ctx.textAlign = 'center';

  const drawSpaced = (text: string, y: number, spacing: number) => {
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
  drawSpaced(wordmark, 300, 10);

  ctx.fillStyle = '#666';
  ctx.font = '400 20px Inter, sans-serif';
  ctx.fillText('AUTOMATIC', 512, 750);

  // Sub-dials (Abstract)
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(350, 512, 80, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(674, 512, 80, 0, Math.PI * 2);
  ctx.stroke();

  // Accent
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(674, 512, 5, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export default function Watch3DScene({
  id,
  className = '',
  wordmark,
  accent = '#C9A962',
  targets,
  draggable = false,
  innerRef,
}: Watch3DSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    const keyLight = new THREE.SpotLight(0xffffff, 1.5);
    keyLight.position.set(5, 5, 10);
    keyLight.angle = 0.5;
    keyLight.penumbra = 1;
    keyLight.decay = 0;
    scene.add(keyLight);

    const accentLight = new THREE.SpotLight(accent, 3);
    accentLight.position.set(-5, 0, -5);
    accentLight.lookAt(0, 0, 0);
    accentLight.decay = 0;
    scene.add(accentLight);

    const fillLight = new THREE.PointLight(0xffffff, 1.8);
    fillLight.position.set(5, -5, 5);
    fillLight.decay = 0;
    scene.add(fillLight);

    // ---------- Watch ----------
    const watchGroup = new THREE.Group();
    scene.add(watchGroup);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.9 });

    const caseMesh = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.4, 64), metalMat);
    caseMesh.rotation.x = Math.PI / 2;
    watchGroup.add(caseMesh);

    const bezel = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.1, 16, 100),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.1, metalness: 0.8 }),
    );
    watchGroup.add(bezel);

    const faceMat = new THREE.MeshStandardMaterial({
      map: createWatchFaceTexture(wordmark, accent),
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

    const sHandMat = new THREE.MeshBasicMaterial({ color: accent });
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
    (
      [
        [0.9, 2],
        [-0.9, 2],
        [0.9, -2],
        [-0.9, -2],
      ] as const
    ).forEach(([x, y]) => {
      const lug = new THREE.Mesh(lugGeo, metalMat);
      lug.position.set(x, y, 0);
      watchGroup.add(lug);
    });

    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.4, 16), metalMat);
    crown.rotation.z = Math.PI / 2;
    crown.position.set(2.2, 0, 0);
    watchGroup.add(crown);

    // ---------- Particles (fine "data dust") ----------
    const pCount = 300;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i++) pPos[i] = (Math.random() - 0.5) * 15;
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: accent,
      size: 0.03,
      transparent: true,
      opacity: 0,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

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

    if (draggable) {
      container.style.cursor = 'grab';
      container.classList.add('cursor-grab-custom');
      container.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('mousemove', onMouseMove);
    }

    // ---------- GSAP scroll choreography ----------
    watchGroup.rotation.x = 0;
    watchGroup.rotation.y = 0;
    watchGroup.scale.setScalar(window.innerWidth < 768 ? 0.8 : 1.2);

    const ctx = gsap.context(() => {
      gsap.to(watchGroup.rotation, {
        y: 0.5,
        x: 0.2,
        scrollTrigger: { trigger: `#${targets.overview}`, start: 'top top', end: 'bottom center', scrub: 2 },
      });

      const tlSpecs = gsap.timeline({
        scrollTrigger: { trigger: `#${targets.specs}`, start: 'top bottom', end: 'center center', scrub: 1.5 },
      });
      tlSpecs.to(watchGroup.position, { x: -3.5, z: 2 }).to(watchGroup.rotation, { y: 1.2, x: 0.5 }, '<');

      const tlTech = gsap.timeline({
        scrollTrigger: { trigger: `#${targets.technology}`, start: 'top bottom', end: 'center center', scrub: 1 },
      });
      tlTech
        .to(watchGroup.position, { x: 0, y: 0, z: 5.5 })
        .to(watchGroup.rotation, { x: 0, y: 0, z: 0.2 }, '<')
        .to(pMat, { opacity: 0.6 }, '<');

      gsap.to(watchGroup.position, {
        y: 3,
        z: -5,
        scrollTrigger: { trigger: `#${targets.features}`, start: 'top bottom', end: 'center center', scrub: 1 },
      });

      gsap.to(pMat, {
        opacity: 0,
        scrollTrigger: { trigger: `#${targets.features}`, start: 'top bottom', end: '20% center', scrub: true },
      });
    }, container);

    // ---------- Render loop ----------
    const clock = new THREE.Clock();
    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (document.hidden) return;
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
      if (draggable) {
        container.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('mousemove', onMouseMove);
      }
      ctx.revert();
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
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        if (innerRef) innerRef.current = node;
      }}
      id={id}
      className={className}
    />
  );
}