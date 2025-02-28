import React from "react";
import { Button } from "../ui/button";
import { Download } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface ExportButtonProps {
  onClick: () => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({ onClick }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" onClick={onClick}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </TooltipTrigger>
        <TooltipContent>Export graph</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ExportButton;
