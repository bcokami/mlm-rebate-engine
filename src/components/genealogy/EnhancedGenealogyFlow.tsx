"use client";

import { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  NodeTypes,
  ConnectionLineType,
  MarkerType,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FaSpinner, FaSearch, FaFilter, FaChartLine, FaLayerGroup, FaEye } from 'react-icons/fa';
import EnhancedUserNode from './EnhancedUserNode';
import UserDetailsPanel from './UserDetailsPanel';
import GenealogyControls from './GenealogyControls';
import SimpleFilters from './SimpleFilters';

// Define custom node types
const nodeTypes: NodeTypes = {
  userNode: EnhancedUserNode,
};

// Interface for user data
interface User {
  id: number;
  name: string;
  email: string;
  rankName: string;
  level: number;
  downlineCount: number;
  walletBalance?: number;
  createdAt?: string;
  children?: User[];
  performanceMetrics?: {
    personalSales: number;
    teamSales: number;
    totalSales: number;
    rebatesEarned: number;
    teamSize: number;
    newTeamMembers: number;
    activityScore: number;
  } | null;
}

interface EnhancedGenealogyFlowProps {
  userId: number;
  maxLevel?: number;
  initialLayout?: 'horizontal' | 'vertical';
}

/**
 * Enhanced Genealogy Flow Component
 * 
 * An improved version of the genealogy flow with animation and better layout
 */
export default function EnhancedGenealogyFlow({
  userId,
  maxLevel = 3,
  initialLayout = 'vertical',
}: EnhancedGenealogyFlowProps) {
  // State for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // State for loading and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for selected user
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // State for expanded nodes
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // State for layout
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>(initialLayout);
  
  // State for filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<{
    rankId?: number;
    sortBy?: 'name' | 'createdAt' | 'rank' | 'downlineCount';
    sortDirection?: 'asc' | 'desc';
  }>({
    sortBy: 'createdAt',
    sortDirection: 'desc',
  });
  
  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for animation
  const [animationInProgress, setAnimationInProgress] = useState(false);
  
  // Get React Flow instance
  const reactFlowInstance = useReactFlow();
  
  // Fetch genealogy data
  const fetchGenealogyData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        maxLevel: maxLevel.toString(),
        userId: userId.toString(),
        includePerformanceMetrics: 'true',
      });
      
      // Add filter parameters
      if (filterOptions.rankId) {
        params.append('rankId', filterOptions.rankId.toString());
      }
      
      if (filterOptions.sortBy) {
        params.append('sortBy', filterOptions.sortBy);
      }
      
      if (filterOptions.sortDirection) {
        params.append('sortDirection', filterOptions.sortDirection);
      }
      
      // Add search parameter
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      const response = await fetch(`/api/genealogy?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch genealogy data');
      }
      
      const data = await response.json();
      
      // Transform the data into nodes and edges
      const { nodes: flowNodes, edges: flowEdges } = transformDataToFlow(data);
      
      // Animate the transition
      setAnimationInProgress(true);
      
      // Set nodes and edges with animation
      setNodes(flowNodes);
      setEdges(flowEdges);
      
      // Fit view after nodes are rendered
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 });
        setAnimationInProgress(false);
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setAnimationInProgress(false);
    } finally {
      setLoading(false);
    }
  }, [userId, maxLevel, filterOptions, searchQuery, setNodes, setEdges, reactFlowInstance]);
  
  // Fetch data on initial load and when dependencies change
  useEffect(() => {
    fetchGenealogyData();
  }, [fetchGenealogyData]);
  
  // Transform the hierarchical data into nodes and edges for React Flow
  const transformDataToFlow = useCallback((data: any) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Create root node
    const rootUser = {
      id: data.id,
      name: data.name,
      email: data.email,
      rankName: data.rank.name,
      level: 0,
      downlineCount: data._count.downline,
      createdAt: data.createdAt,
      walletBalance: data.walletBalance,
      performanceMetrics: data.performanceMetrics,
    };
    
    nodes.push({
      id: rootUser.id.toString(),
      type: 'userNode',
      position: { x: 0, y: 0 },
      data: {
        user: rootUser,
        onExpand: () => handleExpandNode(rootUser.id.toString()),
        onSelect: () => setSelectedUser(rootUser),
        isExpanded: true,
        hasChildren: data.children && data.children.length > 0,
      },
      className: 'animate-fade-in',
    });
    
    // Process children recursively
    if (data.children && data.children.length > 0) {
      processChildren(data.children, rootUser.id.toString(), 0, 0, 1, nodes, edges);
    }
    
    return { nodes, edges };
  }, []);
  
  // Process children recursively
  const processChildren = useCallback((
    children: any[],
    parentId: string,
    parentX: number,
    parentY: number,
    level: number,
    nodes: Node[],
    edges: Edge[]
  ) => {
    const nodeWidth = 200;
    const nodeGap = 40;
    const verticalGap = 150;
    const horizontalGap = 250;
    
    const totalWidth = children.length * nodeWidth + (children.length - 1) * nodeGap;
    
    let startX, startY, x, y;
    
    if (layout === 'vertical') {
      // Vertical layout (traditional tree)
      startX = parentX - totalWidth / 2 + nodeWidth / 2;
      y = parentY + verticalGap;
      
      children.forEach((child, index) => {
        x = startX + index * (nodeWidth + nodeGap);
        processChild(child, parentId, x, y, level, nodes, edges);
      });
    } else {
      // Horizontal layout (left to right)
      x = parentX + horizontalGap;
      startY = parentY - totalWidth / 2 + nodeWidth / 2;
      
      children.forEach((child, index) => {
        y = startY + index * (nodeWidth + nodeGap);
        processChild(child, parentId, x, y, level, nodes, edges);
      });
    }
  }, [layout]);
  
  // Process a single child
  const processChild = useCallback((
    child: any,
    parentId: string,
    x: number,
    y: number,
    level: number,
    nodes: Node[],
    edges: Edge[]
  ) => {
    const childUser = {
      id: child.id,
      name: child.name,
      email: child.email,
      rankName: child.rank.name,
      level,
      downlineCount: child._count.downline,
      children: child.children,
      createdAt: child.createdAt,
      walletBalance: child.walletBalance,
      performanceMetrics: child.performanceMetrics,
    };
    
    const id = childUser.id.toString();
    
    // Create node
    nodes.push({
      id,
      type: 'userNode',
      position: { x, y },
      data: {
        user: childUser,
        onExpand: () => handleExpandNode(id),
        onSelect: () => setSelectedUser(childUser),
        isExpanded: expandedNodes.has(id),
        hasChildren: child.children && child.children.length > 0,
      },
      className: 'animate-fade-in',
    });
    
    // Create edge
    edges.push({
      id: `e-${parentId}-${id}`,
      source: parentId,
      target: id,
      type: layout === 'vertical' ? 'smoothstep' : 'straight',
      animated: false,
      style: { stroke: '#888', strokeWidth: 1.5 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
        color: '#888',
      },
    });
    
    // Process children recursively if expanded
    if (child.children && child.children.length > 0 && expandedNodes.has(id)) {
      processChildren(child.children, id, x, y, level + 1, nodes, edges);
    }
  }, [expandedNodes, layout, processChildren]);
  
  // Handle node expansion
  const handleExpandNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);
  
  // Handle node click
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const user = node.data.user as User;
    setSelectedUser(user);
  }, []);
  
  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);
  
  // Handle toggle filters
  const handleToggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);
  
  // Handle apply filters
  const handleApplyFilters = useCallback((filters: {
    rankId?: number;
    sortBy?: 'name' | 'createdAt' | 'rank' | 'downlineCount';
    sortDirection?: 'asc' | 'desc';
  }) => {
    setFilterOptions(filters);
  }, []);
  
  // Handle layout toggle
  const handleToggleLayout = useCallback(() => {
    setLayout(prev => prev === 'vertical' ? 'horizontal' : 'vertical');
  }, []);
  
  // Render loading state
  if (loading && nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <FaSpinner className="animate-spin text-blue-500 mr-2" />
        <span>Loading genealogy data...</span>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <h3 className="text-red-800 font-medium">Error loading genealogy data</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col border border-gray-200 rounded-md">
      {/* Controls */}
      <div className="flex items-center justify-between p-3 bg-white border-b">
        <GenealogyControls
          onRefresh={fetchGenealogyData}
          onSearch={handleSearch}
          onToggleFilters={handleToggleFilters}
          showFilters={showFilters}
          isLoading={loading}
        />
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleLayout}
            className="flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
            title={`Switch to ${layout === 'vertical' ? 'horizontal' : 'vertical'} layout`}
          >
            <FaLayerGroup className="mr-1" />
            {layout === 'vertical' ? 'Horizontal' : 'Vertical'} Layout
          </button>
          
          <button
            onClick={() => reactFlowInstance.fitView({ padding: 0.2 })}
            className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            title="Fit view"
          >
            <FaEye className="mr-1" />
            Fit View
          </button>
        </div>
      </div>
      
      {/* Filters */}
      {showFilters && (
        <SimpleFilters
          onApplyFilters={handleApplyFilters}
        />
      )}
      
      {/* Flow chart */}
      <div className="h-[600px] relative">
        {animationInProgress && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
            <FaSpinner className="animate-spin text-blue-500 text-2xl" />
          </div>
        )}
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
          connectionLineType={layout === 'vertical' ? ConnectionLineType.SmoothStep : ConnectionLineType.Straight}
          minZoom={0.1}
          maxZoom={1.5}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        >
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              const user = node.data?.user as User;
              if (!user) return '#eee';
              
              if (user.level === 0) return '#93c5fd'; // Root node (blue)
              
              // Color based on rank
              switch (user.rankName) {
                case 'Starter': return '#f3f4f6';
                case 'Bronze': return '#fef3c7';
                case 'Silver': return '#e5e7eb';
                case 'Gold': return '#fef08a';
                case 'Platinum': return '#dbeafe';
                case 'Diamond': return '#f3e8ff';
                default: return '#eee';
              }
            }}
            maskColor="#ffffff50"
          />
          <Background />
          
          {/* User details panel */}
          {selectedUser && (
            <Panel position="top-right" className="p-0 w-80">
              <UserDetailsPanel
                user={selectedUser}
                onClose={() => setSelectedUser(null)}
                className="max-h-[80vh]"
              />
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
}
