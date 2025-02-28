export interface EntityData {
  id: string;
  name: string;
  type: "person" | "place" | "event" | "document" | "concept";
  description: string;
  dates?: { start?: string; end?: string };
  image?: string;
  sources?: { title: string; url: string }[];
  relatedEntities?: {
    id: string;
    name: string;
    type: string;
    relationship: string;
  }[];
}

export interface EntityDetailsProps {
  entityId?: string;
  entityName?: string;
}
