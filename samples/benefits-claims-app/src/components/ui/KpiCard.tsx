import { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  textColor: string;
  bgColor: string;
  description: string;
  customContent?: ReactNode;
  onClick?: () => void;
  isClickable?: boolean;
}

export const KpiCard = ({
  title,
  value,
  icon,
  textColor,
  bgColor,
  description,
  customContent,
  onClick,
  isClickable = false,
}: KpiCardProps) => {
  return (
    <div
      onClick={onClick}
      className={`${bgColor}  glass rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow ${
        isClickable ? 'cursor-pointer hover:border-yellow-400' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {customContent ? (
            customContent
          ) : (
            <>
              <p className={`text-sm font-medium ${textColor} mb-1`}>{title}</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
              <p className="text-xs text-gray-500">{description}</p>
            </>
          )}
        </div>
        <div className={textColor}>{icon}</div>
      </div>
    </div>
  );
};
