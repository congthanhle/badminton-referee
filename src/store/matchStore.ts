import { create } from "zustand";

interface MatchStore {
  matchId: string | null;
  setMatchId: (id: string) => void;
}

export const useMatchStore = create<MatchStore>((set) => ({
  matchId: null,
  setMatchId: (id) => set({ matchId: id }),
}));
