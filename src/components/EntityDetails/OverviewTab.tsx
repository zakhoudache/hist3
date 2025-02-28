import React from "react";
import { Clock } from "lucide-react";

interface EntityData {
  id: string;
  name: string;
  type: "person" | "place" | "event" | "document" | "concept";
  description: string;
  dates?: { start?: string; end?: string };
  image?: string;
}

interface OverviewTabProps {
  entity: EntityData;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ entity }) => {
  return (
    <div className="space-y-4">
      {entity.image && (
        <div className="mb-4 rounded-md overflow-hidden">
          <img
            src={entity.image}
            alt={entity.name}
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">
          Description
        </h3>
        <p className="text-sm">{entity.description}</p>
      </div>

      {entity.dates && (entity.dates.start || entity.dates.end) && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Dates
          </h3>
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
            {entity.dates.start && <span>{entity.dates.start}</span>}
            {entity.dates.start && entity.dates.end && (
              <span className="mx-2">-</span>
            )}
            {entity.dates.end && <span>{entity.dates.end}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;
