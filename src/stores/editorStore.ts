import { create } from "zustand";

interface EditorState {
  currentPageId: string | null;
  isSaving: boolean;
  lastSaved: Date | null;
  setCurrentPageId: (id: string | null) => void;
  setSaving: (saving: boolean) => void;
  setLastSaved: (date: Date) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  currentPageId: null,
  isSaving: false,
  lastSaved: null,
  setCurrentPageId: (currentPageId) => set({ currentPageId }),
  setSaving: (isSaving) => set({ isSaving }),
  setLastSaved: (lastSaved) => set({ lastSaved, isSaving: false }),
}));
