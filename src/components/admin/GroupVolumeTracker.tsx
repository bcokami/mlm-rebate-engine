import React, { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaUsers, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface GroupMember {
  id: number;
  name: string;
  personalVolume: number;
  groupVolume: number;
  isActive: boolean;
  level: number;
  children?: GroupMember[];
}

interface GroupVolumeTrackerProps {
  rootMember?: GroupMember;
  maxLevel?: number;
  title?: string;
}

const GroupVolumeTracker: React.FC<GroupVolumeTrackerProps> = ({
  rootMember,
  maxLevel = 6,
  title = "Group Volume Tracker"
}) => {
  // Default data if none provided
  const defaultRootMember: GroupMember = {
    id: 1,
    name: "John Doe",
    personalVolume: 1200,
    groupVolume: 25000,
    isActive: true,
    level: 0,
    children: [
      {
        id: 2,
        name: "Alice Smith",
        personalVolume: 800,
        groupVolume: 12000,
        isActive: true,
        level: 1,
        children: [
          {
            id: 5,
            name: "Bob Johnson",
            personalVolume: 500,
            groupVolume: 3000,
            isActive: true,
            level: 2,
            children: [
              {
                id: 9,
                name: "Charlie Brown",
                personalVolume: 300,
                groupVolume: 300,
                isActive: true,
                level: 3
              }
            ]
          },
          {
            id: 6,
            name: "Diana Prince",
            personalVolume: 700,
            groupVolume: 700,
            isActive: true,
            level: 2
          }
        ]
      },
      {
        id: 3,
        name: "Mark Wilson",
        personalVolume: 600,
        groupVolume: 8000,
        isActive: true,
        level: 1,
        children: [
          {
            id: 7,
            name: "Eve Adams",
            personalVolume: 400,
            groupVolume: 2400,
            isActive: false,
            level: 2,
            children: [
              {
                id: 10,
                name: "Frank Miller",
                personalVolume: 200,
                groupVolume: 200,
                isActive: true,
                level: 3
              }
            ]
          }
        ]
      },
      {
        id: 4,
        name: "Sarah Lee",
        personalVolume: 900,
        groupVolume: 3200,
        isActive: true,
        level: 1,
        children: [
          {
            id: 8,
            name: "George Davis",
            personalVolume: 350,
            groupVolume: 350,
            isActive: true,
            level: 2
          }
        ]
      }
    ]
  };
  
  // Use provided data or defaults
  const root = rootMember || defaultRootMember;
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="flex items-center text-sm">
            <span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span>
            <span>Active</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="w-3 h-3 rounded-full bg-red-500 mr-1"></span>
            <span>Inactive</span>
          </div>
          <div className="flex items-center text-sm ml-4">
            <span className="font-medium mr-1">PV:</span>
            <span>Personal Volume</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="font-medium mr-1">GV:</span>
            <span>Group Volume</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <TreeNode node={root} maxLevel={maxLevel} />
        </div>
      </div>
    </div>
  );
};

interface TreeNodeProps {
  node: GroupMember;
  maxLevel: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, maxLevel }) => {
  const [expanded, setExpanded] = useState(node.level < 1); // Auto-expand first level
  
  const hasChildren = node.children && node.children.length > 0;
  const canExpand = hasChildren && node.level < maxLevel;
  
  // Calculate progress percentage for the progress bar
  const progressPercentage = (node.personalVolume / node.groupVolume) * 100;
  
  return (
    <div className={`mb-2 ${node.level > 0 ? 'ml-6' : ''}`}>
      <div className={`p-3 rounded-lg border ${node.isActive ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <div className="flex items-center">
          {canExpand ? (
            <button 
              onClick={() => setExpanded(!expanded)} 
              className="mr-2 text-gray-500 hover:text-gray-700"
            >
              {expanded ? <FaChevronDown /> : <FaChevronRight />}
            </button>
          ) : (
            <span className="mr-2 w-4"></span>
          )}
          
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${node.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {node.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
          </div>
          
          <div className="flex-1">
            <div className="flex flex-wrap justify-between items-center">
              <div className="font-medium text-gray-900">{node.name}</div>
              <div className="text-sm text-gray-500">Level {node.level}</div>
            </div>
            
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Personal Volume</div>
                <div className="font-medium">₱{node.personalVolume.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Group Volume</div>
                <div className="font-medium">₱{node.groupVolume.toLocaleString()}</div>
              </div>
            </div>
            
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>PV Contribution</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${node.isActive ? 'bg-green-500' : 'bg-red-500'}`} 
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {expanded && hasChildren && (
        <div className="mt-2 border-l-2 border-gray-200 pl-2">
          {node.children?.map(child => (
            <TreeNode key={child.id} node={child} maxLevel={maxLevel} />
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupVolumeTracker;
