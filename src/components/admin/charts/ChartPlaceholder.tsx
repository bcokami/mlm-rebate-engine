import React from 'react';
import { IconType } from 'react-icons';

interface ChartPlaceholderProps {
  title: string;
  icon: React.ReactNode;
  message?: string;
  subMessage?: string;
  height?: string;
  actions?: React.ReactNode;
}

const ChartPlaceholder: React.FC<ChartPlaceholderProps> = ({
  title,
  icon,
  message = "Chart will be displayed here",
  subMessage = "Coming in the next update",
  height = "h-80",
  actions
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {actions && actions}
      </div>
      <div className={`${height} flex items-center justify-center bg-gray-50 rounded-md`}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mx-auto mb-2 text-gray-300">{icon}</div>
          <p>{message}</p>
          <p className="text-sm">{subMessage}</p>
        </div>
      </div>
    </div>
  );
};

export default ChartPlaceholder;
