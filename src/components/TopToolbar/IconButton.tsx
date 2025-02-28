import React from "react";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { LucideIcon } from "lucide-react";

interface IconButtonProps {
  icon: LucideIcon;
  tooltip: string;
  onClick?: () => void;
}

const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  tooltip,
  onClick,
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onClick}>
            <Icon className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default IconButton;
