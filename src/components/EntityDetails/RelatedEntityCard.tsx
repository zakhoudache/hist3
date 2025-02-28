import React from "react";
import { Badge } from "../ui/badge";
import { UserRound, MapPin, Calendar, FileText, Lightbulb } from "lucide-react";

interface RelatedEntityProps {
  entity: { id: string; name: string; type: string; relationship: string };
}

const RelatedEntityCard: React.FC<RelatedEntityProps> = ({ entity }) => {
  return (
    <div className="p-3 rounded-md border">
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          {entity.type === "person" && (
            <UserRound className="h-4 w-4 mr-2 text-blue-500" />
          )}
          {entity.type === "place" && (
            <MapPin className="h-4 w-4 mr-2 text-green-500" />
          )}
          {entity.type === "event" && (
            <Calendar className="h-4 w-4 mr-2 text-red-500" />
          )}
          {entity.type === "document" && (
            <FileText className="h-4 w-4 mr-2 text-purple-500" />
          )}
          {entity.type === "concept" && (
            <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
          )}
          <h4 className="text-sm font-medium">{entity.name}</h4>
        </div>
        <Badge variant="outline" className="text-xs">
          {entity.relationship}
        </Badge>
      </div>
    </div>
  );
};

export default RelatedEntityCard;
