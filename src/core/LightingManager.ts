import * as THREE from 'three';

// Minecraft lighting constants (from GuideME)
const DIFFUSE_LIGHT_0_DIR = new THREE.Vector3(0.2, 1.0, -0.7).normalize();
const DIFFUSE_LIGHT_1_DIR = new THREE.Vector3(-0.2, 1.0, 0.7).normalize();
const MINECRAFT_LIGHT_POWER = 0.6;
const MINECRAFT_AMBIENT_LIGHT = 0.4;

export class LightingManager {
  private lights: THREE.Light[] = [];

  constructor(scene: THREE.Scene) {
    this.setupLights(scene);
  }

  private setupLights(scene: THREE.Scene): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, MINECRAFT_AMBIENT_LIGHT);
    scene.add(ambientLight);
    this.lights.push(ambientLight);

    // Directional light 1
    const dirLight1 = new THREE.DirectionalLight(0xffffff, MINECRAFT_LIGHT_POWER);
    dirLight1.position.copy(DIFFUSE_LIGHT_0_DIR);
    scene.add(dirLight1);
    this.lights.push(dirLight1);

    // Directional light 2
    const dirLight2 = new THREE.DirectionalLight(0xffffff, MINECRAFT_LIGHT_POWER);
    dirLight2.position.copy(DIFFUSE_LIGHT_1_DIR);
    scene.add(dirLight2);
    this.lights.push(dirLight2);
  }

  dispose(): void {
    this.lights.forEach((light) => {
      light.parent?.remove(light);
    });
    this.lights = [];
  }
}
