import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface CameraOptions {
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  enablePan?: boolean;
}

export class CameraController {
  public readonly camera: THREE.OrthographicCamera;
  public readonly controls: OrbitControls;
  private container: HTMLElement;
  private resizeObserver: ResizeObserver;

  constructor(
    container: HTMLElement,
    renderer: THREE.WebGLRenderer,
    options: CameraOptions = {}
  ) {
    this.container = container;

    const { zoom = 25, minZoom = 5, maxZoom = 200, enablePan = true } = options;

    // Create orthographic camera for isometric view
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.OrthographicCamera(
      -aspect * zoom,
      aspect * zoom,
      zoom,
      -zoom,
      0.1,
      1000
    );

    // Position camera for isometric view
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);

    // Setup OrbitControls
    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.enablePan = enablePan;
    this.controls.minZoom = minZoom / zoom;
    this.controls.maxZoom = maxZoom / zoom;
    this.controls.target.set(0, 0, 0);

    // Handle resize
    this.resizeObserver = new ResizeObserver(() => this.handleResize(zoom));
    this.resizeObserver.observe(container);
  }

  private handleResize(zoom: number): void {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.left = -aspect * zoom;
    this.camera.right = aspect * zoom;
    this.camera.top = zoom;
    this.camera.bottom = -zoom;
    this.camera.updateProjectionMatrix();
  }

  update(): void {
    this.controls.update();
  }

  resetCamera(): void {
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);
    this.controls.target.set(0, 0, 0);
    this.camera.zoom = 1;
    this.camera.updateProjectionMatrix();
  }

  setZoom(level: number): void {
    this.camera.zoom = level;
    this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    this.resizeObserver.disconnect();
    this.controls.dispose();
  }
}
