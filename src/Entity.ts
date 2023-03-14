import { Scene } from "@babylonjs/core";
import { Vector3 } from "@babylonjs/core/Maths";
import { Mesh, MeshBuilder } from "@babylonjs/core/Meshes";

export abstract class Entity {
    public _mesh: Mesh;
    protected moveDirection: Vector3 = new Vector3();
    constructor(
        public id: string,
        public position: Vector3 = new Vector3(),
        public diameter: number = 2,
        public moveSpeed: number = 0.02,
        public scene: Scene
    ) {
        this._mesh = MeshBuilder.CreateSphere(
            this.id,
            {
                diameterX: this.diameter,
                diameterY: this.diameter,
                diameterZ: this.diameter,
                segments: 16
            },
            scene
        );
        this._mesh.position = this.position;
    }

    public earlyUpdate():void {
    }

    public update(): void {
        this._mesh.position = this.position;

    }

    public lateUpdate(): void {
    }
}