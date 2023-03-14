import { Scene } from "@babylonjs/core";
import { Entity } from "./Entity";
import { Player } from "./Player";

export default class World {
    player: Player;
    constructor(scene: Scene, public entities: Entity[] = []) {
        this.player = new Player(scene);
        this.add(this.player);
    }

    add(entity: Entity) {
        this.entities.push(entity);
    }

    remove(entity: Entity) {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
    }

    earlyUpdate() {
        this.entities.forEach((e) => e.earlyUpdate());
    }

    update() {
        this.entities.forEach((e) => e.update());
    }

    lateUpdate() {
        this.entities.forEach((e) => e.lateUpdate());
    }
}