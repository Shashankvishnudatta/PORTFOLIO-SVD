import { create } from 'zustand';

export enum Stage {
  LOGIN = -1,
  INTRO = 0,
  EDUCATION = 1,
  SKILLS = 2,
  PROJECTS = 3,
  EXPERIENCE = 4,
  CONTACT = 5,
}

interface AppState {
  currentStage: Stage;
  completedStages: number[];
  isTransitioning: boolean;
  
  // Actions
  nextStage: () => void;
  setStage: (stage: Stage) => void;
  completeStage: (stage: Stage, delay?: number) => void;
  setTransitioning: (isTransitioning: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentStage: Stage.LOGIN,
  completedStages: [],
  isTransitioning: false,

  nextStage: () => {
    const { currentStage, isTransitioning } = get();
    // Prevent double triggering
    if (currentStage < Stage.CONTACT && !isTransitioning) {
      set({ isTransitioning: true });
      
      // Delay actual stage change to allow for exit animations if any
      setTimeout(() => {
        set({ currentStage: currentStage + 1 });
        
        // Allow time for camera transition before unlocking
        setTimeout(() => {
            set({ isTransitioning: false });
        }, 2000); // 2 seconds for full travel and settle
      }, 500);
    }
  },

  setStage: (stage) => {
    set({ isTransitioning: true });
    // Small delay to allow transition effect to start
    setTimeout(() => {
        set({ currentStage: stage });
        setTimeout(() => {
            set({ isTransitioning: false });
        }, 1500);
    }, 100);
  },
  
  completeStage: (stage, delay = 1000) => {
    const { completedStages, nextStage } = get();
    if (!completedStages.includes(stage)) {
      set({ completedStages: [...completedStages, stage] });
      // Auto advance after specified delay
      setTimeout(() => {
        nextStage();
      }, delay);
    }
  },

  setTransitioning: (isTransitioning) => set({ isTransitioning }),
}));