import React from "react";
import { Button } from "../../ui/button";

interface EdgeCreationIndicatorProps {
  sourceNodeId: string | null;
  onCancel: () => void;
}

const EdgeCreationIndicator: React.FC<EdgeCreationIndicatorProps> = ({
  sourceNodeId,
  onCancel,
}) => {
  if (!sourceNodeId) return null;

  return (
    <div className="absolute top-4 right-4 bg-green-100 p-2 rounded-md shadow-md">
      <p className="text-sm text-green-800">
        Select a target node to create connection
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onCancel}
        className="mt-2 w-full"
      >
        Cancel
      </Button>
    </div>
  );
};

export default EdgeCreationIndicator;
