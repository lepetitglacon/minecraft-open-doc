import * as THREE from 'three';

export class SceneManager {
  public readonly scene: THREE.Scene;
  public readonly renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private resizeObserver: ResizeObserver;

  constructor(container: HTMLElement) {
    this.container = container;

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    // Create renderer with Minecraft-style settings
    this.renderer = new THREE.WebGLRenderer({
      antialias: false, // Pixelated look
      alpha: true,
      premultipliedAlpha: false,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Add to container
    container.appendChild(this.renderer.domElement);

    // Handle resize
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);
    this.handleResize();
  }

  private handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.renderer.setSize(width, height);
  }

  getSize(): { width: number; height: number } {
    return {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    };
  }

  add(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  remove(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  clear(): void {
    while (this.scene.children.length > 0) {
      const child = this.scene.children[0];
      this.scene.remove(child);
    }
  }

  render(camera: THREE.Camera): void {
    this.renderer.render(this.scene, camera);
  }

  dispose(): void {
    this.resizeObserver.disconnect();
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
