import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  Deno.env.get("AIzaSyADyF440_9myFUo5yBobAg_lEgjT5zIIUI") || "",
);

serve(async (req) => {
  try {
    const { text } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Generate a knowledge graph from the following text. Return the nodes and edges in JSON format with the following structure:
    {
      "nodes": [
        {
          "id": "unique-id",
          "type": "person|event|place|document|concept",
          "label": "node label",
          "description": "brief description",
          "x": 100,
          "y": 100
        }
      ],
      "edges": [
        {
          "id": "edge-id",
          "source": "source-node-id",
          "target": "target-node-id",
          "relationship": "relationship type"
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
      : { nodes: [], edges: [] };

    return new Response(JSON.stringify(parsedResult), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
