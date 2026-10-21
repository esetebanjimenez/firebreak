import officer from "../assets/sprites/officer.png";
import rifle from "../assets/sprites/rifle.png";
import marks from "../assets/sprites/marks.png";
import militia from "../assets/sprites/militia.png";
import shield from "../assets/sprites/shield.png";
import jug from "../assets/sprites/jug.png";
import gunner from "../assets/sprites/gunner.png";
import boss from "../assets/sprites/boss.png";
import wall from "../assets/sprites/wall.png";
import drone from "../assets/sprites/drone.png";
import tree from "../assets/sprites/tree.png";
import ground from "../assets/sprites/ground.png";
import fxGrenade from "../assets/sprites/fx-grenade.png";
import fxFire from "../assets/sprites/fx-fire.png";
import fxShock from "../assets/sprites/fx-shock.png";
import fxFlash from "../assets/sprites/fx-flash.png";

export type SpriteMap = Record<string, HTMLImageElement | null>;

const URLS: Record<string, string> = {
  officer, rifle, marks, militia, shield, jug, gunner, boss, wall, drone, tree, ground,
  "fx-grenade": fxGrenade,
  "fx-fire": fxFire,
  "fx-shock": fxShock,
  "fx-flash": fxFlash,
};

let pending: Promise<SpriteMap> | null = null;

export function getSprites(): Promise<SpriteMap> {
  if (!pending) {
    pending = Promise.all(
      Object.entries(URLS).map(
        ([key, url]) =>
          new Promise<[string, HTMLImageElement | null]>((resolve) => {
            const img = new Image();
            img.onload = () => resolve([key, img]);
            img.onerror = () => resolve([key, null]);
            img.src = url;
          }),
      ),
    ).then((pairs) => Object.fromEntries(pairs));
  }
  return pending;
}
