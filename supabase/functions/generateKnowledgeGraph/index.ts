import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

// Retrieve the API key from the environment variable
const apiKey = "AIzaSyADyF440_9myFUo5yBobAg_lEgjT5zIIUI";
if (!apiKey) {
  throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(apiKey);

serve(async (req: Request) => {
  try {
    // Parse the JSON request body
    const { text } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Define the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Define the prompt with the expected JSON structure
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

    // Call the generative model to produce content
    const result = await model.generateContent(prompt);
    const jsonStr = await result.response.text();

    // Attempt to parse the JSON response
    let parsedResult;
    try {
      parsedResult = JSON.parse(jsonStr);
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON format received",
          details: parseError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Return the parsed JSON result
    return new Response(JSON.stringify(parsedResult), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
