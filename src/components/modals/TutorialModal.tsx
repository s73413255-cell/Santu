import React from 'react';
import { Check, ArrowRight, X } from 'lucide-react';
import { soundService } from '../../services/sound';

interface TutorialModalProps {
  currentStep: number;
  onNextStep: () => void;
  onClose: () => void;
}

const TUTORIAL_STEPS = [
  {
    step: 1,
    title: 'Welcome to Small Shop Tycoon!',
    desc: 'Customers will automatically enter your shop, pick goods, and head to the checkout counter. Tap the register to speed up checkout!',
    icon: '🏪',
  },
  {
    step: 2,
    title: 'Collect Coins from Sales',
    desc: 'Each item sold deposits shiny coins directly into your register. Watch for floor spills and tap them for bonus coins!',
    icon: '🪙',
  },
  {
    step: 3,
    title: 'Upgrade the Shop',
    desc: 'Open the "Upgrade" tab to expand your store size, boost checkout speed, increase stock, and raise product prices.',
    icon: '⚡',
  },
  {
    step: 4,
    title: 'Unlock New Products',
    desc: 'Head to the "Products" tab to unlock fresh fruits, chilled beverages, crunchy snacks, dairy, and bakery items.',
    icon: '🍎',
  },
  {
    step: 5,
    title: 'Hire Your First Worker',
    desc: 'Hire a cashier to ring up customers automatically, or a restocker and cleaner so your business runs on auto-pilot!',
    icon: '👷',
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({
  currentStep,
  onNextStep,
  onClose,
}) => {
  const stepData = TUTORIAL_STEPS[currentStep - 1] || TUTORIAL_STEPS[0];
  const isLastStep = currentStep >= TUTORIAL_STEPS.length;

  const handleNext = () => {
    soundService.playClick();
    if (isLastStep) {
      onClose();
    } else {
      onNextStep();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-5 text-white relative shadow-2xl animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 mb-3">
          {TUTORIAL_STEPS.map((s) => (
            <div
              key={s.step}
              className={`h-1.5 flex-1 rounded-full ${
                s.step === currentStep
                  ? 'bg-amber-400'
                  : s.step < currentStep
                  ? 'bg-emerald-400'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="text-center py-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-3xl shadow-inner mb-3">
            {stepData.icon}
          </div>
          <span className="text-[10px] bg-slate-800 text-amber-300 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Step {currentStep} of {TUTORIAL_STEPS.length}
          </span>
          <h3 className="text-base font-black text-white mt-2">{stepData.title}</h3>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed px-2">{stepData.desc}</p>
        </div>

        {/* Next / Got it Button */}
        <button
          onClick={handleNext}
          className="w-full mt-4 py-3 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-lg flex items-center justify-center gap-1.5 cartoon-btn hover:brightness-110"
        >
          {isLastStep ? (
            <>
              <Check className="w-4 h-4" />
              <span>START PLAYING!</span>
            </>
          ) : (
            <>
              <span>NEXT STEP</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
