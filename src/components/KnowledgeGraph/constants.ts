import { Node, Edge } from "./types";

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
    id: "3",
    type: "place",
    label: "Philadelphia",
    x: 200,
    y: 250,
    description: "City in Pennsylvania",
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
  { id: "e2", source: "2", target: "3", relationship: "Took place in" },
  { id: "e3", source: "4", target: "2", relationship: "Presided over" },
  { id: "e4", source: "4", target: "5", relationship: "Commanded at" },
  { id: "e5", source: "1", target: "6", relationship: "Wrote" },
  { id: "e6", source: "6", target: "7", relationship: "Promoted" },
];

export const NODE_TYPE_COLORS = {
  person: "#3b82f6",
  event: "#ef4444",
  place: "#22c55e",
  document: "#8b5cf6",
  concept: "#f59e0b",
};

export const DEFAULT_EDGE_COLOR = "#e2e8f0";
export const HOVERED_EDGE_COLOR = "#3b82f6";
export const DEFAULT_CANVAS_WIDTH = 800;
export const DEFAULT_CANVAS_HEIGHT = 600;
