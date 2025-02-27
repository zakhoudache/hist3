import { supabase } from "@/lib/supabase";
import { Node, Edge } from "@/components/KnowledgeGraph/types";

export interface Entity {
  id: string;
  text: string;
  type: "person" | "event" | "place" | "document" | "concept";
  confidence: number;
  offsets: { start: number; end: number }[];
  metadata?: {
    description?: string;
    importance?: number;
    dates?: { start?: string; end?: string };
    category?: string;
  };
}

export interface TextInsight {
  type:
    | "readability"
    | "sentiment"
    | "complexity"
    | "historical_accuracy"
    | "bias";
  score: number;
  summary: string;
  details?: string;
}

export interface AnalysisResult {
  entities: Entity[];
  insights: TextInsight[];
  nodes: Node[];
  edges: Edge[];
}

/**
 * Analyzes text to extract entities, insights, and generate a knowledge graph
 */
export async function analyzeText(text: string): Promise<AnalysisResult> {
  try {
    // Call the Supabase Edge Function for analysis
    const { data, error } = await supabase.functions.invoke("analyze-text", {
      body: { text },
    });

    if (error) {
      throw new Error(error.message);
    }

    // Process entities from the API response
    const entities: Entity[] = data.entities || [];
    const insights: TextInsight[] = data.insights || [];

    // Generate nodes and edges from entities
    const { nodes, edges } = generateGraphFromEntities(entities, text);

    return {
      entities,
      insights,
      nodes,
      edges,
    };
  } catch (error) {
    console.error("Error analyzing text:", error);
    // Return mock data for development/fallback
    return generateMockAnalysisResult(text);
  }
}

/**
 * Generates a knowledge graph (nodes and edges) from extracted entities
 */
export function generateGraphFromEntities(
  entities: Entity[],
  sourceText: string,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const entityMap = new Map<string, Entity>();

  // Create nodes from entities with improved positioning
  entities.forEach((entity, index) => {
    // Use golden ratio for more evenly distributed points on a spiral
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const goldenAngle = (2 - goldenRatio) * (2 * Math.PI);
    const radius = 30 * Math.sqrt(index + 1); // Spiral radius
    const angle = index * goldenAngle;

    const node: Node = {
      id: entity.id || `node-${Date.now()}-${index}`,
      type: entity.type,
      label: entity.text,
      description:
        entity.metadata?.description ||
        `Entity extracted from text: ${entity.text}`,
      // Position nodes in a spiral layout using golden ratio
      x: 400 + radius * Math.cos(angle),
      y: 300 + radius * Math.sin(angle),
      // Initial positions only, don't fix them to allow force layout to work
    };

    nodes.push(node);
    entityMap.set(entity.id || entity.text, entity);
  });

  // Create edges between related entities
  // This is a simple approach - in a real implementation, you would use
  // the relationships identified by the AI model
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      // Check if entities are close to each other in the text
      const entity1 =
        entityMap.get(nodes[i].id) || entityMap.get(nodes[i].label);
      const entity2 =
        entityMap.get(nodes[j].id) || entityMap.get(nodes[j].label);

      if (
        entity1 &&
        entity2 &&
        areEntitiesRelated(entity1, entity2, sourceText)
      ) {
        const edge: Edge = {
          id: `edge-${Date.now()}-${i}-${j}`,
          source: nodes[i].id,
          target: nodes[j].id,
          relationship: determineRelationship(entity1, entity2, sourceText),
        };

        edges.push(edge);
      }
    }
  }

  return { nodes, edges };
}

/**
 * Determines if two entities are related based on their proximity in text
 */
function areEntitiesRelated(
  entity1: Entity,
  entity2: Entity,
  text: string,
): boolean {
  // Simple heuristic: entities are related if they appear within 100 characters of each other
  if (
    entity1.offsets &&
    entity2.offsets &&
    entity1.offsets.length > 0 &&
    entity2.offsets.length > 0
  ) {
    const offset1 = entity1.offsets[0];
    const offset2 = entity2.offsets[0];

    const distance = Math.min(
      Math.abs(offset1.end - offset2.start),
      Math.abs(offset2.end - offset1.start),
    );

    return distance < 100;
  }

  // If we don't have offset information, assume they're related
  // This is a fallback for development/testing
  return true;
}

/**
 * Determines the relationship type between two entities
 */
function determineRelationship(
  entity1: Entity,
  entity2: Entity,
  text: string,
): string {
  // This is a simplified approach - in a real implementation, you would use
  // NLP or the AI model to determine the actual relationship

  const relationshipTypes = [
    "connected to",
    "related to",
    "associated with",
    "mentioned with",
    "appears with",
  ];

  // For specific entity type combinations, use more specific relationships
  if (entity1.type === "person" && entity2.type === "event") {
    return "participated in";
  } else if (entity1.type === "event" && entity2.type === "person") {
    return "involved";
  } else if (entity1.type === "person" && entity2.type === "place") {
    return "visited";
  } else if (entity1.type === "place" && entity2.type === "person") {
    return "visited by";
  } else if (entity1.type === "person" && entity2.type === "document") {
    return "authored";
  } else if (entity1.type === "document" && entity2.type === "person") {
    return "written by";
  }

  // Default to a random generic relationship
  return relationshipTypes[
    Math.floor(Math.random() * relationshipTypes.length)
  ];
}

/**
 * Generates mock analysis results for development/testing
 */
function generateMockAnalysisResult(text: string): AnalysisResult {
  // Extract some words to use as entities
  const words = text.split(/\s+/).filter((word) => word.length > 4);
  const selectedWords = words.filter((_, i) => i % 5 === 0).slice(0, 6);

  // Create mock entities
  const entities: Entity[] = selectedWords.map((word, index) => {
    const types: Array<"person" | "event" | "place" | "document" | "concept"> =
      ["person", "event", "place", "document", "concept"];
    const type = types[index % types.length];

    return {
      id: `entity-${Date.now()}-${index}`,
      text: word,
      type,
      confidence: 0.7 + Math.random() * 0.3,
      offsets: [
        { start: text.indexOf(word), end: text.indexOf(word) + word.length },
      ],
      metadata: {
        description: `A ${type} mentioned in the text`,
        importance: Math.floor(Math.random() * 50) + 50,
      },
    };
  });

  // Generate mock insights
  const insights: TextInsight[] = [
    {
      type: "readability",
      score: 75,
      summary: "Highly readable text",
      details:
        "The text has a Flesch-Kincaid grade level of approximately 8th grade.",
    },
    {
      type: "sentiment",
      score: 60,
      summary: "Slightly positive sentiment",
      details:
        "The text has a generally positive tone with some neutral elements.",
    },
    {
      type: "complexity",
      score: 40,
      summary: "Low to moderate complexity",
      details: "The text uses straightforward language and structure.",
    },
  ];

  // Generate nodes and edges
  const { nodes, edges } = generateGraphFromEntities(entities, text);

  return {
    entities,
    insights,
    nodes,
    edges,
  };
}
