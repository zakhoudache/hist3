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

    const prompt = `Extract entities (people, events, places) and their relationships from the following text. Return them in JSON format with the following structure:
    {
      "entities": [
        {
          "id": "unique-id",
          "text": "entity name",
          "type": "person|event|place|document|concept",
          "confidence": 0.9,
          "offsets": [{"start": 0, "end": 10}],
          "metadata": {
            "description": "brief description",
            "dates": ["YYYY-MM-DD"],
            "location": "place name",
            "importance": 1-100
          }
        }
      ],
      "insights": [
        {
          "type": "readability|sentiment|complexity|historical_accuracy|bias",
          "score": 75,
          "summary": "Brief summary",
          "details": "Detailed explanation"
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
      : { entities: [], insights: [] };

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
