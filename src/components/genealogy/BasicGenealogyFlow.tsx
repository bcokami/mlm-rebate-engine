"use client";

import { useState, useCallback, useEffect } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FaSpinner, FaSearch, FaFilter, FaChartLine } from 'react-icons/fa';
import BasicUserNode from './BasicUserNode';
import UserDetailsPanel from './UserDetailsPanel';
import GenealogyControls from './GenealogyControls';
import SimpleFilters from './SimpleFilters';

// Define custom node types
const nodeTypes: NodeTypes = {
  userNode: BasicUserNode,
};

// Simple interface for user data
interface User {
  id: number;
  name: string;
  email: string;
  rankName: string;
  level: number;
  downlineCount: number;
  children?: User[];
  createdAt?: string;
  walletBalance?: number;
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

interface BasicGenealogyFlowProps {
  userId: number;
  maxLevel?: number;
}

/**
 * Basic Genealogy Flow Component
 *
 * A simplified version of the genealogy tree using React Flow
 */
export default function BasicGenealogyFlow({ userId, maxLevel = 3 }: BasicGenealogyFlowProps) {
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

  // Fetch genealogy data
  const fetchGenealogyData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        maxLevel: maxLevel.toString(),
        userId: userId.toString(),
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

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId, maxLevel, filterOptions, searchQuery, setNodes, setEdges]);

  // Fetch data on initial load and when dependencies change
  useEffect(() => {
    fetchGenealogyData();
  }, [fetchGenealogyData]);

  // Transform the hierarchical data into nodes and edges for React Flow
  const transformDataToFlow = (data: any) => {
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
    });

    // Process children recursively
    if (data.children && data.children.length > 0) {
      processChildren(data.children, rootUser.id.toString(), 0, 0, 1, nodes, edges);
    }

    return { nodes, edges };
  };

  // Process children recursively
  const processChildren = (
    children: any[],
    parentId: string,
    parentX: number,
    parentY: number,
    level: number,
    nodes: Node[],
    edges: Edge[]
  ) => {
    const nodeWidth = 180;
    const nodeGap = 30;
    const verticalGap = 150;

    const totalWidth = children.length * nodeWidth + (children.length - 1) * nodeGap;
    const startX = parentX - totalWidth / 2 + nodeWidth / 2;
    const y = parentY + verticalGap;

    children.forEach((child, index) => {
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

      const x = startX + index * (nodeWidth + nodeGap);
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
      });

      // Create edge
      edges.push({
        id: `e-${parentId}-${id}`,
        source: parentId,
        target: id,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#888' },
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
    });
  };

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
      <GenealogyControls
        onRefresh={fetchGenealogyData}
        onSearch={handleSearch}
        onToggleFilters={handleToggleFilters}
        showFilters={showFilters}
        isLoading={loading}
      />

      {/* Filters */}
      {showFilters && (
        <SimpleFilters
          onApplyFilters={handleApplyFilters}
        />
      )}

      {/* Flow chart */}
      <div className="h-[600px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
          connectionLineType={ConnectionLineType.SmoothStep}
        >
          <Controls />
          <MiniMap />
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
