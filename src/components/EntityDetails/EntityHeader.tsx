import React from "react";
import { CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Download } from "lucide-react";
import { UserRound, MapPin, Calendar, FileText, Lightbulb } from "lucide-react";

interface EntityData {
  id: string;
  name: string;
  type: "person" | "place" | "event" | "document" | "concept";
  description: string;
  dates?: { start?: string; end?: string };
  image?: string;
}

interface EntityHeaderProps {
  entity: EntityData | null;
  loading: boolean;
  onExport: () => void;
}

const EntityHeader: React.FC<EntityHeaderProps> = ({
  entity,
  loading,
  onExport,
}) => {
  if (loading) {
    return (
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="h-8 w-40 bg-gray-200 animate-pulse rounded" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
    );
  }

  if (!entity) {
    return (
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Entity Details</CardTitle>
        </div>
      </CardHeader>
    );
  }

  return (
    <CardHeader className="pb-2">
      <div className="flex justify-between items-center">
        <CardTitle>{entity.name}</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>
      <Badge
        variant="outline"
        className={`mt-1 ${
          entity.type === "person"
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : entity.type === "place"
              ? "bg-green-50 text-green-700 border-green-200"
              : entity.type === "event"
                ? "bg-red-50 text-red-700 border-red-200"
                : entity.type === "document"
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
        }`}
      >
        {entity.type === "person" && <UserRound className="h-3 w-3 mr-1" />}
        {entity.type === "place" && <MapPin className="h-3 w-3 mr-1" />}
        {entity.type === "event" && <Calendar className="h-3 w-3 mr-1" />}
        {entity.type === "document" && <FileText className="h-3 w-3 mr-1" />}
        {entity.type === "concept" && <Lightbulb className="h-3 w-3 mr-1" />}
        {entity.type.charAt(0).toUpperCase() + entity.type.slice(1)}
      </Badge>
    </CardHeader>
  );
};

export default EntityHeader;
