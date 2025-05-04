import React from 'react';
import { IconType } from 'react-icons';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  borderColor: string;
  iconBgColor: string;
  iconColor: string;
  percentageChange?: number;
  footer?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  borderColor,
  iconBgColor,
  iconColor,
  percentageChange,
  footer
}) => {
  // Format the value if it's a number
  const formattedValue = typeof value === 'number' ? 
    value.toLocaleString() : 
    value;

  // Determine if the percentage change is positive, negative, or neutral
  const isPositive = percentageChange && percentageChange > 0;
  const isNegative = percentageChange && percentageChange < 0;
  
  return (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${borderColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold">{formattedValue}</p>
            {percentageChange !== undefined && (
              <span 
                className={`ml-2 text-xs font-medium flex items-center
                  ${isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-gray-500'}`}
              >
                {isPositive ? <FaArrowUp className="mr-1" /> : isNegative ? <FaArrowDown className="mr-1" /> : null}
                {Math.abs(percentageChange)}%
              </span>
            )}
          </div>
          {footer && <p className="text-xs text-gray-500 mt-1">{footer}</p>}
        </div>
        <div className={`p-3 rounded-full ${iconBgColor} ${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
