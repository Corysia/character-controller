import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
// import cannon from "cannon";

import { WebXRFeatureName, WebXRState } from "@babylonjs/core/XR";
import { CannonJSPlugin, PhysicsImpostor } from "@babylonjs/core/Physics";
import { EventState } from "@babylonjs/core/Misc";
import { Color3, Color4, Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths";
import { Engine } from "@babylonjs/core/Engines";
import { Scene, StandardMaterial } from "@babylonjs/core/";
import { FreeCamera, UniversalCamera } from "@babylonjs/core/Cameras";
import { HemisphericLight } from "@babylonjs/core/Lights";
import { Mesh, MeshBuilder, TransformNode } from "@babylonjs/core/Meshes";
import World from "./World";

export default class Main {

    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene: Scene;
    private world: World;
    private camera: UniversalCamera;
    private camRoot: TransformNode;

    constructor() {
        // create the canvas html element and attach it to the webpage
        this.canvas = document.createElement("canvas");
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.canvas.id = "gameCanvas";
        document.body.appendChild(this.canvas);

        // initialize babylon scene and engine
        this.engine = new Engine(this.canvas, true);
        // this.scene = new Scene(this.engine);
        this.scene = Main.CreateScene(this.engine, this.canvas);
        this.world = new World(this.scene);

        this.camera = new UniversalCamera("camera", new Vector3(0, 10, -10), this.scene);
        this.camRoot = new TransformNode("camRoot");
        this.setupCamera();
        this.camera = this.registerCamera();

        window.addEventListener("resize", () => {
            this.engine.resize();
        });

        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            // keyCode 73 = I, need to use this because ev.key === "I" doesn't work on a Mac
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (this.scene.debugLayer.isVisible()) {
                    this.scene.debugLayer.hide();
                } else {
                    this.scene.debugLayer.show();
                }
            }
        });

        // run the main render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
            this.world.update();
        });
    }

    // Registers `beforeRenderUpdate` and `updateCamera` on the scene
    // to run before the main game loop.
    public registerCamera(): UniversalCamera {
        this.scene.registerBeforeRender(() => {
            this.beforeRenderUpdate();
            this.updateCamera();
        });
        return this.camera;
    }

    // Runs code that must happen before the main loop.
    private beforeRenderUpdate(): void {
        this.world.update();
    }

    // Creates the camera.
    private setupCamera(): UniversalCamera {
        // Root camera parent that follows the player.
        this.camRoot = new TransformNode("root");
        this.camRoot.position = new Vector3(0, 0, 0);
        this.camRoot.rotation = new Vector3(0, 0, 0);

        // Rotations along the x-axis (up/down tilting)
        let yTilt = new TransformNode("ytilt");
        yTilt.parent = this.camRoot;

        // The camera points to the root's position.
        this.camera.lockedTarget = this.camRoot.position;
        this.camera.fov = 1.1; // <--- zoom out a bit, default is 0.8 
        this.camera.parent = yTilt;

        this.scene.activeCamera = this.camera;
        return this.camera;
    }

    // Camera follow logic.
    private updateCamera(): void {
        let player = this.world.player;
        // Smooth movement towards the player's position.
        this.camRoot.position = Vector3.Lerp(
            this.camRoot.position,
            player.mesh.position,
            0.4
        );
    }

    public static CreateScene(engine: Engine, canvas: HTMLCanvasElement): Scene {
        // This creates a basic Babylon Scene object (non-mesh)
        var scene = new Scene(engine);

        const gravityVector = new Vector3(0, -9.8, 0);
        // const physicsPlugin = new CannonJSPlugin(cannon);
        // scene.enablePhysics(gravityVector, physicsPlugin);

        const clearColor = Color3.Teal();
        scene.clearColor = new Color4(clearColor.r, clearColor.g, clearColor.b, 1.0);

        var light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
        light.intensity = 0.7;

        // + add new ambient light to make colors pop.
        var ambient = new HemisphericLight("ambient", new Vector3(1, 1, 0), scene);
        ambient.groundColor = new Color3(0.9, 1, 1);
        ambient.intensity = 0.2;

        // Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
        var ground = MeshBuilder.CreateGround("ground1", { width: 50, height: 50, subdivisions: 2 }, scene);
        // ground.physicsImpostor = new PhysicsImpostor(ground, PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.8, restitution: 0.5, disableBidirectionalTransformation: true }, scene);
        ground.checkCollisions = true;
        ground.position.y = -1;
        var groundMaterial = new StandardMaterial("groundMaterial", scene);
        groundMaterial.diffuseColor = Color3.Gray();
        ground.material = groundMaterial;
        ground.material.freeze();

        var box: Mesh = MeshBuilder.CreateBox("box", { size: 1 }, scene);
        box.position.x = 1;
        box.position.z = 3;
        box.checkCollisions = true;

        (async () => {
            await Main.MovingByWebXRController(scene, ground);
        })()

        return scene;
    }

    public static async MovingByWebXRController(scene: Scene, ground: Mesh) {
        var xrHelper = await scene.createDefaultXRExperienceAsync({
            floorMeshes: [ground]
        });

        const xrPhysics = xrHelper.baseExperience.featuresManager.enableFeature(WebXRFeatureName.PHYSICS_CONTROLLERS, "latest", {
            xrInput: xrHelper.input,
            physicsProperties: {
                restitution: 0.5,
                impostorSize: 0.1,
                impostorType: PhysicsImpostor.BoxImpostor
            },
            enableHeadsetImpostor: true
        });

        xrHelper.baseExperience.featuresManager.disableFeature(WebXRFeatureName.TELEPORTATION);

        var webXRInput = await xrHelper.input;

        xrHelper.baseExperience.onStateChangedObservable.add(function (state: WebXRState) {
            switch (state) {
                case WebXRState.IN_XR:
                case WebXRState.ENTERING_XR:
                    webXRInput.xrCamera.position = Vector3.Zero();
                    webXRInput.xrCamera.position.z = -10;
                    webXRInput.xrCamera.position.y = 2;
                    break;
            }
        });

        // https://qiita.com/wjs_fxf/items/37c203e5432ba238dbb8
        webXRInput.onControllerAddedObservable.add((controller) => {
            const moveSpeed = 0.1;
            controller.onMotionControllerInitObservable.add((controller) => {
                if (controller.handness == "left") {
                    let ids = controller.getComponentIds()
                    for (let i = 0; i < ids.length; i++) {
                        let component = controller.getComponent(ids[i])
                        switch (ids[i]) {
                            case "xr-standard-thumbstick":
                                component.onAxisValueChangedObservable.add(function (
                                    eventData: { x: number, y: number }, _: EventState) {
                                    const { x, y } = eventData;

                                    const matrix = new Matrix();
                                    const deviceRotationQuaternion = webXRInput.xrCamera.rotationQuaternion;
                                    Matrix.FromQuaternionToRef(deviceRotationQuaternion, matrix);

                                    const move = new Vector3(x * moveSpeed, 0, -y * moveSpeed);
                                    const addPos = Vector3.TransformCoordinates(move, matrix);
                                    addPos.y = 0;

                                    webXRInput.xrCamera.position = webXRInput.xrCamera.position.add(addPos);
                                })
                                break
                        }
                    }
                } else if (controller.handness == "right") {
                    let ids = controller.getComponentIds()
                    for (let i = 0; i < ids.length; i++) {
                        let component = controller.getComponent(ids[i])
                        switch (ids[i]) {
                            case "xr-standard-thumbstick":
                                var isHorizontalRotate = false;

                                // https://github.com/BabylonJS/js/blob/6a6a5cfc2354fff165d9bae083185ef602440625/src/XR/features/WebXRControllerTeleportation.ts#L573-L576
                                component.onAxisValueChangedObservable.add(function (
                                    eventData: { x: number, y: number }, _: EventState) {
                                    const { x } = eventData;

                                    if (isHorizontalRotate && Math.abs(x) > 0.8) {
                                        isHorizontalRotate = false;

                                        var rotationAngle = Math.PI / 8;
                                        if (x <= 0) {
                                            rotationAngle = -rotationAngle;
                                        }

                                        const eulerAngles = Quaternion.FromEulerAngles(0, rotationAngle, 0);
                                        webXRInput.xrCamera.rotationQuaternion.multiplyInPlace(eulerAngles);
                                    } else if (Math.abs(x) < 0.8) {
                                        isHorizontalRotate = true
                                    }
                                })
                                break
                        }
                    }
                }
            });
        });
    }
}
new Main();