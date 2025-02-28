import React from "react";
import { Button } from "../ui/button";
import { Filter } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface FilterButtonProps {
  onClick: () => void;
  hasActiveFilters?: boolean;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  onClick,
  hasActiveFilters = false,
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            size="sm"
            onClick={onClick}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </TooltipTrigger>
        <TooltipContent>Filter graph</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FilterButton;
