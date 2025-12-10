import React from 'react';
import { useStore, Stage } from '../store';
import { CheckCircle, Lock } from 'lucide-react';
import './OverlayEffects.css';

const Overlay: React.FC = () => {
  const { currentStage, completedStages, setStage } = useStore();

  // Hide overlay on login screen
  if (currentStage === Stage.LOGIN) return null;

  // Navigation is unlocked only after the final stage (Contact) is completed
  const isNavigationUnlocked = completedStages.includes(Stage.CONTACT);

  const getHint = () => {
    switch (currentStage) {
      case Stage.INTRO: return "ALIGN THE CORE TO INITIALIZE SYSTEM";
      case Stage.EDUCATION: return "EXPLORE THE GALACTIC KNOWLEDGE SYSTEM";
      case Stage.SKILLS: return "ROTATE CUBE TO MATCH ALIGNMENT MARKERS";
      case Stage.PROJECTS: return "DRAG PLANET TO ORBIT TO DECRYPT DATA";
      case Stage.EXPERIENCE: return "CONNECT THE CHIPS TO POWER THE TIMELINE";
      case Stage.CONTACT: return "ACTIVATE THE NODES TO OPEN PORTAL";
      default: return "";
    }
  };

  const steps = ["BOOT", "EDU", "SKILLS", "PROJECTS", "EXP", "COMM"];

  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex flex-col justify-between p-6">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        
        {/* Logo / System Status */}
        <div>
          <div className="border border-neon-blue/30 bg-black/40 backdrop-blur px-3 py-1 rounded inline-flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isNavigationUnlocked ? 'bg-purple-500 animate-ping' : 'bg-green-500 animate-pulse'}`}></div>
            <span className="text-neon-blue font-orbitron text-xs tracking-widest">SYS.V.1.0</span>
          </div>
          <p className="text-gray-400 font-rajdhani text-[10px] tracking-wider mt-1 opacity-60 ml-1">
            INTERACTIVE PORTFOLIO
          </p>
        </div>

        {/* Stage Steps - Navigation */}
        <div className={`flex gap-2 md:gap-6 ${isNavigationUnlocked ? 'pointer-events-auto' : ''}`}>
          {steps.map((label, idx) => {
             const isActive = currentStage === idx;
             const isStageDone = completedStages.includes(idx);
             
             return (
                <div
                  key={idx}
                  onClick={() => {
                    if (isNavigationUnlocked) {
                       setStage(idx);
                    }
                  }}
                  className={`
                    flex flex-col items-center transition-all duration-500
                    ${isActive ? 'opacity-80 scale-100 glitch-text' : 'opacity-40 scale-90'}
                    ${isNavigationUnlocked ? 'cursor-pointer hover:scale-110 hover:opacity-100' : 'cursor-default'}
                  `}
                >
                  <div
                    className={`
                      w-6 md:w-12 h-1 rounded-full mb-1 transition-all duration-1000
                      ${isStageDone ? 'bg-neon-blue shadow-[0_0_12px_#00f3ff]' : 'bg-gray-700'}
                    `}
                  />
                  <span
                    className={`
                      font-orbitron tracking-widest
                      text-xs md:text-xl lg:text-2xl
                      text-white transition-all duration-300
                      ${isActive ? 'text-neon-blue drop-shadow-[0_0_12px_#00f3ff]' : 'text-gray-300'}
                      hologram-text
                    `}
                  >
                    {label}
                  </span>
                </div>
             );
          })}
        </div>

      </div>

      {/* Footer / Hint */}
      <div className="flex flex-col items-center justify-end pb-8">
        <div className="glass-panel px-6 py-3 rounded-full flex items-center gap-3 animate-pulse">
          {completedStages.includes(currentStage) && !isNavigationUnlocked ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : isNavigationUnlocked ? (
             <div className="w-5 h-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
          ) : (
            <Lock className="w-5 h-5 text-neon-blue" />
          )}
          
          <span className="text-white font-orbitron tracking-widest text-xs md:text-sm hologram-text">
            {isNavigationUnlocked 
              ? "ACCESS GRANTED // SELECT SECTOR"
              : (completedStages.includes(currentStage)
                  ? "SYSTEM UNLOCKED - PROCEEDING..."
                  : getHint()
                )
            }
          </span>
        </div>
      </div>

    </div>
  );
};

export default Overlay;