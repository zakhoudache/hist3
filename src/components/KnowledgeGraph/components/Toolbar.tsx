import React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ZoomIn, ZoomOut, Move, Plus } from "lucide-react";

interface ToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onAddNode: () => void;
}

export function Toolbar({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onAddNode,
}: ToolbarProps) {
  return (
    <div className="flex justify-between p-2 bg-gray-100 border-b">
      <div className="flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onZoomIn}
                className="h-8 w-8"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onZoomOut}
                className="h-8 w-8"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onResetZoom}
                className="h-8 w-8"
              >
                <Move className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset View</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onAddNode}
                className="h-8 w-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add New Node</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
