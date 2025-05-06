"use client";

import { useState } from 'react';
import { 
  FaCog, 
  FaPalette, 
  FaTree, 
  FaArrowsAlt, 
  FaEye, 
  FaChevronDown, 
  FaChevronUp,
  FaCheck
} from 'react-icons/fa';

export interface VisualizationOptions {
  layout: 'vertical' | 'horizontal' | 'radial';
  nodeSpacing: number;
  levelSpacing: number;
  theme: 'light' | 'dark' | 'colorful';
  showPerformanceMetrics: boolean;
  animateChanges: boolean;
  showMinimap: boolean;
  showControls: boolean;
  nodeBorderRadius: number;
  connectionType: 'straight' | 'step' | 'smoothstep' | 'bezier';
  connectionStyle: 'solid' | 'dashed';
  connectionWidth: number;
  nodeWidth: number;
  nodeHeight: number;
}

interface VisualizationSettingsProps {
  options: VisualizationOptions;
  onChange: (options: VisualizationOptions) => void;
  onReset: () => void;
}

const defaultOptions: VisualizationOptions = {
  layout: 'vertical',
  nodeSpacing: 40,
  levelSpacing: 150,
  theme: 'light',
  showPerformanceMetrics: true,
  animateChanges: true,
  showMinimap: true,
  showControls: true,
  nodeBorderRadius: 8,
  connectionType: 'smoothstep',
  connectionStyle: 'solid',
  connectionWidth: 1.5,
  nodeWidth: 200,
  nodeHeight: 150,
};

/**
 * Visualization Settings Component
 * 
 * Provides options for customizing the genealogy visualization
 */
export default function VisualizationSettings({ 
  options, 
  onChange, 
  onReset 
}: VisualizationSettingsProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'layout' | 'appearance' | 'behavior'>('layout');
  
  // Handle option change
  const handleOptionChange = <K extends keyof VisualizationOptions>(
    key: K, 
    value: VisualizationOptions[K]
  ) => {
    onChange({ ...options, [key]: value });
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between border-b"
      >
        <div className="flex items-center">
          <FaCog className="text-blue-500 mr-2" />
          <h3 className="font-medium">Visualization Settings</h3>
        </div>
        {showSettings ? <FaChevronUp /> : <FaChevronDown />}
      </button>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 animate-fade-in">
          {/* Tabs */}
          <div className="flex border-b mb-4">
            <button
              onClick={() => setActiveTab('layout')}
              className={`px-4 py-2 ${
                activeTab === 'layout'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaTree className="inline mr-1" /> Layout
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`px-4 py-2 ${
                activeTab === 'appearance'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaPalette className="inline mr-1" /> Appearance
            </button>
            <button
              onClick={() => setActiveTab('behavior')}
              className={`px-4 py-2 ${
                activeTab === 'behavior'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaArrowsAlt className="inline mr-1" /> Behavior
            </button>
          </div>
          
          {/* Layout Settings */}
          {activeTab === 'layout' && (
            <div className="space-y-4">
              {/* Layout Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Layout Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleOptionChange('layout', 'vertical')}
                    className={`p-2 border rounded-md flex flex-col items-center ${
                      options.layout === 'vertical'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-12 h-12 flex flex-col justify-center items-center mb-1">
                      <div className="w-4 h-4 bg-blue-500 rounded-full mb-1"></div>
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      </div>
                    </div>
                    <span className="text-xs">Vertical</span>
                    {options.layout === 'vertical' && (
                      <FaCheck className="absolute top-1 right-1 text-blue-500" size={12} />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleOptionChange('layout', 'horizontal')}
                    className={`p-2 border rounded-md flex flex-col items-center ${
                      options.layout === 'horizontal'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-12 h-12 flex justify-center items-center mb-1">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-full mr-1"></div>
                        <div className="flex flex-col space-y-2">
                          <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                          <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs">Horizontal</span>
                    {options.layout === 'horizontal' && (
                      <FaCheck className="absolute top-1 right-1 text-blue-500" size={12} />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleOptionChange('layout', 'radial')}
                    className={`p-2 border rounded-md flex flex-col items-center ${
                      options.layout === 'radial'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-12 h-12 flex justify-center items-center mb-1">
                      <div className="relative">
                        <div className="w-4 h-4 bg-blue-500 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                        <div className="w-3 h-3 bg-blue-400 rounded-full absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                        <div className="w-3 h-3 bg-blue-400 rounded-full absolute bottom-0 right-0"></div>
                        <div className="w-3 h-3 bg-blue-400 rounded-full absolute bottom-0 left-0"></div>
                      </div>
                    </div>
                    <span className="text-xs">Radial</span>
                    {options.layout === 'radial' && (
                      <FaCheck className="absolute top-1 right-1 text-blue-500" size={12} />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Node Spacing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Node Spacing: {options.nodeSpacing}px
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={options.nodeSpacing}
                  onChange={(e) => handleOptionChange('nodeSpacing', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              {/* Level Spacing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level Spacing: {options.levelSpacing}px
                </label>
                <input
                  type="range"
                  min="80"
                  max="300"
                  step="10"
                  value={options.levelSpacing}
                  onChange={(e) => handleOptionChange('levelSpacing', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              {/* Node Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Node Width: {options.nodeWidth}px
                  </label>
                  <input
                    type="range"
                    min="150"
                    max="300"
                    step="10"
                    value={options.nodeWidth}
                    onChange={(e) => handleOptionChange('nodeWidth', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Node Height: {options.nodeHeight}px
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="250"
                    step="10"
                    value={options.nodeHeight}
                    onChange={(e) => handleOptionChange('nodeHeight', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleOptionChange('theme', 'light')}
                    className={`p-2 border rounded-md flex flex-col items-center ${
                      options.theme === 'light'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-12 h-12 bg-white border border-gray-300 rounded-md mb-1 flex items-center justify-center">
                      <div className="w-6 h-6 bg-blue-100 border border-blue-200 rounded"></div>
                    </div>
                    <span className="text-xs">Light</span>
                    {options.theme === 'light' && (
                      <FaCheck className="absolute top-1 right-1 text-blue-500" size={12} />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleOptionChange('theme', 'dark')}
                    className={`p-2 border rounded-md flex flex-col items-center ${
                      options.theme === 'dark'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-md mb-1 flex items-center justify-center">
                      <div className="w-6 h-6 bg-blue-900 border border-blue-800 rounded"></div>
                    </div>
                    <span className="text-xs">Dark</span>
                    {options.theme === 'dark' && (
                      <FaCheck className="absolute top-1 right-1 text-blue-500" size={12} />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleOptionChange('theme', 'colorful')}
                    className={`p-2 border rounded-md flex flex-col items-center ${
                      options.theme === 'colorful'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 border border-gray-300 rounded-md mb-1 flex items-center justify-center">
                      <div className="w-6 h-6 bg-gradient-to-br from-green-200 to-blue-200 border border-blue-200 rounded"></div>
                    </div>
                    <span className="text-xs">Colorful</span>
                    {options.theme === 'colorful' && (
                      <FaCheck className="absolute top-1 right-1 text-blue-500" size={12} />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Node Border Radius */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Node Border Radius: {options.nodeBorderRadius}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="16"
                  step="1"
                  value={options.nodeBorderRadius}
                  onChange={(e) => handleOptionChange('nodeBorderRadius', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              {/* Connection Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Connection Type
                </label>
                <select
                  value={options.connectionType}
                  onChange={(e) => handleOptionChange('connectionType', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="straight">Straight</option>
                  <option value="step">Step</option>
                  <option value="smoothstep">Smooth Step</option>
                  <option value="bezier">Bezier</option>
                </select>
              </div>
              
              {/* Connection Style */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Connection Style
                  </label>
                  <select
                    value={options.connectionStyle}
                    onChange={(e) => handleOptionChange('connectionStyle', e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Connection Width: {options.connectionWidth}px
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.5"
                    value={options.connectionWidth}
                    onChange={(e) => handleOptionChange('connectionWidth', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Behavior Settings */}
          {activeTab === 'behavior' && (
            <div className="space-y-4">
              {/* Show Performance Metrics */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showPerformanceMetrics"
                  checked={options.showPerformanceMetrics}
                  onChange={(e) => handleOptionChange('showPerformanceMetrics', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showPerformanceMetrics" className="ml-2 block text-sm text-gray-700">
                  Show Performance Metrics in Nodes
                </label>
              </div>
              
              {/* Animate Changes */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="animateChanges"
                  checked={options.animateChanges}
                  onChange={(e) => handleOptionChange('animateChanges', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="animateChanges" className="ml-2 block text-sm text-gray-700">
                  Animate Changes
                </label>
              </div>
              
              {/* Show Minimap */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showMinimap"
                  checked={options.showMinimap}
                  onChange={(e) => handleOptionChange('showMinimap', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showMinimap" className="ml-2 block text-sm text-gray-700">
                  Show Minimap
                </label>
              </div>
              
              {/* Show Controls */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showControls"
                  checked={options.showControls}
                  onChange={(e) => handleOptionChange('showControls', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showControls" className="ml-2 block text-sm text-gray-700">
                  Show Controls
                </label>
              </div>
            </div>
          )}
          
          {/* Reset Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onReset}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
