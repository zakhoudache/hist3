import { Node, Edge } from "./types";

// Function to get the SVG path for different node shapes based on node type
export const getNodeShape = (type: string): string => {
  switch (type) {
    case "person":
      // Square shape for person nodes
      return "M-20,-20 L20,-20 L20,20 L-20,20 Z";
    case "event":
      // Diamond shape for event nodes
      return "M0,-25 L25,0 L0,25 L-25,0 Z";
    case "place":
      // Triangle shape for place nodes
      return "M0,-25 L25,20 L-25,20 Z";
    case "document":
      // Document shape with folded corner
      return "M-20,-25 L15,-25 L20,-20 L20,25 L-20,25 Z M15,-25 L15,-20 L20,-20";
    case "concept":
    default:
      // Circle shape using SVG path commands
      return "M0,20 a20,20 0 1,0 0.1,0 Z"; // A circle with radius 20
  }
};

export const defaultNodes: Node[] = [
  {
    id: "1",
    type: "person",
    label: "Alexander Hamilton",
    x: 100,
    y: 100,
    description: "Founding Father",
  },
  {
    id: "2",
    type: "event",
    label: "Constitutional Convention",
    x: 300,
    y: 150,
    date: "1787-05-25",
  },
  {
    id: "4",
    type: "person",
    label: "George Washington",
    x: 400,
    y: 200,
    description: "First US President",
  },
  {
    id: "5",
    type: "event",
    label: "Battle of Yorktown",
    x: 250,
    y: 350,
    date: "1781-09-28",
  },
  {
    id: "6",
    type: "document",
    label: "The Federalist Papers",
    x: 150,
    y: 180,
    description: "Collection of essays",
  },
  {
    id: "7",
    type: "concept",
    label: "Republicanism",
    x: 350,
    y: 300,
    description: "Political ideology",
  },
];

export const defaultEdges: Edge[] = [
  { id: "e1", source: "1", target: "2", relationship: "Attended" },
  { id: "e2", source: "2", target: "4", relationship: "Presided over" },
  { id: "e3", source: "4", target: "5", relationship: "Commanded at" },
  { id: "e4", source: "1", target: "6", relationship: "Wrote" },
  { id: "e5", source: "6", target: "7", relationship: "Promoted" },
];
