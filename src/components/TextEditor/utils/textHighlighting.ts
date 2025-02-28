import { Entity, EntityType } from "../types";

export const getHighlightedText = (
  text: string,
  entities: Entity[] = [],
  highlightEntities: boolean = true,
) => {
  if (!highlightEntities || !entities || entities.length === 0) {
    return `<div class="prose">${text.replace(/\n/g, "<br/>")}</div>`;
  }

  let htmlText = text;
  // Create a safe copy of entities and ensure all have valid offsets
  const entitiesWithOffsets = entities.filter(
    (entity) =>
      entity &&
      entity.offsets &&
      entity.offsets.length > 0 &&
      entity.offsets[0] &&
      typeof entity.offsets[0].start === "number",
  );

  // Sort entities by starting offset (descending) to replace from the end
  const sortedEntities = [...entitiesWithOffsets].sort((a, b) => {
    return (b.offsets[0].start || 0) - (a.offsets[0].start || 0);
  });

  const colorMap: Record<EntityType, string> = {
    person: "#ffcccb",
    place: "#c2f0c2",
    event: "#c2e0ff",
    concept: "#f5f5dc",
    organization: "#ffd700",
    artifact: "#e6e6fa",
    time: "#f08080",
    other: "#d3d3d3",
  };

  sortedEntities.forEach((entity) => {
    if (!entity.offsets || entity.offsets.length === 0) return;

    entity.offsets.forEach((offset) => {
      if (
        !offset ||
        typeof offset.start !== "number" ||
        typeof offset.end !== "number"
      )
        return;

      const { start, end } = offset;
      if (start < 0 || end > htmlText.length || start >= end) return;

      const entityText = htmlText.substring(start, end);
      const entityType = entity.type || "other";
      const highlightedEntity = `<span class="entity-highlight" style="background-color: ${colorMap[entityType] || "#d3d3d3"};" title="${entityType}: ${entity.metadata?.description || ""}">${entityText}</span>`;
      htmlText =
        htmlText.substring(0, start) +
        highlightedEntity +
        htmlText.substring(end);
    });
  });

  return `<div class="prose">${htmlText.replace(/\n/g, "<br/>")}</div>`;
};
