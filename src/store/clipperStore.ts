import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Clip } from '../types/pipeline';

interface ClipperState {
  clips: Clip[];
  videoInfo: { title: string; id: string } | null;
  setClips: (clips: Clip[]) => void;
  setVideoInfo: (videoInfo: { title: string; id: string } | null) => void;
  clearClips: () => void;
}

export const useClipperStore = create<ClipperState>()(
  persist(
    (set) => ({
      clips: [],
      videoInfo: null,
      setClips: (clips) => set({ clips }),
      setVideoInfo: (videoInfo) => set({ videoInfo }),
      clearClips: () => set({ clips: [], videoInfo: null }),
    }),
    {
      name: 'clipper-storage',
    }
  )
);
