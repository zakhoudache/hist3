import React from "react";
import { Button } from "../ui/button";
import { Search } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface SearchButtonProps {
  onClick: () => void;
}

const SearchButton: React.FC<SearchButtonProps> = ({ onClick }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" onClick={onClick}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </TooltipTrigger>
        <TooltipContent>Search entities</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SearchButton;
