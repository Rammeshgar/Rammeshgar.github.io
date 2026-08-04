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
        const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 40);
        camera.position.set(0, 0, 6.7);

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: !compact,
            powerPreference: compact ? "low-power" : "high-performance",
        });
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1 : 1.35));
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        mount.appendChild(renderer.domElement);

        const group = new THREE.Group();
        scene.add(group);

        const particleCount = compact ? (constrainedDevice ? 170 : 240) : 900;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const aqua = new THREE.Color(0x57e6d9);
        const amber = new THREE.Color(0xffb45e);
        const paper = new THREE.Color(0xe9e5da);

        for (let index = 0; index < particleCount; index += 1) {
            const i3 = index * 3;
            const radius = 1.2 + Math.random() * 4.6;
            const angle = Math.random() * Math.PI * 2;
            positions[i3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 2.4;
            positions[i3 + 1] = Math.sin(angle) * radius * 0.54 + (Math.random() - 0.5) * 1.8;
            positions[i3 + 2] = (Math.random() - 0.5) * 7;

            const color = index % 19 === 0 ? amber : (index % 7 === 0 ? paper : aqua);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }

        const pointGeometry = new THREE.BufferGeometry();
        pointGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        pointGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const points = new THREE.Points(
            pointGeometry,
            new THREE.PointsMaterial({
                size: compact ? 0.032 : 0.026,
                transparent: true,
                opacity: compact ? 0.44 : 0.54,
                vertexColors: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                sizeAttenuation: true,
            })
        );
        group.add(points);

        if (!compact) {
            const lineCount = 150;
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
            const lines = new THREE.LineSegments(
                lineGeometry,
                new THREE.LineBasicMaterial({
                    color: 0x57e6d9,
                    transparent: true,
                    opacity: 0.065,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending,
                })
            );
            group.add(lines);

            const signalCore = new THREE.LineSegments(
                new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.15, 2)),
                new THREE.LineBasicMaterial({
                    color: 0xffb45e,
                    transparent: true,
                    opacity: 0.11,
                    blending: THREE.AdditiveBlending,
                })
            );
            signalCore.position.set(2.7, -0.6, -2.2);
            group.add(signalCore);
        }

        const pointer = new THREE.Vector2();
        const pointerTarget = new THREE.Vector2();
        let visible = false;
        let lastFrame = 0;

        window.addEventListener("pointermove", (event) => {
            pointerTarget.x = (event.clientX / window.innerWidth) * 2 - 1;
            pointerTarget.y = -((event.clientY / window.innerHeight) * 2 - 1);
        }, { passive: true });

        const observer = new IntersectionObserver((entries) => {
            visible = entries.some((entry) => entry.isIntersecting);
            mount.classList.toggle("is-visible", visible);
        }, { rootMargin: "0px" });
        observer.observe(world);

        function resize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1 : 1.35));
            renderer.setSize(window.innerWidth, window.innerHeight, false);
        }
        window.addEventListener("resize", resize, { passive: true });

        function animate(time) {
            requestAnimationFrame(animate);
            if (!visible || document.hidden) return;
            const interval = compact ? 1000 / (constrainedDevice ? 18 : 24) : 1000 / 45;
            if (time - lastFrame < interval) return;
            lastFrame = time;

            pointer.lerp(pointerTarget, 0.045);
            const pageProgress = window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            group.rotation.y += compact ? 0.00045 : 0.00075;
            group.rotation.x = pageProgress * 0.34 + pointer.y * 0.035;
            group.position.x = pointer.x * 0.16;
            group.position.y = -pointer.y * 0.1;
            camera.position.x += (pointer.x * 0.16 - camera.position.x) * 0.035;
            camera.position.y += (pointer.y * 0.1 - camera.position.y) * 0.035;
            renderer.render(scene, camera);
        }

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    } catch (error) {
        mount.classList.add("is-static");
        console.warn("The lightweight 3D background is unavailable:", error);
    }
}
