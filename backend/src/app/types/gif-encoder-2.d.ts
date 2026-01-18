declare module 'gif-encoder-2' {
  import { Writable } from 'stream';

  type Algorithm = 'neuquant' | 'octree';

  class GifEncoder extends Writable {
    constructor(width: number, height: number, algorithm?: Algorithm);

    start(): void;
    finish(): void;

    setDelay(ms: number): void;
    setRepeat(repeat: number): void;
    setQuality(quality: number): void;
    setTransparent(color: number | string): void;
    setDispose(dispose: number): void;
    setFrameRate(fps: number): void;

    addFrame(imageData: Buffer | Uint8Array | Uint8ClampedArray): void;

    on(event: 'data', listener: (chunk: Buffer) => void): this;
    on(event: 'end', listener: () => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
  }

  export default GifEncoder;
}
