import { supabase } from "./supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export interface Entity {
  text: string;
  type: "person" | "event" | "place";
  relationships: Array<{
    target: string;
    type: string;
  }>;
}

export async function analyzeText(text: string): Promise<Entity[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Extract entities (people, events, places) and their relationships from the following text. Return them in JSON format with the following structure:
    {
      "entities": [
        {
          "text": "entity name",
          "type": "person|event|place|document|concept",
          "metadata": {
            "description": "brief description",
            "dates": ["YYYY-MM-DD"],
            "location": "place name",
            "importance": 1-100
          },
          "relationships": [{"target": "other entity", "type": "relationship type"}]
        }
      ]
    }

    Text: ${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonStr = response.text();

    // Extract JSON from the response
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    const parsedResult = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : { entities: [] };

    // Store entities in Supabase
    for (const entity of parsedResult.entities) {
      const { data: entityData, error: entityError } = await supabase
        .from("entities")
        .insert({
          text: entity.text,
          type: entity.type,
          metadata: entity.metadata,
        })
        .select()
        .single();

      if (entityError) throw entityError;

      // Store relationships
      if (entity.relationships) {
        for (const rel of entity.relationships) {
          // Find or create target entity
          const { data: targetData, error: targetError } = await supabase
            .from("entities")
            .insert({
              text: rel.target,
              type: "concept", // Default type, can be updated later
              metadata: {},
            })
            .select()
            .single();

          if (targetError) throw targetError;

          // Create relationship
          const { error: relError } = await supabase
            .from("relationships")
            .insert({
              source_id: entityData.id,
              target_id: targetData.id,
              relationship_type: rel.type,
            });

          if (relError) throw relError;
        }
      }
    }

    return parsedResult.entities;
  } catch (error) {
    console.error("Error analyzing text:", error);
    return [];
  }
}

export async function getStoredEntities(): Promise<Entity[]> {
  const { data: entities, error: entitiesError } = await supabase.from(
    "entities",
  ).select(`
      id,
      text,
      type,
      metadata,
      relationships:relationships!source_id(
        target_id,
        relationship_type,
        target:entities!relationships_target_id_fkey(text)
      )
    `);

  if (entitiesError) throw entitiesError;

  return entities.map((entity) => ({
    text: entity.text,
    type: entity.type,
    metadata: entity.metadata,
    relationships: entity.relationships.map((rel) => ({
      target: rel.target.text,
      type: rel.relationship_type,
    })),
  }));
}
