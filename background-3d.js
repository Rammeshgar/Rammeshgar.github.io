import * as THREE from "three";

const mount = document.getElementById("systems-background");
const world = document.getElementById("systems-world");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const compact = window.matchMedia("(max-width: 760px)").matches;
const constrainedDevice = compact && (
  (navigator.deviceMemory && navigator.deviceMemory <= 4)
  || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
);

if (mount && world && !reducedMotion) {
  try {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, .1, 40);
    camera.position.set(0, 0, 6.7);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !compact,
      powerPreference: compact ? "low-power" : "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1 : 1.25));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const particleCount = compact ? (constrainedDevice ? 120 : 190) : 820;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const aqua = new THREE.Color(0x55e3dc);
    const amber = new THREE.Color(0xf2ad56);
    const paper = new THREE.Color(0xd8d3c7);

    for (let index = 0; index < particleCount; index += 1) {
      const offset = index * 3;
      const radius = 1.15 + Math.random() * 4.7;
      const angle = Math.random() * Math.PI * 2;
      positions[offset] = Math.cos(angle) * radius + (Math.random() - .5) * 2.3;
      positions[offset + 1] = Math.sin(angle) * radius * .52 + (Math.random() - .5) * 1.7;
      positions[offset + 2] = (Math.random() - .5) * 7;

      const color = index % 23 === 0 ? amber : (index % 9 === 0 ? paper : aqua);
      colors[offset] = color.r;
      colors[offset + 1] = color.g;
      colors[offset + 2] = color.b;
    }

    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pointGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const points = new THREE.Points(pointGeometry, new THREE.PointsMaterial({
      size: compact ? .034 : .027,
      transparent: true,
      opacity: compact ? .44 : .56,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    }));
    group.add(points);

    if (!compact) {
      const lineCount = 135;
      const linePositions = new Float32Array(lineCount * 6);
      for (let index = 0; index < lineCount; index += 1) {
        const first = Math.floor(Math.random() * particleCount) * 3;
        const second = Math.floor(Math.random() * particleCount) * 3;
        const offset = index * 6;
        linePositions[offset] = positions[first];
        linePositions[offset + 1] = positions[first + 1];
        linePositions[offset + 2] = positions[first + 2];
        linePositions[offset + 3] = positions[second];
        linePositions[offset + 4] = positions[second + 1];
        linePositions[offset + 5] = positions[second + 2];
      }
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
      group.add(new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({
        color: 0x55e3dc,
        transparent: true,
        opacity: .068,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })));

      const diagnostic = new THREE.LineSegments(
        new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.05, 2)),
        new THREE.LineBasicMaterial({
          color: 0xf2ad56,
          transparent: true,
          opacity: .115,
          blending: THREE.AdditiveBlending,
        })
      );
      diagnostic.position.set(2.65, -.55, -2.1);
      group.add(diagnostic);
    }

    const pointer = new THREE.Vector2();
    const pointerTarget = new THREE.Vector2();
    let visible = false;
    let running = false;
    let lastFrame = 0;

    window.addEventListener("pointermove", (event) => {
      pointerTarget.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointerTarget.y = -((event.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });

    function resize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1 : 1.25));
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    }
    window.addEventListener("resize", resize, { passive: true });

    function animate(time) {
      if (!visible || document.hidden) {
        running = false;
        return;
      }
      running = true;
      requestAnimationFrame(animate);
      const fps = compact ? (constrainedDevice ? 15 : 20) : 36;
      if (time - lastFrame < 1000 / fps) return;
      lastFrame = time;

      pointer.lerp(pointerTarget, .045);
      const worldRect = world.getBoundingClientRect();
      const worldTravel = Math.max(1, world.offsetHeight - window.innerHeight);
      const progress = THREE.MathUtils.clamp(-worldRect.top / worldTravel, 0, 1);
      group.rotation.y += compact ? .00035 : .0006;
      group.rotation.x = progress * .32 + pointer.y * .035;
      group.position.x = pointer.x * .15;
      group.position.y = -pointer.y * .09;
      camera.position.x += (pointer.x * .14 - camera.position.x) * .035;
      camera.position.y += (pointer.y * .09 - camera.position.y) * .035;
      renderer.render(scene, camera);
    }

    const observer = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      mount.classList.toggle("is-visible", visible);
      if (visible && !running && !document.hidden) requestAnimationFrame(animate);
    });
    observer.observe(world);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && visible && !running) requestAnimationFrame(animate);
    });

    renderer.render(scene, camera);
  } catch (error) {
    mount.classList.add("is-static");
    console.warn("The lightweight 3D systems background is unavailable.", error);
  }
}
