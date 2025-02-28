import { EntityData } from "./types";

/**
 * Generates mock entity data for development and testing
 */
export function generateMockEntityData(
  entityId?: string,
  entityName?: string,
): EntityData {
  const name = entityName || "Unknown Entity";
  const types = ["person", "place", "event", "document", "concept"] as const;
  const type = types[Math.floor(Math.random() * types.length)];

  // Generate different descriptions based on entity type
  let description = "";
  let dates = {};
  let image;

  switch (type) {
    case "person":
      description = `${name} was a significant historical figure known for their contributions to society and culture. They influenced many contemporaries and left a lasting legacy.`;
      dates = { start: "1750", end: "1820" };
      image =
        "https://images.unsplash.com/photo-1508179719682-dbc62681c355?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
      break;
    case "place":
      description = `${name} is a historically significant location that played an important role in various events throughout history. It has distinctive geographical and cultural features.`;
      image =
        "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
      break;
    case "event":
      description = `${name} was a pivotal historical event that changed the course of history. It involved multiple key figures and had far-reaching consequences.`;
      dates = { start: "June 1789", end: "November 1799" };
      image =
        "https://images.unsplash.com/photo-1527153818091-1a9638521e2a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
      break;
    case "document":
      description = `${name} is an important historical document that established key principles and influenced subsequent developments. It was created in response to specific historical circumstances.`;
      dates = { start: "1776" };
      image =
        "https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
      break;
    case "concept":
      description = `${name} is a fundamental concept that has shaped understanding and discourse in its field. It evolved over time and has been interpreted in various ways by different thinkers.`;
      image =
        "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
      break;
  }

  // Generate related entities
  const relatedEntities = [
    {
      id: "related-1",
      name: `Related to ${name} 1`,
      type: types[Math.floor(Math.random() * types.length)],
      relationship: "influenced by",
    },
    {
      id: "related-2",
      name: `Related to ${name} 2`,
      type: types[Math.floor(Math.random() * types.length)],
      relationship: "connected to",
    },
    {
      id: "related-3",
      name: `Related to ${name} 3`,
      type: types[Math.floor(Math.random() * types.length)],
      relationship: "preceded",
    },
  ];

  // Generate sources
  const sources = [
    {
      title: "Historical Encyclopedia",
      url: "https://example.com/encyclopedia",
    },
    {
      title: "Academic Journal Article",
      url: "https://example.com/journal",
    },
    {
      title: "Digital Archive",
      url: "https://example.com/archive",
    },
  ];

  return {
    id: entityId || "mock-entity-id",
    name,
    type,
    description,
    dates,
    image,
    sources,
    relatedEntities,
  };
}
