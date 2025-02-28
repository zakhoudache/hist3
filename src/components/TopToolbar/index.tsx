import React from "react";
import { History, Share2, Settings, HelpCircle } from "lucide-react";

// Import sub-components
import Logo from "./Logo";
import SearchButton from "./SearchButton";
import FilterButton from "./FilterButton";
import ExportButton from "./ExportButton";
import IconButton from "./IconButton";

interface TopToolbarProps {
  onSearch?: () => void;
  onFilter?: () => void;
  onExport?: () => void;
  onHelp?: () => void;
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
}

const TopToolbar: React.FC<TopToolbarProps> = ({
  onSearch,
  onFilter,
  onExport,
  onHelp,
  onResetFilters,
  hasActiveFilters = false,
}) => {
  return (
    <div className="w-full h-16 bg-white border-b flex items-center justify-between px-4">
      <Logo />

      <div className="flex items-center gap-3">
        <SearchButton onClick={onSearch || (() => {})} />
        <FilterButton
          onClick={onFilter || (() => {})}
          hasActiveFilters={hasActiveFilters}
        />
        <ExportButton onClick={onExport || (() => {})} />

        {hasActiveFilters && (
          <IconButton
            icon={History}
            tooltip="Reset Filters"
            onClick={onResetFilters}
          />
        )}

        <IconButton icon={Share2} tooltip="Share" />
        <IconButton icon={Settings} tooltip="Settings" />
        <IconButton icon={HelpCircle} tooltip="Help" onClick={onHelp} />
      </div>
    </div>
  );
};

export default TopToolbar;
