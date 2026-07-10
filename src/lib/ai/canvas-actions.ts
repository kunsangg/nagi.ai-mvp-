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
  | 'LITERATURE_SEARCH'      // Advanced search with filters
  | 'CITATION_SEARCH'        // Fetch papers citing or cited by target
  | 'GENERATE_TEXT_NODES'    // Create notes, summaries, hypotheses, tables, questions
  | 'PAPER_ANALYSIS'         // Server fetches abstracts and synthesizes them (e.g. Compare, Extract)
  | 'CANVAS_LAYOUT'          // Layout algorithms
  | 'MANIPULATE_NODES'       // Hide, highlight, color, group, remove
  | 'MANIPULATE_EDGES'       // Connect nodes, label relationships
  | 'EDIT_NODE_CONTENT'      // Update text/title of existing nodes
  | 'NO_OP';                 // Do nothing

export interface ActionPlanStep {
  type: ActionType;
  sourceNodeIds?: string[];
  targetNodeIds?: string[];
  
  // For LITERATURE_SEARCH
  query?: string; 
  filters?: {
    yearFrom?: number;
    yearTo?: number;
    limit?: number;
    author?: string;
    hasCode?: boolean;
    citationMin?: number;
  };
  
  // For CITATION_SEARCH
  citationDirection?: 'cites' | 'cited_by';
  
  // For GENERATE_TEXT_NODES
  generatedNodes?: {
    title: string;
    content: string;
    type: 'note' | 'hypothesis' | 'question' | 'task' | 'table';
  }[];

  // For PAPER_ANALYSIS
  analysisTask?: string; // e.g., "Summarize", "Compare methodologies", "Extract limitations", "Find gaps"
  
  // For CANVAS_LAYOUT
  layoutType?: 'theme' | 'timeline' | 'hierarchy' | 'grid' | 'cleanup';
  
  // For MANIPULATE_NODES
  nodeOperation?: 'remove' | 'highlight' | 'hide' | 'group' | 'color';
  style?: { color?: string; label?: string };
  
  // For MANIPULATE_EDGES
  edgeOperation?: 'add' | 'remove';
  edgeLabel?: string;
  edgeType?: string; // 'supports', 'contradicts', 'references', etc.

  // For EDIT_NODE_CONTENT
  title?: string;
  content?: string;

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
