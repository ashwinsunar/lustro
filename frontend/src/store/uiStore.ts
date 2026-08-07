import { create } from 'zustand';

interface UiStore {
  chatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  chatOpen: false,
  openChat: () => set({ chatOpen: true }),
  closeChat: () => set({ chatOpen: false }),
}));