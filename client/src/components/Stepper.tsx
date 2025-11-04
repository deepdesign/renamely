type Step = {
  id: number;
  name: string;
  description?: string;
};

type StepperProps = {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  isCurrentStepComplete?: boolean;
};

export default function Stepper({ steps, currentStep, onStepClick, isCurrentStepComplete = false }: StepperProps) {
  return (
    <ol className="space-y-4 w-full">
      {steps.map((step) => {
        const isCurrent = step.id === currentStep;
        const isComplete = step.id < currentStep;
        const isUpcoming = step.id > currentStep;

        return (
          <li key={step.id}>
            <button
              type="button"
              onClick={() => {
                if ((isComplete || isCurrent) && onStepClick) {
                  onStepClick(step.id);
                }
              }}
              disabled={isUpcoming}
              className={`w-full p-4 rounded-lg text-left transition-colors ${
                isCurrent
                  ? 'text-blue-700 bg-blue-100 border border-blue-300 dark:bg-gray-800 dark:border-blue-800 dark:text-blue-400'
                  : isComplete
                  ? 'text-green-700 border border-green-300 bg-green-50 dark:bg-gray-800 dark:border-green-800 dark:text-green-400'
                  : 'text-gray-900 bg-gray-100 border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
              } ${isUpcoming ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:shadow-md'}`}
              role="alert"
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`Step ${step.id}: ${step.name}${isComplete ? ' (completed)' : isCurrent ? ' (current)' : ' (upcoming)'}`}
            >
              <div className="flex items-center justify-between">
                <span className="sr-only">{step.name}</span>
                <h3 className="font-medium">{step.id}. {step.name}</h3>
                {(isComplete || isCurrent) && (
                  <div className="flex items-center justify-end flex-shrink-0 ml-2">
                    {isComplete ? (
                      <svg
                        className="w-4 h-4"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 16 12"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M1 5.917 5.724 10.5 15 1.5"
                        />
                      </svg>
                    ) : isCurrent ? (
                      <svg
                        className="rtl:rotate-180 w-4 h-4"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 14 10"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M1 5h12m0 0L9 1m4 4L9 9"
                        />
                      </svg>
                    ) : null}
                  </div>
                )}
              </div>
              {step.description && (
                <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">{step.description}</p>
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
