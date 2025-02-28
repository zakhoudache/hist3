import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Users,
  Calendar,
  MapPin,
  Filter,
  Search,
  Plus,
  Share,
  Download,
  LayoutGrid,
  Clock,
  Sparkles,
  History,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Slider } from "./ui/slider";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface TopToolbarProps {
  onFilterChange?: (filter: string) => void;
  activeFilter?: string;
  onSearch?: (query: string) => void;
  onTimeRangeChange?: (range: [number, number]) => void;
  onAddEntity?: () => void;
  onExport?: (format: string) => void;
  onShare?: () => void;
  onTimelineView?: () => void;
  onAutoLayout?: () => void;
}

const TopToolbar = ({
  onFilterChange = () => {},
  activeFilter = "all",
  onSearch = () => {},
  onTimeRangeChange = () => {},
  onAddEntity = () => {},
  onExport = () => {},
  onShare = () => {},
  onTimelineView = () => {},
  onAutoLayout = () => {},
}: TopToolbarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState<[number, number]>([1700, 2025]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([
    activeFilter,
  ]);
  const [toolbarExpanded, setToolbarExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchResults, setSearchResults] = useState<
    { name: string; type: string }[]
  >([]);
  const [animateButton, setAnimateButton] = useState("");

  useEffect(() => {
    if (activeFilter !== "all") {
      setSelectedFilters([activeFilter]);
    }
  }, [activeFilter]);

  const triggerAnimation = (buttonId: string) => {
    setAnimateButton(buttonId);
    setTimeout(() => setAnimateButton(""), 500);
  };

  const handleTimeRangeChange = (newRange: [number, number]) => {
    setTimeRange(newRange);
    onTimeRangeChange(newRange);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      // Mock search results for interactive demo
      setSearchResults([
        { name: `${searchQuery} Person`, type: "person" },
        { name: `${searchQuery} Event`, type: "event" },
        { name: `${searchQuery} Place`, type: "place" },
      ]);
      if (!recentSearches.includes(searchQuery)) {
        setRecentSearches((prev) => [searchQuery, ...prev].slice(0, 5));
      }
    }
  };

  const toggleFilter = (filter: string) => {
    triggerAnimation(filter);
    if (filter === "all") {
      setSelectedFilters(["all"]);
      onFilterChange("all");
    } else {
      const newFilters = selectedFilters.includes(filter)
        ? selectedFilters.filter((f) => f !== filter && f !== "all")
        : [...selectedFilters.filter((f) => f !== "all"), filter];

      if (newFilters.length === 0) {
        setSelectedFilters(["all"]);
        onFilterChange("all");
      } else {
        setSelectedFilters(newFilters);
        onFilterChange(newFilters.join(","));
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <div className="relative">
      <motion.div
        className="w-full bg-white border-b px-4 flex flex-col"
        animate={{ height: toolbarExpanded ? "auto" : "64px" }}
        transition={{ duration: 0.3 }}
      >
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    animate={
                      animateButton === "all" ? { scale: [1, 1.1, 1] } : {}
                    }
                  >
                    <Button
                      variant={
                        selectedFilters.includes("all") ? "default" : "ghost"
                      }
                      size="sm"
                      onClick={() => toggleFilter("all")}
                      className="whitespace-nowrap"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      All
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>Show all nodes</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="h-6" />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    animate={
                      animateButton === "people" ? { scale: [1, 1.1, 1] } : {}
                    }
                  >
                    <Button
                      variant={
                        selectedFilters.includes("people") ? "default" : "ghost"
                      }
                      size="sm"
                      className={
                        selectedFilters.includes("people")
                          ? ""
                          : "text-blue-600"
                      }
                      onClick={() => toggleFilter("people")}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      People
                      {selectedFilters.includes("people") && (
                        <Badge
                          variant="outline"
                          className="ml-2 bg-blue-100 text-blue-700 border-blue-300"
                        >
                          {Math.floor(Math.random() * 20) + 5}
                        </Badge>
                      )}
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>Show people nodes</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    animate={
                      animateButton === "events" ? { scale: [1, 1.1, 1] } : {}
                    }
                  >
                    <Button
                      variant={
                        selectedFilters.includes("events") ? "default" : "ghost"
                      }
                      size="sm"
                      className={
                        selectedFilters.includes("events") ? "" : "text-red-600"
                      }
                      onClick={() => toggleFilter("events")}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Events
                      {selectedFilters.includes("events") && (
                        <Badge
                          variant="outline"
                          className="ml-2 bg-red-100 text-red-700 border-red-300"
                        >
                          {Math.floor(Math.random() * 15) + 3}
                        </Badge>
                      )}
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>Show event nodes</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    animate={
                      animateButton === "places" ? { scale: [1, 1.1, 1] } : {}
                    }
                  >
                    <Button
                      variant={
                        selectedFilters.includes("places") ? "default" : "ghost"
                      }
                      size="sm"
                      className={
                        selectedFilters.includes("places")
                          ? ""
                          : "text-green-600"
                      }
                      onClick={() => toggleFilter("places")}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Places
                      {selectedFilters.includes("places") && (
                        <Badge
                          variant="outline"
                          className="ml-2 bg-green-100 text-green-700 border-green-300"
                        >
                          {Math.floor(Math.random() * 10) + 2}
                        </Badge>
                      )}
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>Show place nodes</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {toolbarExpanded && (
              <>
                <Separator orientation="vertical" className="h-6" />

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onTimelineView}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Timeline View
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View as timeline</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onAutoLayout}
                        className="text-purple-600"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Auto Layout
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Automatically organize nodes
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <div className="relative">
                  <form
                    onSubmit={handleSearchSubmit}
                    className="flex items-center border rounded-md px-3 py-1 focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-500 transition-all"
                  >
                    <Search className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search entities..."
                      className="outline-none text-sm w-full min-w-[150px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    )}
                  </form>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="end">
                <div className="p-2">
                  <h3 className="text-sm font-medium mb-2">Recent Searches</h3>
                  {recentSearches.length > 0 ? (
                    <div className="space-y-1">
                      {recentSearches.map((search, index) => (
                        <div
                          key={index}
                          className="px-2 py-1 text-sm rounded hover:bg-gray-100 cursor-pointer flex items-center"
                          onClick={() => {
                            setSearchQuery(search);
                            onSearch(search);
                          }}
                        >
                          <History className="h-3 w-3 mr-2 text-gray-400" />
                          {search}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      No recent searches
                    </div>
                  )}
                </div>
                {searchResults.length > 0 && (
                  <>
                    <Separator />
                    <div className="p-2">
                      <h3 className="text-sm font-medium mb-2">Results</h3>
                      <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {searchResults.map((result, index) => (
                          <div
                            key={index}
                            className="px-2 py-1 text-sm rounded hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                          >
                            <span>{result.name}</span>
                            <Badge
                              variant="outline"
                              className={`
                                ${result.type === "person" ? "text-blue-600 border-blue-600" : ""}
                                ${result.type === "event" ? "text-red-600 border-red-600" : ""}
                                ${result.type === "place" ? "text-green-600 border-green-600" : ""}
                              `}
                            >
                              {result.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </PopoverContent>
            </Popover>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setToolbarExpanded(!toolbarExpanded)}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {toolbarExpanded ? "Collapse toolbar" : "Expand toolbar"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {!toolbarExpanded && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                      onClick={onAddEntity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add new entity</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        <AnimatePresence>
          {toolbarExpanded && (
            <motion.div
              className="pb-4 pt-2 grid grid-cols-2 gap-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Time Range ({timeRange[0]} - {timeRange[1]})
                  </h3>
                  <Slider
                    defaultValue={timeRange}
                    min={1700}
                    max={2025}
                    step={1}
                    value={timeRange}
                    onValueChange={(value) =>
                      handleTimeRangeChange(value as [number, number])
                    }
                    className="w-full"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={onAddEntity}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entity
                  </Button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[180px]" align="end">
                      <div className="space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => onExport("png")}
                        >
                          PNG Image
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => onExport("svg")}
                        >
                          SVG Vector
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => onExport("json")}
                        >
                          JSON Data
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
                  <h3 className="text-sm font-medium text-blue-800 mb-1">
                    Interactive graph tip
                  </h3>
                  <p className="text-xs text-blue-700">
                    Double-click on empty space to create a new node. Drag
                    between nodes to create relationships.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={onShare}
                >
                  <Share className="h-4 w-4 mr-2" />
                  Share History Graph
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Quick access floating button when scrolled */}
      <motion.div
        className="absolute bottom-4 right-4 z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className="rounded-full h-10 w-10 shadow-lg bg-blue-600 hover:bg-blue-700"
                onClick={onAddEntity}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Add new entity</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
    </div>
  );
};

export default TopToolbar;
