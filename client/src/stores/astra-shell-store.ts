import { create } from "zustand";

type AstraShellStore = {
  selectedSectionId: string;
  setSelectedSectionId: (sectionId: string) => void;
};

export const useAstraShellStore = create<AstraShellStore>((set) => ({
  selectedSectionId: "oracle",
  setSelectedSectionId: (sectionId) => set({ selectedSectionId: sectionId }),
}));
