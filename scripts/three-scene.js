/**
 * Three.js 3D Laptop Animation
 * Creates an interactive 3D laptop with rotating app displays
 */

class LaptopScene {
    constructor() {
        this.container = document.getElementById('hero-canvas');
        if (!this.container) return;
        
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();
        this.mouse = { x: 0, y: 0 };
        
        this.init();
        this.createLaptop();
        this.createLights();
        this.createParticles();
        this.addEventListeners();
        this.animate();
    }
    
    init() {
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(4, 2, 6);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.container,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);
    }
    
    createLaptop() {
        this.laptopGroup = new THREE.Group();
        
        // Materials
        const bodyMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x1a1a2e,
            metalness: 0.9,
            roughness: 0.3,
            clearcoat: 0.5
        });
        
        const screenMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x0a0f1a,
            metalness: 0.1,
            roughness: 0.2,
            emissive: 0x0a0f1a,
            emissiveIntensity: 0.3
        });
        
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00f5ff,
            transparent: true,
            opacity: 0.8
        });
        
        // Base (keyboard part)
        const baseGeometry = new THREE.BoxGeometry(3, 0.1, 2);
        const base = new THREE.Mesh(baseGeometry, bodyMaterial);
        base.position.y = 0;
        this.laptopGroup.add(base);
        
        // Keyboard area
        const keyboardGeometry = new THREE.BoxGeometry(2.6, 0.02, 1.6);
        const keyboardMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x0f0f1a,
            metalness: 0.5,
            roughness: 0.6
        });
        const keyboard = new THREE.Mesh(keyboardGeometry, keyboardMaterial);
        keyboard.position.set(0, 0.06, 0);
        this.laptopGroup.add(keyboard);
        
        // Screen frame
        this.screenGroup = new THREE.Group();
        this.screenGroup.position.set(0, 0.05, -1);
        
        const screenFrameGeometry = new THREE.BoxGeometry(3.2, 2, 0.1);
        const screenFrame = new THREE.Mesh(screenFrameGeometry, bodyMaterial);
        screenFrame.position.y = 1;
        this.screenGroup.add(screenFrame);
        
        // Screen display
        const displayGeometry = new THREE.PlaneGeometry(2.8, 1.7);
        this.screenDisplay = new THREE.Mesh(displayGeometry, screenMaterial);
        this.screenDisplay.position.set(0, 1, 0.06);
        this.screenGroup.add(this.screenDisplay);
        
        // Glow edge
        const glowEdgeGeometry = new THREE.BoxGeometry(3.25, 2.05, 0.01);
        const glowEdge = new THREE.Mesh(glowEdgeGeometry, glowMaterial);
        glowEdge.position.set(0, 1, -0.05);
        this.screenGroup.add(glowEdge);
        
        // Screen rotation
        this.screenGroup.rotation.x = -Math.PI / 6;
        this.laptopGroup.add(this.screenGroup);
        
        // Create app icons on screen
        this.createAppIcons();
        
        // Position the whole laptop
        this.laptopGroup.position.set(2, -0.5, 0);
        this.laptopGroup.rotation.y = -Math.PI / 6;
        
        this.scene.add(this.laptopGroup);
    }
    
    createAppIcons() {
        this.appGroup = new THREE.Group();
        
        // Web App Icon
        const webAppGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.05);
        const webAppMaterial = new THREE.MeshBasicMaterial({ color: 0x00f5ff });
        const webApp = new THREE.Mesh(webAppGeometry, webAppMaterial);
        webApp.position.set(-0.8, 1, 0.1);
        this.appGroup.add(webApp);
        
        // Mobile App Icon
        const mobileGeometry = new THREE.BoxGeometry(0.3, 0.5, 0.05);
        const mobileMaterial = new THREE.MeshBasicMaterial({ color: 0xff6b6b });
        const mobileApp = new THREE.Mesh(mobileGeometry, mobileMaterial);
        mobileApp.position.set(0, 1, 0.1);
        this.appGroup.add(mobileApp);
        
        // Desktop App Icon
        const desktopGeometry = new THREE.BoxGeometry(0.7, 0.5, 0.05);
        const desktopMaterial = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
        const desktopApp = new THREE.Mesh(desktopGeometry, desktopMaterial);
        desktopApp.position.set(0.8, 1, 0.1);
        this.appGroup.add(desktopApp);
        
        // Code lines decoration
        for (let i = 0; i < 5; i++) {
            const lineGeometry = new THREE.BoxGeometry(0.3 + Math.random() * 0.8, 0.03, 0.01);
            const lineMaterial = new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? 0x00f5ff : 0x4a5568,
                transparent: true,
                opacity: 0.6
            });
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.position.set(-0.6 + Math.random() * 0.4, 0.4 + i * 0.12, 0.1);
            this.appGroup.add(line);
        }
        
        this.screenGroup.add(this.appGroup);
    }
    
    createLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);
        
        // Main light
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 5, 5);
        this.scene.add(mainLight);
        
        // Cyan accent light
        const cyanLight = new THREE.PointLight(0x00f5ff, 1, 10);
        cyanLight.position.set(-3, 2, 2);
        this.scene.add(cyanLight);
        
        // Coral accent light
        const coralLight = new THREE.PointLight(0xff6b6b, 0.5, 10);
        coralLight.position.set(3, 1, -2);
        this.scene.add(coralLight);
    }
    
    createParticles() {
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 20;
            positions[i + 1] = (Math.random() - 0.5) * 20;
            positions[i + 2] = (Math.random() - 0.5) * 20;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x00f5ff,
            size: 0.05,
            transparent: true,
            opacity: 0.6
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }
    
    addEventListeners() {
        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = this.clock.getElapsedTime();
        
        // Laptop floating animation
        if (this.laptopGroup) {
            this.laptopGroup.position.y = -0.5 + Math.sin(time * 0.8) * 0.15;
            this.laptopGroup.rotation.y = -Math.PI / 6 + Math.sin(time * 0.5) * 0.1;
            
            // Mouse influence
            this.laptopGroup.rotation.x = this.mouse.y * 0.1;
            this.laptopGroup.rotation.z = this.mouse.x * 0.05;
        }
        
        // App icons pulsing
        if (this.appGroup) {
            this.appGroup.children.forEach((child, i) => {
                if (i < 3) {
                    child.scale.setScalar(1 + Math.sin(time * 2 + i) * 0.1);
                }
            });
        }
        
        // Particles rotation
        if (this.particles) {
            this.particles.rotation.y = time * 0.05;
            this.particles.rotation.x = time * 0.02;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LaptopScene();
});
