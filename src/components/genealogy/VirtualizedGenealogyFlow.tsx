"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
  Viewport,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FaSpinner, FaExclamationTriangle, FaEye, FaLayerGroup, FaPlus, FaMinus } from 'react-icons/fa';
import CustomizableNode from './CustomizableNode';
import UserDetailsPanel from './UserDetailsPanel';
import { VisualizationOptions } from './VisualizationSettings';

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

interface VirtualizedGenealogyFlowProps {
  userId: number;
  maxLevel?: number;
  initialLayout?: 'vertical' | 'horizontal' | 'radial';
  initialPageSize?: number;
}

/**
 * Virtualized Genealogy Flow Component
 * 
 * A genealogy flow component with virtualization for better performance with large trees
 */
function VirtualizedGenealogyFlow({
  userId,
  maxLevel = 3,
  initialLayout = 'vertical',
  initialPageSize = 20,
}: VirtualizedGenealogyFlowProps) {
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
  
  // State for virtualization
  const [visibleArea, setVisibleArea] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>({ x: 0, y: 0, width: 0, height: 0 });
  
  // State for viewport
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  
  // State for loaded nodes
  const [loadedNodes, setLoadedNodes] = useState<Set<string>>(new Set());
  
  // State for animation
  const [animationInProgress, setAnimationInProgress] = useState(false);
  
  // Get React Flow instance
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // Calculate the visible area when viewport changes
  useEffect(() => {
    if (!reactFlowWrapper.current) return;
    
    const { width, height } = reactFlowWrapper.current.getBoundingClientRect();
    const { x, y, zoom } = viewport;
    
    // Calculate the visible area in flow coordinates
    const visibleX = -x / zoom;
    const visibleY = -y / zoom;
    const visibleWidth = width / zoom;
    const visibleHeight = height / zoom;
    
    setVisibleArea({
      x: visibleX,
      y: visibleY,
      width: visibleWidth,
      height: visibleHeight,
    });
  }, [viewport]);
  
  // Fetch initial genealogy data
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        userId: userId.toString(),
        maxLevel: '1', // Only fetch the first level initially
        pageSize: initialPageSize.toString(),
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
      
      // Mark the root node as loaded
      setLoadedNodes(new Set([data.id.toString()]));
      
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
  }, [userId, initialPageSize, setNodes, setEdges, reactFlowInstance]);
  
  // Fetch data on initial load
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);
  
  // Fetch children for a node
  const fetchNodeChildren = useCallback(async (nodeId: string) => {
    // If the node is already loaded, don't fetch again
    if (loadedNodes.has(nodeId)) return;
    
    setAnimationInProgress(true);
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        userId: nodeId,
        maxLevel: '1', // Only fetch direct children
        pageSize: initialPageSize.toString(),
        includePerformanceMetrics: 'true',
      });
      
      const response = await fetch(`/api/genealogy?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch node children');
      }
      
      const data = await response.json();
      
      // Get the parent node
      const parentNode = nodes.find(node => node.id === nodeId);
      
      if (!parentNode) return;
      
      // Create nodes and edges for the children
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];
      
      // Process children
      if (data.children && data.children.length > 0) {
        const parentX = parentNode.position.x;
        const parentY = parentNode.position.y;
        
        // Calculate positions for children based on layout
        const nodeWidth = visualOptions.nodeWidth;
        const nodeGap = visualOptions.nodeSpacing;
        const verticalGap = visualOptions.levelSpacing;
        const horizontalGap = visualOptions.levelSpacing;
        
        const totalWidth = data.children.length * nodeWidth + (data.children.length - 1) * nodeGap;
        
        let startX, startY, x, y;
        
        if (visualOptions.layout === 'vertical') {
          // Vertical layout (traditional tree)
          startX = parentX - totalWidth / 2 + nodeWidth / 2;
          y = parentY + verticalGap;
          
          data.children.forEach((child: any, index: number) => {
            x = startX + index * (nodeWidth + nodeGap);
            
            const childUser = {
              id: child.id,
              name: child.name,
              email: child.email,
              rankName: child.rank.name,
              level: 1, // Direct children are level 1 from this parent
              downlineCount: child._count.downline,
              createdAt: child.createdAt,
              walletBalance: child.walletBalance,
              performanceMetrics: child.performanceMetrics,
            };
            
            const id = childUser.id.toString();
            
            // Create node
            newNodes.push({
              id,
              type: 'userNode',
              position: { x, y },
              data: {
                user: childUser,
                onExpand: () => handleExpandNode(id),
                onSelect: () => setSelectedUser(childUser),
                isExpanded: expandedNodes.has(id),
                hasChildren: child._count.downline > 0,
                visualOptions,
              },
            });
            
            // Create edge
            newEdges.push({
              id: `e-${nodeId}-${id}`,
              source: nodeId,
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
          });
        } else if (visualOptions.layout === 'horizontal') {
          // Horizontal layout (left to right)
          x = parentX + horizontalGap;
          startY = parentY - totalWidth / 2 + nodeWidth / 2;
          
          data.children.forEach((child: any, index: number) => {
            y = startY + index * (nodeWidth + nodeGap);
            
            const childUser = {
              id: child.id,
              name: child.name,
              email: child.email,
              rankName: child.rank.name,
              level: 1, // Direct children are level 1 from this parent
              downlineCount: child._count.downline,
              createdAt: child.createdAt,
              walletBalance: child.walletBalance,
              performanceMetrics: child.performanceMetrics,
            };
            
            const id = childUser.id.toString();
            
            // Create node
            newNodes.push({
              id,
              type: 'userNode',
              position: { x, y },
              data: {
                user: childUser,
                onExpand: () => handleExpandNode(id),
                onSelect: () => setSelectedUser(childUser),
                isExpanded: expandedNodes.has(id),
                hasChildren: child._count.downline > 0,
                visualOptions,
              },
            });
            
            // Create edge
            newEdges.push({
              id: `e-${nodeId}-${id}`,
              source: nodeId,
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
          });
        } else if (visualOptions.layout === 'radial') {
          // Radial layout
          const radius = horizontalGap;
          const angleStep = (2 * Math.PI) / data.children.length;
          
          data.children.forEach((child: any, index: number) => {
            const angle = index * angleStep;
            x = parentX + radius * Math.cos(angle);
            y = parentY + radius * Math.sin(angle);
            
            const childUser = {
              id: child.id,
              name: child.name,
              email: child.email,
              rankName: child.rank.name,
              level: 1, // Direct children are level 1 from this parent
              downlineCount: child._count.downline,
              createdAt: child.createdAt,
              walletBalance: child.walletBalance,
              performanceMetrics: child.performanceMetrics,
            };
            
            const id = childUser.id.toString();
            
            // Create node
            newNodes.push({
              id,
              type: 'userNode',
              position: { x, y },
              data: {
                user: childUser,
                onExpand: () => handleExpandNode(id),
                onSelect: () => setSelectedUser(childUser),
                isExpanded: expandedNodes.has(id),
                hasChildren: child._count.downline > 0,
                visualOptions,
              },
            });
            
            // Create edge
            newEdges.push({
              id: `e-${nodeId}-${id}`,
              source: nodeId,
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
          });
        }
      }
      
      // Update the nodes and edges
      setNodes(nodes => [...nodes, ...newNodes]);
      setEdges(edges => [...edges, ...newEdges]);
      
      // Mark the node as loaded
      setLoadedNodes(prev => new Set([...prev, nodeId]));
      
      // Update the parent node to show it's expanded
      setNodes(nodes => 
        nodes.map(node => 
          node.id === nodeId 
            ? { 
                ...node, 
                data: { 
                  ...node.data, 
                  isExpanded: true 
                } 
              } 
            : node
        )
      );
    } catch (err) {
      console.error('Error fetching node children:', err);
    } finally {
      setAnimationInProgress(false);
    }
  }, [nodes, edges, setNodes, setEdges, loadedNodes, expandedNodes, visualOptions, initialPageSize, getConnectionType]);
  
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
        isExpanded: expandedNodes.has(rootUser.id.toString()),
        hasChildren: data._count.downline > 0,
        visualOptions,
      },
    });
    
    return { nodes, edges };
  }, [expandedNodes, visualOptions]);
  
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
    // Check if the node is already expanded
    if (expandedNodes.has(nodeId)) {
      // Collapse the node
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });
      
      // Remove all child nodes and edges
      const childEdges = edges.filter(edge => edge.source === nodeId);
      const childNodeIds = childEdges.map(edge => edge.target);
      
      // Recursively remove all descendants
      const descendantIds = new Set<string>();
      
      const addDescendants = (ids: string[]) => {
        ids.forEach(id => {
          if (!descendantIds.has(id)) {
            descendantIds.add(id);
            const childEdges = edges.filter(edge => edge.source === id);
            const childIds = childEdges.map(edge => edge.target);
            addDescendants(childIds);
          }
        });
      };
      
      addDescendants(childNodeIds);
      
      // Remove all descendant nodes and edges
      setNodes(nodes => nodes.filter(node => !descendantIds.has(node.id)));
      setEdges(edges => edges.filter(edge => 
        !descendantIds.has(edge.target) && !descendantIds.has(edge.source)
      ));
      
      // Update the parent node to show it's collapsed
      setNodes(nodes => 
        nodes.map(node => 
          node.id === nodeId 
            ? { 
                ...node, 
                data: { 
                  ...node.data, 
                  isExpanded: false 
                } 
              } 
            : node
        )
      );
    } else {
      // Expand the node
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        newSet.add(nodeId);
        return newSet;
      });
      
      // Fetch children for the node
      fetchNodeChildren(nodeId);
    }
  }, [expandedNodes, edges, setNodes, setEdges, fetchNodeChildren]);
  
  // Handle node click
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const user = node.data.user as User;
    setSelectedUser(user);
  }, []);
  
  // Handle viewport change
  const handleViewportChange = useCallback((viewport: Viewport) => {
    setViewport(viewport);
  }, []);
  
  // Filter nodes based on visible area
  const visibleNodes = useMemo(() => {
    // If we have few nodes, don't filter
    if (nodes.length < 100) return nodes;
    
    // Add padding to the visible area
    const padding = 500; // pixels
    const paddedArea = {
      x: visibleArea.x - padding / viewport.zoom,
      y: visibleArea.y - padding / viewport.zoom,
      width: visibleArea.width + (2 * padding) / viewport.zoom,
      height: visibleArea.height + (2 * padding) / viewport.zoom,
    };
    
    return nodes.filter(node => {
      const nodeX = node.position.x;
      const nodeY = node.position.y;
      const nodeWidth = visualOptions.nodeWidth;
      const nodeHeight = visualOptions.nodeHeight;
      
      // Check if the node is within the padded visible area
      return (
        nodeX + nodeWidth >= paddedArea.x &&
        nodeX <= paddedArea.x + paddedArea.width &&
        nodeY + nodeHeight >= paddedArea.y &&
        nodeY <= paddedArea.y + paddedArea.height
      );
    });
  }, [nodes, visibleArea, viewport.zoom, visualOptions.nodeWidth, visualOptions.nodeHeight]);
  
  // Filter edges based on visible nodes
  const visibleEdges = useMemo(() => {
    // If we have few edges, don't filter
    if (edges.length < 100) return edges;
    
    const visibleNodeIds = new Set(visibleNodes.map(node => node.id));
    
    return edges.filter(edge => 
      visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );
  }, [edges, visibleNodes]);
  
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
      {/* Flow chart */}
      <div className="h-[600px] relative" ref={reactFlowWrapper}>
        {animationInProgress && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
            <FaSpinner className="animate-spin text-blue-500 text-2xl" />
          </div>
        )}
        
        <ReactFlow
          nodes={visibleNodes}
          edges={visibleEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          onViewportChange={handleViewportChange}
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
          
          {/* Zoom controls */}
          <Panel position="bottom-left" className="p-0">
            <div className="flex flex-col bg-white rounded-md shadow-md overflow-hidden">
              <button
                onClick={() => reactFlowInstance.zoomIn()}
                className="p-2 hover:bg-gray-100 border-b border-gray-200"
                title="Zoom In"
              >
                <FaPlus />
              </button>
              <button
                onClick={() => reactFlowInstance.zoomOut()}
                className="p-2 hover:bg-gray-100 border-b border-gray-200"
                title="Zoom Out"
              >
                <FaMinus />
              </button>
              <button
                onClick={() => reactFlowInstance.fitView({ padding: 0.2 })}
                className="p-2 hover:bg-gray-100"
                title="Fit View"
              >
                <FaEye />
              </button>
            </div>
          </Panel>
          
          {/* Layout controls */}
          <Panel position="bottom-right" className="p-0">
            <div className="flex bg-white rounded-md shadow-md overflow-hidden">
              <button
                onClick={() => setVisualOptions(prev => ({ ...prev, layout: 'vertical' }))}
                className={`p-2 ${visualOptions.layout === 'vertical' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                title="Vertical Layout"
              >
                <FaLayerGroup className="rotate-0" />
              </button>
              <button
                onClick={() => setVisualOptions(prev => ({ ...prev, layout: 'horizontal' }))}
                className={`p-2 ${visualOptions.layout === 'horizontal' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                title="Horizontal Layout"
              >
                <FaLayerGroup className="rotate-90" />
              </button>
              <button
                onClick={() => setVisualOptions(prev => ({ ...prev, layout: 'radial' }))}
                className={`p-2 ${visualOptions.layout === 'radial' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                title="Radial Layout"
              >
                <FaLayerGroup className="rotate-45" />
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

// Wrap the component with ReactFlowProvider
export default function VirtualizedGenealogyFlowWithProvider(props: VirtualizedGenealogyFlowProps) {
  return (
    <ReactFlowProvider>
      <VirtualizedGenealogyFlow {...props} />
    </ReactFlowProvider>
  );
}
