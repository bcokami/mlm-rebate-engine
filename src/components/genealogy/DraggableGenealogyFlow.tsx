"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
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
  ReactFlowProvider,
  NodeDragHandler,
  OnNodesChange,
  NodeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FaSpinner, FaInfoCircle, FaExclamationTriangle, FaSave, FaTimes } from 'react-icons/fa';
import CustomizableNode from './CustomizableNode';
import UserDetailsPanel from './UserDetailsPanel';
import VisualizationSettings, { VisualizationOptions } from './VisualizationSettings';

// Define custom node types
const nodeTypes: NodeTypes = {
  userNode: CustomizableNode,
};

// Default visualization options
const defaultVisualizationOptions: VisualizationOptions = {
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

interface DraggableGenealogyFlowProps {
  userId: number;
  maxLevel?: number;
  initialLayout?: 'vertical' | 'horizontal' | 'radial';
  allowEditing?: boolean;
  onSaveChanges?: (changes: any) => void;
}

/**
 * Draggable Genealogy Flow Component
 * 
 * An enhanced genealogy flow with drag-and-drop functionality and customization options
 */
function DraggableGenealogyFlow({
  userId,
  maxLevel = 3,
  initialLayout = 'vertical',
  allowEditing = false,
  onSaveChanges,
}: DraggableGenealogyFlowProps) {
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
  
  // State for visualization options
  const [visualOptions, setVisualOptions] = useState<VisualizationOptions>({
    ...defaultVisualizationOptions,
    layout: initialLayout,
  });
  
  // State for tracking changes
  const [hasChanges, setHasChanges] = useState(false);
  const [draggedNodes, setDraggedNodes] = useState<Set<string>>(new Set());
  const [nodeChanges, setNodeChanges] = useState<Record<string, { oldParentId?: string; newParentId?: string }>>({});
  
  // State for animation
  const [animationInProgress, setAnimationInProgress] = useState(false);
  
  // Get React Flow instance
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
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
  }, [userId, maxLevel, setNodes, setEdges, reactFlowInstance]);
  
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
        onEdit: allowEditing ? handleEditUser : undefined,
        onDelete: allowEditing ? handleDeleteUser : undefined,
        onAdd: allowEditing ? handleAddUser : undefined,
        isExpanded: true,
        hasChildren: data.children && data.children.length > 0,
        visualOptions,
      },
      draggable: false, // Root node is not draggable
    });
    
    // Process children recursively
    if (data.children && data.children.length > 0) {
      processChildren(data.children, rootUser.id.toString(), 0, 0, 1, nodes, edges);
    }
    
    return { nodes, edges };
  }, [visualOptions, allowEditing]);
  
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
    const nodeWidth = visualOptions.nodeWidth;
    const nodeGap = visualOptions.nodeSpacing;
    const verticalGap = visualOptions.levelSpacing;
    const horizontalGap = visualOptions.levelSpacing;
    
    const totalWidth = children.length * nodeWidth + (children.length - 1) * nodeGap;
    
    let startX, startY, x, y;
    
    if (visualOptions.layout === 'vertical') {
      // Vertical layout (traditional tree)
      startX = parentX - totalWidth / 2 + nodeWidth / 2;
      y = parentY + verticalGap;
      
      children.forEach((child, index) => {
        x = startX + index * (nodeWidth + nodeGap);
        processChild(child, parentId, x, y, level, nodes, edges);
      });
    } else if (visualOptions.layout === 'horizontal') {
      // Horizontal layout (left to right)
      x = parentX + horizontalGap;
      startY = parentY - totalWidth / 2 + nodeWidth / 2;
      
      children.forEach((child, index) => {
        y = startY + index * (nodeWidth + nodeGap);
        processChild(child, parentId, x, y, level, nodes, edges);
      });
    } else if (visualOptions.layout === 'radial') {
      // Radial layout
      const radius = level * horizontalGap;
      const angleStep = (2 * Math.PI) / children.length;
      
      children.forEach((child, index) => {
        const angle = index * angleStep;
        x = parentX + radius * Math.cos(angle);
        y = parentY + radius * Math.sin(angle);
        processChild(child, parentId, x, y, level, nodes, edges);
      });
    }
  }, [visualOptions]);
  
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
        onEdit: allowEditing ? handleEditUser : undefined,
        onDelete: allowEditing ? handleDeleteUser : undefined,
        onAdd: allowEditing ? handleAddUser : undefined,
        isExpanded: expandedNodes.has(id),
        hasChildren: child.children && child.children.length > 0,
        visualOptions,
        isDragging: draggedNodes.has(id),
      },
      draggable: allowEditing, // Only allow dragging if editing is enabled
    });
    
    // Create edge
    edges.push({
      id: `e-${parentId}-${id}`,
      source: parentId,
      target: id,
      type: getConnectionType(),
      animated: false,
      style: { 
        stroke: '#888', 
        strokeWidth: visualOptions.connectionWidth,
        strokeDasharray: visualOptions.connectionStyle === 'dashed' ? '5,5' : undefined,
      },
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
  }, [expandedNodes, visualOptions, draggedNodes, allowEditing]);
  
  // Get connection type based on visualization options
  const getConnectionType = useCallback(() => {
    switch (visualOptions.connectionType) {
      case 'straight':
        return 'default';
      case 'step':
        return 'step';
      case 'smoothstep':
        return 'smoothstep';
      case 'bezier':
        return 'bezier';
      default:
        return 'smoothstep';
    }
  }, [visualOptions]);
  
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
  
  // Handle node drag start
  const handleNodeDragStart: NodeDragHandler = useCallback((event, node) => {
    if (!allowEditing) return;
    
    setDraggedNodes(prev => {
      const newSet = new Set(prev);
      newSet.add(node.id);
      return newSet;
    });
  }, [allowEditing]);
  
  // Handle node drag stop
  const handleNodeDragStop: NodeDragHandler = useCallback((event, node) => {
    if (!allowEditing) return;
    
    setDraggedNodes(prev => {
      const newSet = new Set(prev);
      newSet.delete(node.id);
      return newSet;
    });
    
    // Find the closest node to drop onto (potential new parent)
    const { x, y } = node.position;
    const nodeWidth = visualOptions.nodeWidth;
    const nodeHeight = visualOptions.nodeHeight;
    const nodeCenter = { x: x + nodeWidth / 2, y: y + nodeHeight / 2 };
    
    // Get all potential parent nodes (excluding the dragged node and its descendants)
    const potentialParents = nodes.filter(n => 
      n.id !== node.id && 
      !isDescendantOf(n.id, node.id)
    );
    
    // Find the closest potential parent
    let closestNode: Node | null = null;
    let closestDistance = Infinity;
    
    potentialParents.forEach(potentialParent => {
      const parentX = potentialParent.position.x;
      const parentY = potentialParent.position.y;
      const parentCenter = { x: parentX + nodeWidth / 2, y: parentY + nodeHeight / 2 };
      
      const distance = Math.sqrt(
        Math.pow(nodeCenter.x - parentCenter.x, 2) + 
        Math.pow(nodeCenter.y - parentCenter.y, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestNode = potentialParent;
      }
    });
    
    // If a close node is found and it's within a reasonable distance
    const dropThreshold = nodeWidth; // Adjust this threshold as needed
    if (closestNode && closestDistance < dropThreshold) {
      // Find the current parent
      const currentParentEdge = edges.find(edge => edge.target === node.id);
      const currentParentId = currentParentEdge?.source;
      
      // If the closest node is different from the current parent
      if (closestNode.id !== currentParentId) {
        // Record the change
        setNodeChanges(prev => ({
          ...prev,
          [node.id]: {
            oldParentId: currentParentId,
            newParentId: closestNode.id,
          },
        }));
        
        // Update edges
        if (currentParentEdge) {
          // Remove the current edge
          setEdges(edges => edges.filter(edge => edge.id !== currentParentEdge.id));
          
          // Add a new edge
          const newEdge: Edge = {
            id: `e-${closestNode.id}-${node.id}`,
            source: closestNode.id,
            target: node.id,
            type: getConnectionType(),
            animated: false,
            style: { 
              stroke: '#888', 
              strokeWidth: visualOptions.connectionWidth,
              strokeDasharray: visualOptions.connectionStyle === 'dashed' ? '5,5' : undefined,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 15,
              height: 15,
              color: '#888',
            },
          };
          
          setEdges(edges => [...edges, newEdge]);
        }
        
        setHasChanges(true);
      }
    }
  }, [allowEditing, nodes, edges, visualOptions, setEdges, getConnectionType]);
  
  // Check if a node is a descendant of another node
  const isDescendantOf = useCallback((potentialParentId: string, nodeId: string) => {
    // Get all edges where the node is the source
    const childEdges = edges.filter(edge => edge.source === nodeId);
    
    // If any of the children is the potential parent, return true
    for (const edge of childEdges) {
      if (edge.target === potentialParentId) {
        return true;
      }
      
      // Recursively check if any of the children's descendants is the potential parent
      if (isDescendantOf(potentialParentId, edge.target)) {
        return true;
      }
    }
    
    return false;
  }, [edges]);
  
  // Custom nodes change handler to track changes
  const handleNodesChange: OnNodesChange = useCallback((changes: NodeChange[]) => {
    // Process the changes
    onNodesChange(changes);
    
    // Check if any of the changes is a position change
    const positionChanges = changes.filter(change => 
      change.type === 'position' && change.position
    );
    
    if (positionChanges.length > 0) {
      setHasChanges(true);
    }
  }, [onNodesChange]);
  
  // Handle edit user
  const handleEditUser = useCallback((userId: number) => {
    // In a real application, this would open a modal or navigate to an edit page
    console.log('Edit user:', userId);
    alert(`Edit user functionality would be implemented here for user ID: ${userId}`);
  }, []);
  
  // Handle delete user
  const handleDeleteUser = useCallback((userId: number) => {
    // In a real application, this would show a confirmation dialog
    console.log('Delete user:', userId);
    alert(`Delete user functionality would be implemented here for user ID: ${userId}`);
  }, []);
  
  // Handle add user
  const handleAddUser = useCallback((parentId: number) => {
    // In a real application, this would open a modal to add a new user
    console.log('Add user under parent:', parentId);
    alert(`Add user functionality would be implemented here under parent ID: ${parentId}`);
  }, []);
  
  // Handle save changes
  const handleSaveChanges = useCallback(() => {
    if (onSaveChanges) {
      onSaveChanges({
        nodeChanges,
        nodePositions: nodes.reduce((acc, node) => {
          acc[node.id] = node.position;
          return acc;
        }, {} as Record<string, { x: number; y: number }>),
      });
    }
    
    setHasChanges(false);
    setNodeChanges({});
  }, [nodeChanges, nodes, onSaveChanges]);
  
  // Handle discard changes
  const handleDiscardChanges = useCallback(() => {
    // Reload the genealogy data
    fetchGenealogyData();
    setHasChanges(false);
    setNodeChanges({});
  }, [fetchGenealogyData]);
  
  // Handle visualization options change
  const handleVisualizationOptionsChange = useCallback((newOptions: VisualizationOptions) => {
    setVisualOptions(newOptions);
  }, []);
  
  // Handle reset visualization options
  const handleResetVisualizationOptions = useCallback(() => {
    setVisualOptions({
      ...defaultVisualizationOptions,
      layout: initialLayout,
    });
  }, [initialLayout]);
  
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
        <h3 className="text-red-800 font-medium flex items-center">
          <FaExclamationTriangle className="mr-2" />
          Error loading genealogy data
        </h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col border border-gray-200 rounded-md">
      {/* Visualization Settings */}
      <div className="mb-4">
        <VisualizationSettings
          options={visualOptions}
          onChange={handleVisualizationOptionsChange}
          onReset={handleResetVisualizationOptions}
        />
      </div>
      
      {/* Flow chart */}
      <div className="h-[600px] relative" ref={reactFlowWrapper}>
        {animationInProgress && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
            <FaSpinner className="animate-spin text-blue-500 text-2xl" />
          </div>
        )}
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onNodeDragStart={handleNodeDragStart}
          onNodeDragStop={handleNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
          connectionLineType={getConnectionType() as ConnectionLineType}
          minZoom={0.1}
          maxZoom={1.5}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        >
          {visualOptions.showControls && <Controls />}
          
          {visualOptions.showMinimap && (
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
          )}
          
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
          
          {/* Changes notification */}
          {hasChanges && allowEditing && (
            <Panel position="bottom-center" className="p-0">
              <div className="bg-yellow-50 border border-yellow-300 p-3 rounded-md shadow-md flex items-center">
                <FaInfoCircle className="text-yellow-500 mr-2" />
                <span className="text-yellow-700">
                  You have unsaved changes to the genealogy structure.
                </span>
                <div className="ml-4 flex space-x-2">
                  <button
                    onClick={handleSaveChanges}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                  >
                    <FaSave className="mr-1" /> Save
                  </button>
                  <button
                    onClick={handleDiscardChanges}
                    className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center"
                  >
                    <FaTimes className="mr-1" /> Discard
                  </button>
                </div>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
}

// Wrap the component with ReactFlowProvider
export default function DraggableGenealogyFlowWithProvider(props: DraggableGenealogyFlowProps) {
  return (
    <ReactFlowProvider>
      <DraggableGenealogyFlow {...props} />
    </ReactFlowProvider>
  );
}
