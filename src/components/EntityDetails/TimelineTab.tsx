import React from "react";
import TimelineItem from "./TimelineItem";

interface EntityData {
  id: string;
  name: string;
  type: "person" | "place" | "event" | "document" | "concept";
  description: string;
  dates?: { start?: string; end?: string };
}

interface TimelineTabProps {
  entity: EntityData;
}

const TimelineTab: React.FC<TimelineTabProps> = ({ entity }) => {
  return (
    <div className="relative pl-6 border-l border-gray-200">
      {entity.type === "person" ? (
        <>
          <TimelineItem
            date={entity.dates?.start || "Unknown"}
            title="Birth"
            description={`${entity.name} was born`}
          />
          <TimelineItem
            date="Various dates"
            title="Key events"
            description={`Various significant events in ${entity.name}'s life`}
          />
          {entity.dates?.end && (
            <TimelineItem
              date={entity.dates.end}
              title="Death"
              description={`${entity.name} passed away`}
            />
          )}
        </>
      ) : entity.type === "event" ? (
        <>
          <TimelineItem
            date={entity.dates?.start || "Unknown"}
            title="Beginning"
            description={`${entity.name} began`}
          />
          <TimelineItem
            date="During event"
            title="Key developments"
            description={`Major developments during ${entity.name}`}
          />
          {entity.dates?.end && (
            <TimelineItem
              date={entity.dates.end}
              title="Conclusion"
              description={`${entity.name} concluded`}
            />
          )}
        </>
      ) : (
        <div className="py-4 text-sm text-muted-foreground">
          Timeline information not available for this entity type.
        </div>
      )}
    </div>
  );
};

export default TimelineTab;
