/**
 * Digital Zen Garden - Three.js Scene
 * A interactive, neon-lit digital landscape with ripple effects and floating tech geometry.
 */

class ZenGardenScene {
    constructor() {
        this.container = document.getElementById('hero-canvas');
        if (!this.container) return;

        this.scene = new THREE.Scene();
        // Camera positioned to look slightly down and to the right
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.container,
            antialias: true,
            alpha: true
        });

        this.clock = new THREE.Clock();
        this.mouse = new THREE.Vector2();
        this.targetMouse = new THREE.Vector2();
        // Raycaster for interaction
        this.raycaster = new THREE.Raycaster();
        this.plane = null; // The sand plane
        
        // Ripple variables
        this.ripplePos = new THREE.Vector2(-100, -100); 
        this.currentRippleTime = 0;

        // Scene objects
        this.techStones = [];
        this.particles = null;
        
        this.init();
    }

    init() {
        this.setupRenderer();
        this.setupCamera();
        this.setupPostProcessing();
        
        this.createDigitalSand();
        this.createTechStones();
        this.createDigitalFlora();
        this.createLights();
        
        this.addEventListeners();
        this.animate();
    }

    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x0a0f1a, 1);
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
    }

    setupCamera() {
        // Position camera to have a nice view of the "garden" which will be offset to the right
        this.camera.position.set(0, 5, 12);
        this.camera.lookAt(2, 0, 0); // Look slightly to the right
    }

    setupPostProcessing() {
        this.composer = new THREE.EffectComposer(this.renderer);
        
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.2,  // strength
            0.5,  // radius
            0.1   // threshold
        );
        this.composer.addPass(bloomPass);
    }

    createDigitalSand() {
        // Create a large plane for the "sand"
        const geometry = new THREE.PlaneGeometry(30, 20, 128, 128); // High segment count for waves
        
        // Custom Shader Material for Digital Sand
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0x0a0f1a) },
                uGridColor: { value: new THREE.Color(0x00f5ff) },
                uMouse: { value: new THREE.Vector2(-100, -100) },
                uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                uRippleStrength: { value: 0.0 }
            },
            vertexShader: `
                uniform float uTime;
                uniform vec2 uMouse;
                varying vec2 vUv;
                varying float vElevation;
                varying vec3 vWorldPosition;

                void main() {
                    vUv = uv;
                    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
                    
                    // Base gentle wave
                    float elevation = sin(modelPosition.x * 2.0 + uTime * 0.2) * 0.1;
                    elevation += sin(modelPosition.z * 1.5 + uTime * 0.3) * 0.1;

                    // Ripple interaction based on distance to mouse interaction point
                    // We'll calculate this in world space for simplicity in this demo scene
                    // In a full implementation, we might use a render target for persistent ripples
                    
                    float dist = distance(modelPosition.xz, uMouse);
                    float ripple = sin(dist * 10.0 - uTime * 5.0) * exp(-dist * 2.0);
                    
                    // Only apply ripple if close
                    if(dist < 5.0) {
                         elevation += ripple * 0.3;
                    }

                    modelPosition.y += elevation;
                    vElevation = elevation;
                    vWorldPosition = modelPosition.xyz;

                    vec4 viewPosition = viewMatrix * modelPosition;
                    vec4 projectedPosition = projectionMatrix * viewPosition;
                    gl_Position = projectedPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                uniform vec3 uGridColor;
                uniform float uTime;
                
                varying vec2 vUv;
                varying float vElevation;
                varying vec3 vWorldPosition;

                void main() {
                    // Grid effect
                    float gridX = step(0.98, fract(vWorldPosition.x * 2.0)); // Grid lines X
                    float gridZ = step(0.98, fract(vWorldPosition.z * 2.0)); // Grid lines Z
                    float grid = max(gridX, gridZ);
                    
                    // Wave peaks highlight
                    float highlight = smoothstep(0.1, 0.3, vElevation);
                    
                    // Combine colors
                    vec3 finalColor = mix(uColor, uGridColor, grid * 0.15 + highlight * 0.3);
                    
                    // Add a scanner line effect
                    float scan = smoothstep(0.4, 0.6, sin(vWorldPosition.z * 0.5 - uTime) + vWorldPosition.x * 0.1);
                    finalColor += uGridColor * scan * 0.1;

                    // Distance fog/fade
                    float alpha = 1.0 - smoothstep(5.0, 15.0, distance(vWorldPosition.xz, vec2(0.0)));

                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });

        this.plane = new THREE.Mesh(geometry, material);
        this.plane.rotation.x = -Math.PI / 2;
        this.plane.position.y = -2;
        this.scene.add(this.plane);
    }

    createTechStones() {
        // Create a cluster of "stones" on the right side
        // Updated to Neon Style - Refined (Less bright body, sharper wireframe)
        const stoneMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x00f5ff,         // Cyan base
            emissive: 0x00f5ff,      // Glows with cyan
            emissiveIntensity: 0.1,  // Reduced glow (was 0.5)
            metalness: 0.9,
            roughness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            transparent: true,
            opacity: 0.2             // Much more transparent (was 0.8)
        });

        // Brighter wireframe
        const wireframeMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00f5ff,         // Ensure bright Cyan color matches theme
            transparent: true, 
            opacity: 1.0,            // Fully opaque (was 0.8)
            linewidth: 2 
        });

        // Helper to create a stone
        const createStone = (pos, scale) => {
            const geometry = new THREE.IcosahedronGeometry(1, 0); // Low poly look
            const mesh = new THREE.Mesh(geometry, stoneMaterial);
            mesh.position.copy(pos);
            mesh.scale.set(scale, scale, scale);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            // Add wireframe glow
            const wireframe = new THREE.LineSegments(new THREE.WireframeGeometry(geometry), wireframeMaterial);
            mesh.add(wireframe);

            this.scene.add(mesh);
            this.techStones.push({ mesh, speed: Math.random() * 0.2 + 0.1 });
        };

        // Main cluster on the right
        createStone(new THREE.Vector3(4, -1, 0), 1.5);
        createStone(new THREE.Vector3(6, -1.5, 2), 1.0);
        createStone(new THREE.Vector3(3, -1.8, 2.5), 0.7);
        createStone(new THREE.Vector3(5, 0.5, -2), 0.5); // Floating one
    }

    createDigitalFlora() {
        // Floating particles rising from the stones
        const particleCount = 300;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const randoms = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            // Spawn around the stones area (x: 2 to 7, z: -3 to 3)
            positions[i * 3] = 2 + Math.random() * 5;     // x
            positions[i * 3 + 1] = -2 + Math.random() * 3; // y
            positions[i * 3 + 2] = -3 + Math.random() * 6; // z
            
            randoms[i] = Math.random();
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0x00f5ff) },
                uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
                uSize: { value: 50.0 }
            },
            vertexShader: `
                uniform float uTime;
                uniform float uPixelRatio;
                uniform float uSize;
                attribute float aRandom;
                varying float vAlpha;

                void main() {
                    vec3 pos = position;
                    // Rise up
                    pos.y += mod(uTime * 0.5 + aRandom * 10.0, 5.0);
                    
                    // Gentle spiral
                    pos.x += sin(uTime * 0.5 + aRandom * 10.0) * 0.2;
                    pos.z += cos(uTime * 0.3 + aRandom * 10.0) * 0.2;

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    gl_PointSize = uSize * uPixelRatio * (1.0 / -mvPosition.z) * aRandom;
                    
                    // Fade out at top
                    vAlpha = 1.0 - smoothstep(-2.0, 3.0, pos.y);
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                varying float vAlpha;

                void main() {
                    float r = distance(gl_PointCoord, vec2(0.5));
                    if (r > 0.5) discard;
                    
                    float glow = 1.0 - (r * 2.0);
                    glow = pow(glow, 1.5);
                    
                    gl_FragColor = vec4(uColor, glow * vAlpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createLights() {
        const ambientLight = new THREE.AmbientLight(0x000000);
        this.scene.add(ambientLight);

        // Tech blue light from the right
        const rectLight = new THREE.PointLight(0x00f5ff, 2, 20);
        rectLight.position.set(5, 5, 5);
        this.scene.add(rectLight);

        // Warm accent light from bottom left
        const accentLight = new THREE.PointLight(0xff6b6b, 1, 20);
        accentLight.position.set(-5, 0, 5);
        this.scene.add(accentLight);
    }

    addEventListeners() {
        window.addEventListener('resize', this.onResize.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.composer.setSize(window.innerWidth, window.innerHeight);

        if (this.plane) {
            this.plane.material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
        }
    }

    onMouseMove(event) {
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const elapsedTime = this.clock.getElapsedTime();

        // Raycasting for "Sand" interaction
        if (this.plane) {
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObject(this.plane);

            if (intersects.length > 0) {
                // Update shader uniform with world hit point
                this.plane.material.uniforms.uMouse.value.copy(intersects[0].point);
            } else {
                // Move influence away if not hitting plane (or smooth fade out logic could be better)
                // For now, keep last position or move far away?
                // dragging it slowly away looks smoother usually, but let's just leave it at last pos
            }

            this.plane.material.uniforms.uTime.value = elapsedTime;
        }

        // Animate Stones (Gentle float)
        this.techStones.forEach((obj, i) => {
            const speed = obj.speed;
            obj.mesh.position.y += Math.sin(elapsedTime * speed + i) * 0.002;
            obj.mesh.rotation.y += 0.002;
            obj.mesh.rotation.x += 0.001;
        });

        // Animate particles
        if (this.particles) {
            this.particles.material.uniforms.uTime.value = elapsedTime;
        }

        // Slight Camera Parallax based on mouse
        this.camera.position.x += (this.mouse.x * 0.5 - this.camera.position.x) * 0.05;
        this.camera.position.y += (5 + this.mouse.y * 0.2 - this.camera.position.y) * 0.05;
        this.camera.lookAt(2, 0, 0);

        this.composer.render();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new ZenGardenScene();
});
