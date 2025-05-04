import React from 'react';
import Link from 'next/link';

interface QuickAccessCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  iconBgColor: string;
  iconColor: string;
}

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({
  title,
  description,
  icon,
  href,
  iconBgColor,
  iconColor
}) => {
  return (
    <Link href={href} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center mb-4">
        <div className={`p-3 rounded-full ${iconBgColor} ${iconColor} mr-4`}>
          {icon}
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <p className="text-gray-500 text-sm mb-4">
        {description}
      </p>
    </Link>
  );
};

export default QuickAccessCard;
