import { create } from "zustand";
import { persist } from "zustand/middleware";
import { NODES, SECTORS, nodeById, reqsMet } from "./content";

export type Save = {
  salvage: number;
  owned: string[];
  cleared: number;
  k9: "rifle" | "marks" | null;
  radio: "gold" | "exposure" | null;
  auto: boolean;
  muted: boolean;
  buy: (id: string) => void;
  addSalvage: (n: number) => void;
  noteClear: (sectorIndex: number) => void;
  chooseK9: (v: "rifle" | "marks") => void;
  chooseRadio: (v: "gold" | "exposure") => void;
  setAuto: (v: boolean) => void;
  setMuted: (v: boolean) => void;
  reset: () => void;
};

const blank = {
  salvage: 0,
  owned: [] as string[],
  cleared: 0,
  k9: null as Save["k9"],
  radio: null as Save["radio"],
  auto: false,
  muted: false,
};

export const useGame = create<Save>()(
  persist(
    (set, get) => ({
      ...blank,
      buy: (id) => {
        const g = get();
        const node = nodeById(id);
        if (!node || g.owned.includes(id) || g.salvage < node.cost || !reqsMet(g.owned, node)) return;
        set({ salvage: g.salvage - node.cost, owned: [...g.owned, id] });
      },
      addSalvage: (n) => {
        if (n <= 0) return;
        set({ salvage: get().salvage + n });
      },
      noteClear: (index) => {
        const g = get();
        if (index === g.cleared) set({ cleared: Math.min(SECTORS.length, g.cleared + 1) });
      },
      chooseK9: (v) => {
        if (!get().k9) set({ k9: v });
      },
      chooseRadio: (v) => {
        if (!get().radio) set({ radio: v });
      },
      setAuto: (v) => set({ auto: v }),
      setMuted: (v) => set({ muted: v }),
      reset: () => set({ ...blank, owned: [] }),
    }),
    { name: "firebreak-v1", skipHydration: true, version: 1 },
  ),
);

if (typeof window !== "undefined") {
  void useGame.persist.rehydrate();
}

export function ownedCount(): number {
  return NODES.length;
}
