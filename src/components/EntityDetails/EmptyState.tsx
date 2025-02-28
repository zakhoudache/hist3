import React from "react";
import { CardContent } from "../ui/card";
import { Lightbulb } from "lucide-react";

interface EmptyStateProps {
  message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message = "Select an entity from the knowledge graph to view details",
}) => {
  return (
    <CardContent className="flex-grow flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <Lightbulb className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>{message}</p>
      </div>
    </CardContent>
  );
};

export default EmptyState;
