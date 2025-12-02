interface MilestoneStep {
  id: string;
  label: string;
  status: 'completed' | 'active' | 'pending' | 'rejected';
}

interface InvoiceMilestoneProps {
  currentStatus?: string;
}

const getMilestoneSteps = (status?: string): MilestoneStep[] => {
  const normalizedStatus = status?.toLowerCase() || '';

  // Define the steps
  const steps: MilestoneStep[] = [
    { id: 'processing', label: 'Processing', status: 'pending' },
    { id: 'review', label: 'Under Review', status: 'pending' },
    { id: 'decision', label: 'Decision', status: 'pending' },
    { id: 'completed', label: 'Completed', status: 'pending' },
  ];

  // Determine current step and update statuses
  if (normalizedStatus === 'processing') {
    steps[0].status = 'active';
  } else if (normalizedStatus === 'pending review' || normalizedStatus === 'under review') {
    steps[0].status = 'completed';
    steps[1].status = 'active';
  } else if (normalizedStatus === 'approved') {
    steps[0].status = 'completed';
    steps[1].status = 'completed';
    steps[2].status = 'completed';
    steps[2].label = 'Approved';
    steps[3].status = 'active';
  } else if (normalizedStatus === 'rejected') {
    steps[0].status = 'completed';
    steps[1].status = 'completed';
    steps[2].status = 'rejected';
    steps[2].label = 'Rejected';
    steps[3].status = 'rejected';
    steps[3].label = 'Closed';
  } else if (normalizedStatus === 'paid') {
    steps[0].status = 'completed';
    steps[1].status = 'completed';
    steps[2].status = 'completed';
    steps[2].label = 'Approved';
    steps[3].status = 'completed';
    steps[3].label = 'Paid';
  }

  return steps;
};

export const InvoiceMilestone = ({ currentStatus }: InvoiceMilestoneProps) => {
  const steps = getMilestoneSteps(currentStatus);

  return (
    <div className="w-full py-6 px-8">
      <div className="flex items-center justify-center gap-0">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`relative flex items-center justify-center h-12 transition-all duration-300 ${
              index === 0 ? 'pl-6 pr-8' : index === steps.length - 1 ? 'pl-8 pr-6' : 'px-8'
            } ${
              step.status === 'completed'
                ? 'bg-green-500 text-white'
                : step.status === 'active'
                ? 'bg-blue-600 text-white'
                : step.status === 'rejected'
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
            style={{
              clipPath:
                index === 0
                  ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                  : index === steps.length - 1
                  ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)'
                  : 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)',
            }}
          >
            <span className="text-sm font-semibold whitespace-nowrap z-10">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
