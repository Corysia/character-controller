import { Color3, KeyboardEventTypes, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import { Entity } from "./Entity";

export class Player extends Entity {
    constructor(public scene: Scene) {
        super("player", new Vector3(), 0.2, 1, scene);

        // Create a sphere.
        let f = MeshBuilder.CreateSphere(
            this.id,
            {
                diameterX: 1,
                diameterY: 2,
                diameterZ: 1,
                segments: 16
            },
            scene
        );
        f.position = this.position;
        this.mesh = f;

        // Change the color to green.
        var material = new StandardMaterial("material", scene);
        material.diffuseColor = new Color3(0.5, 1, 0.5);
        f.material = material;
        // Register event handlers.
        scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    this.onKeyDown(kbInfo.event.key.toLowerCase());
                    break;
                case KeyboardEventTypes.KEYUP:
                    this.onKeyUp(kbInfo.event.key.toLowerCase());
                    break;
            }
        });
    }

    // When a key is pressed and held.
    onKeyDown(keyCode: any) {
        // Set direction based on the key pressed.
        switch (keyCode) {
            case "w": // 87: // W key
                this.moveDirection.z = 1;
                break;
            case "a": // 65: // A key
                this.moveDirection.x = -1;
                break;
            case "s": // 83: // S key
                this.moveDirection.z = -1;
                break;
            case "d": // 68: // D key
                this.moveDirection.x = 1;
                break;
        }
    }

    // When a key is released.
    onKeyUp(keyCode: any) {
        // Reset the direction based on the key released
        switch (keyCode) {
            case "w": // W key
                this.moveDirection.z = 0;
                break;
            case "a": // A key
                this.moveDirection.x = 0;
                break;
            case "s": // S key
                this.moveDirection.z = 0;
                break;
            case "d": // D key
                this.moveDirection.x = 0;
                break;
        }
    }

    public override update(): void {
            this.mesh.moveWithCollisions(this.moveDirection.scale(this.moveSpeed * this.scene.getEngine().getDeltaTime() / 1000));
    }

    public set mesh(v : Mesh) {
        this._mesh.dispose();
        this._mesh = v;
    }

    public get mesh() : Mesh {
        return this._mesh;
    }
}