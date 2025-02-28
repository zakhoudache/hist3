import React from "react";
import { Button } from "../../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import { Download, LayoutGrid, Filter, Share2, Settings } from "lucide-react";
import { Node, Edge } from "../types";

interface GraphSidebarProps {
  nodes: Node[];
  edges: Edge[];
  onAutoLayout?: () => void;
  onFilter?: () => void;
  onSettings?: () => void;
}

const GraphSidebar: React.FC<GraphSidebarProps> = ({
  nodes,
  edges,
  onAutoLayout,
  onFilter,
  onSettings,
}) => {
  const handleExportPDF = () => {
    if (nodes.length === 0) {
      alert("No nodes to export. Please create a graph first.");
      return;
    }
    alert("Exporting graph as PDF. This feature will be available soon.");
    // PDF export functionality will be implemented when jsPDF is installed
  };

  const handleAutoLayout = () => {
    if (onAutoLayout) {
      onAutoLayout();
    } else {
      // Default implementation if no handler provided
      alert(
        "Auto-layout feature will rearrange your nodes for optimal viewing.",
      );
    }
  };

  const handleShare = () => {
    alert("Share functionality will be implemented in a future update.");
  };

  return (
    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-3 bg-white p-2 rounded-lg shadow-md border">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAutoLayout}
              className="h-10 w-10"
            >
              <LayoutGrid className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Auto Layout</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onFilter}
              className="h-10 w-10"
            >
              <Filter className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Filter Nodes</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExportPDF}
              className="h-10 w-10"
            >
              <Download className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Export as PDF</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="h-10 w-10"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Share Graph</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSettings}
              className="h-10 w-10"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Graph Settings</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default GraphSidebar;
