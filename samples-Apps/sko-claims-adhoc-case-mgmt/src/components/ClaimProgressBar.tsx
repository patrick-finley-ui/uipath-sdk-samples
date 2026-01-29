interface ClaimProgressBarProps {
  currentStage: number; // 0-3 (0 = Initial Filing, 1 = Investigation, 2 = Evaluation, 3 = Resolution)
}

const stages = [
  'Initial Filing & Documentation',
  'Investigation & Review',
  'Medical Evaluation & Assessment',
  'Resolution & Settlement',
];

export const ClaimProgressBar = ({ currentStage }: ClaimProgressBarProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
          <div
            className="absolute top-0 left-0 h-full bg-uipath-orange transition-all duration-500"
            style={{ width: `${(currentStage / (stages.length - 1)) * 100}%` }}
          />
        </div>

        {/* Stage Indicators */}
        <div className="relative flex justify-between">
          {stages.map((stage, index) => {
            const isCompleted = index < currentStage;
            const isCurrent = index === currentStage;
            const isPending = index > currentStage;
            
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                {/* Circle Indicator */}
                <div className="relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? 'bg-uipath-orange border-2 border-uipath-orange'
                        : isCurrent
                        ? 'bg-white border-2 border-uipath-orange'
                        : 'bg-white border-2 border-gray-300'
                    }`}
                  >
                    {isCompleted && (
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    {isCurrent && (
                      <div className="w-4 h-4 rounded-full bg-uipath-orange" />
                    )}
                    {isPending && (
                      <div className="w-3 h-3 rounded-full bg-gray-300" />
                    )}
                  </div>
                </div>

                {/* Stage Label */}
                <div className="mt-3 text-center max-w-[160px]">
                  <p
                    className={`text-xs font-medium ${
                      isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {stage}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
