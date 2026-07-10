export interface CanvasContextNode {
  id: string;
  openAlexId?: string;
  title: string;
  authors: string[];
  year?: number;
  type: string;
  citations?: number;
  field?: string;
  x: number;
  y: number;
}

export interface CanvasContextEdge {
  source: string;
  target: string;
  type: string;
}

export interface CanvasContext {
  command: string;
  nodes: CanvasContextNode[];
  edges: CanvasContextEdge[];
  selectedNodeIds: string[];
}

export type ActionType = 
  | 'FIND_RELATED'           // Find papers related to source nodes
  | 'SEARCH_AND_ADD'         // Search by query and add
  | 'ORGANIZE_BY_THEME'      // Cluster existing nodes
  | 'ORGANIZE_BY_YEAR'       // Timeline layout
  | 'ADD_MISSING_FOUNDATIONAL' // Find highly cited older papers related to focus
  | 'FIND_OPPOSING_EVIDENCE' // Find contradicting papers
  | 'CLEANUP_LAYOUT'         // Run deterministic layout cleanup
  | 'REMOVE_NODES'           // Delete specific nodes
  | 'NO_OP';                 // Do nothing

export interface ActionPlanStep {
  type: ActionType;
  sourceNodeIds?: string[];
  targetNodeIds?: string[];
  query?: string; // For SEARCH_AND_ADD
  filters?: {
    yearFrom?: number;
    yearTo?: number;
    limit?: number;
  };
  reason: string;
  confidence: number;
}

export interface ActionPlan {
  intent: string;
  reasoning_summary: string;
  requiresRetrieval: boolean;
  actions: ActionPlanStep[];
}

// Low-level mutations that the frontend understands
export interface CanvasMutationOp {
  type: "add_nodes" | "add_edges" | "update_nodes" | "remove_nodes" | "remove_edges";
  nodes?: any[];
  edges?: any[];
  updates?: any[];
  nodeIds?: string[];
  edgeIds?: string[];
}
