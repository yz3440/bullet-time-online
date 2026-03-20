declare module '@mkkellogg/gaussian-splats-3d' {
  export class Viewer {
    constructor(options?: Record<string, unknown>);
    addSplatScene(url: string, options?: Record<string, unknown>): Promise<void>;
    start(): void;
    update(): void;
    render(): void;
    dispose(): void;
  }
}
