import React, { useState } from "react";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Calendar,
  Clock,
  MapPin,
  Link as LinkIcon,
  User,
  BookOpen,
  Heart,
  Share2,
  Bookmark,
  FileText,
  Globe,
  Tag,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Star,
} from "lucide-react";

// Enhanced types with more properties
interface Relationship {
  id: string;
  type: string;
  name: string;
  significance: number; // 1-100 rating of importance
  timeframe?: string;
  description?: string;
}

interface MediaItem {
  id: string;
  type: "image" | "document" | "video" | "audio" | "link";
  url: string;
  caption: string;
  date?: string;
  source?: string;
}

interface Timeline {
  id: string;
  date: string;
  title: string;
  description: string;
  importance: number; // 1-100
}

interface Entity {
  id: string;
  type: "person" | "event" | "place" | "organization" | "artifact";
  name: string;
  alternateNames?: string[];
  description: string;
  dates?: string[];
  location?: string;
  coordinates?: { lat: number; lng: number };
  relationships?: Relationship[];
  media?: MediaItem[];
  timeline?: Timeline[];
  externalLinks?: Array<{ title: string; url: string }>;
  tags?: string[];
  significance?: number; // 1-100 historical significance rating
  category?: string;
}

interface EntityDetailsProps {
  entity?: Entity;
  onSave?: (entity: Entity) => void;
  onRelated?: (id: string) => void;
  viewMode?: "compact" | "full" | "card";
  editable?: boolean;
}

const EntityDetails = ({
  entity,
  onSave,
  onRelated,
  viewMode = "full",
  editable = false,
}: EntityDetailsProps) => {
  // Sample entity as default
  const defaultEntity: Entity = {
    id: "1",
    type: "person",
    name: "Winston Churchill",
    alternateNames: ["Sir Winston Leonard Spencer Churchill"],
    description:
      "British statesman who served as Prime Minister of the United Kingdom from 1940 to 1945, during the Second World War, and again from 1951 to 1955. As Prime Minister, Churchill led Britain to victory in the Second World War. He was also an officer in the British Army, a non-academic historian, and a writer, winning the Nobel Prize in Literature in 1953.",
    dates: ["1874-11-30", "1965-01-24"],
    location: "Blenheim Palace, Oxfordshire, England",
    coordinates: { lat: 51.8414, lng: -1.3618 },
    significance: 95,
    category: "Political Leaders",
    tags: [
      "Prime Minister",
      "World War II",
      "Nobel Prize",
      "Writer",
      "British Empire",
    ],
    relationships: [
      {
        id: "r1",
        type: "Political Ally",
        name: "Franklin D. Roosevelt",
        significance: 90,
        timeframe: "1939-1945",
        description:
          "Roosevelt and Churchill formed a crucial alliance during World War II.",
      },
      {
        id: "r2",
        type: "Political Ally",
        name: "Joseph Stalin",
        significance: 85,
        timeframe: "1941-1945",
        description:
          "Despite ideological differences, they were allies against Nazi Germany.",
      },
      {
        id: "r3",
        type: "Political Rival",
        name: "Neville Chamberlain",
        significance: 70,
        timeframe: "1937-1940",
        description:
          "Churchill opposed Chamberlain's appeasement policies toward Nazi Germany.",
      },
      {
        id: "r4",
        type: "Family",
        name: "Clementine Churchill",
        significance: 95,
        timeframe: "1908-1965",
        description:
          "His wife and most trusted confidant throughout his life and career.",
      },
    ],
    media: [
      {
        id: "m1",
        type: "image",
        url: "https://images.unsplash.com/photo-1590959651373-a3db0f38a961?w=500&h=500&fit=crop",
        caption: "Official portrait during WWII",
        date: "1941",
        source: "Imperial War Museum",
      },
      {
        id: "m2",
        type: "image",
        url: "https://api.dicebear.com/7.x/avataaars/svg?seed=ChurchillYalta",
        caption: "At the Yalta Conference with Roosevelt and Stalin",
        date: "1945-02",
        source: "National Archives",
      },
      {
        id: "m3",
        type: "document",
        url: "https://api.dicebear.com/7.x/avataaars/svg?seed=ChurchillSpeech",
        caption: "Transcript of 'Blood, Toil, Tears and Sweat' speech",
        date: "1940-05-13",
        source: "UK Parliamentary Archives",
      },
    ],
    timeline: [
      {
        id: "t1",
        date: "1874-11-30",
        title: "Birth",
        description: "Born at Blenheim Palace, Oxfordshire",
        importance: 80,
      },
      {
        id: "t2",
        date: "1940-05-10",
        title: "Becomes Prime Minister",
        description:
          "Appointed Prime Minister following Chamberlain's resignation",
        importance: 100,
      },
      {
        id: "t3",
        date: "1940-06-18",
        title: "'Finest Hour' Speech",
        description:
          "Delivered famous 'This was their finest hour' speech to House of Commons",
        importance: 95,
      },
      {
        id: "t4",
        date: "1953",
        title: "Nobel Prize in Literature",
        description: "Awarded the Nobel Prize in Literature",
        importance: 85,
      },
      {
        id: "t5",
        date: "1965-01-24",
        title: "Death",
        description: "Died in London at the age of 90",
        importance: 80,
      },
    ],
    externalLinks: [
      { title: "Churchill Archives", url: "https://www.churchillarchive.com" },
      {
        title: "International Churchill Society",
        url: "https://winstonchurchill.org",
      },
    ],
  };

  const displayEntity = entity || defaultEntity;

  // State for interaction and UI
  const [activeTab, setActiveTab] = useState("overview");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [timelineSort, setTimelineSort] = useState<
    "chronological" | "importance"
  >("chronological");

  // Calculate age if the entity is a person with birth/death dates
  const calculateAge = () => {
    if (
      displayEntity.type === "person" &&
      displayEntity.dates &&
      displayEntity.dates.length >= 2
    ) {
      const birthYear = new Date(displayEntity.dates[0]).getFullYear();
      const deathYear = new Date(displayEntity.dates[1]).getFullYear();
      return deathYear - birthYear;
    }
    return null;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    try {
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch {
      return dateString; // Return original if parsing fails
    }
  };

  // Get color based on entity type
  const getEntityTypeColor = () => {
    switch (displayEntity.type) {
      case "person":
        return "text-blue-600 border-blue-600 bg-blue-50";
      case "event":
        return "text-red-600 border-red-600 bg-red-50";
      case "place":
        return "text-green-600 border-green-600 bg-green-50";
      case "organization":
        return "text-purple-600 border-purple-600 bg-purple-50";
      case "artifact":
        return "text-amber-600 border-amber-600 bg-amber-50";
      default:
        return "text-gray-600 border-gray-600 bg-gray-50";
    }
  };

  // Get icon based on entity type
  const getEntityTypeIcon = () => {
    switch (displayEntity.type) {
      case "person":
        return <User className="h-4 w-4" />;
      case "event":
        return <Calendar className="h-4 w-4" />;
      case "place":
        return <MapPin className="h-4 w-4" />;
      case "organization":
        return <Globe className="h-4 w-4" />;
      case "artifact":
        return <FileText className="h-4 w-4" />;
      default:
        return <Tag className="h-4 w-4" />;
    }
  };

  // Get icon based on media type
  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Calendar className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      case "video":
        return <Calendar className="h-4 w-4" />;
      case "audio":
        return <Calendar className="h-4 w-4" />;
      case "link":
        return <LinkIcon className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Toggle item expanded state
  const toggleExpanded = (id: string) => {
    setExpanded({ ...expanded, [id]: !expanded[id] });
  };

  // Filter relationships based on search
  const filteredRelationships = displayEntity.relationships?.filter(
    (rel) =>
      rel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rel.type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Sort timeline entries
  const sortedTimeline = [...(displayEntity.timeline || [])].sort((a, b) => {
    if (timelineSort === "chronological") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else {
      return b.importance - a.importance;
    }
  });

  // Render relationship significance
  const renderSignificance = (significance: number) => {
    return (
      <div className="w-full mt-1">
        <div className="flex justify-between text-xs mb-1">
          <span>Significance</span>
          <span>{significance}/100</span>
        </div>
        <Progress value={significance} className="h-1.5" />
      </div>
    );
  };

  // Main render function based on view mode
  if (viewMode === "compact") {
    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <img
              src={
                displayEntity.media?.[0]?.url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayEntity.name}`
              }
              alt={displayEntity.name}
            />
          </Avatar>
          <div>
            <h3 className="font-medium text-base">{displayEntity.name}</h3>
            <Badge variant="outline" className={getEntityTypeColor()}>
              {displayEntity.type.charAt(0).toUpperCase() +
                displayEntity.type.slice(1)}
            </Badge>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {displayEntity.description}
        </p>
        <Button
          variant="link"
          size="sm"
          className="p-0 mt-1 h-auto"
          onClick={() => onRelated?.(displayEntity.id)}
        >
          View details <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </Card>
    );
  }

  // Full view mode (default)
  return (
    <Card className="h-full w-full bg-white overflow-hidden flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <img
              src={
                displayEntity.media?.[0]?.url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayEntity.name}`
              }
              alt={displayEntity.name}
            />
          </Avatar>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-serif font-semibold">
                  {displayEntity.name}
                </h2>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="outline" className={getEntityTypeColor()}>
                    <span className="flex items-center gap-1">
                      {getEntityTypeIcon()}
                      {displayEntity.type.charAt(0).toUpperCase() +
                        displayEntity.type.slice(1)}
                    </span>
                  </Badge>
                  {displayEntity.category && (
                    <Badge variant="outline" className="bg-gray-50">
                      {displayEntity.category}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsBookmarked(!isBookmarked)}
                      >
                        <Bookmark
                          className={`h-5 w-5 ${isBookmarked ? "fill-current text-amber-500" : ""}`}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isBookmarked ? "Remove bookmark" : "Bookmark"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Share</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {displayEntity.alternateNames &&
              displayEntity.alternateNames.length > 0 && (
                <div className="text-sm text-gray-500 mt-1">
                  Also known as: {displayEntity.alternateNames.join(", ")}
                </div>
              )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start px-6 border-b">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-6 space-y-6">
            <div className="space-y-4">
              <p className="text-gray-700">{displayEntity.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {displayEntity.dates && displayEntity.dates.length > 0 && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">Dates</div>
                        <span>
                          {displayEntity.dates.map(formatDate).join(" - ")}
                          {calculateAge() !== null && (
                            <span className="text-gray-500 ml-2">
                              ({calculateAge()} years)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {displayEntity.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">Location</div>
                        <span>{displayEntity.location}</span>
                      </div>
                    </div>
                  )}

                  {displayEntity.significance !== undefined && (
                    <div className="flex items-start gap-2 text-gray-600">
                      <Star className="h-4 w-4 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <div className="font-medium">
                          Historical Significance
                        </div>
                        <div className="w-full mt-1">
                          <Progress
                            value={displayEntity.significance}
                            className="h-2"
                          />
                          <div className="flex justify-between text-xs mt-1">
                            <span>Low</span>
                            <span>{displayEntity.significance}/100</span>
                            <span>High</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {displayEntity.tags && displayEntity.tags.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-medium flex items-center gap-2">
                      <Tag className="h-4 w-4 text-gray-400" />
                      Tags
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {displayEntity.tags.map((tag, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {displayEntity.coordinates && (
                <div className="mt-4 border rounded-lg p-2 bg-gray-50">
                  <div className="font-medium mb-2">Map Location</div>
                  <div className="h-48 bg-blue-50 flex items-center justify-center rounded border relative overflow-hidden">
                    {/* Placeholder for actual map integration */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 text-red-500 mx-auto" />
                        <div className="text-sm mt-2">
                          Coordinates:{" "}
                          {displayEntity.coordinates.lat.toFixed(4)},{" "}
                          {displayEntity.coordinates.lng.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Timeline</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <Button
                  variant={
                    timelineSort === "chronological" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setTimelineSort("chronological")}
                >
                  Date
                </Button>
                <Button
                  variant={
                    timelineSort === "importance" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setTimelineSort("importance")}
                >
                  Importance
                </Button>
              </div>
            </div>

            <div className="space-y-4 relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

              {sortedTimeline.map((event, index) => (
                <div key={event.id} className="flex gap-4 relative">
                  {/* Timeline node */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center z-10 mt-1"
                    style={{
                      backgroundColor: `rgba(59, 130, 246, ${event.importance / 100})`,
                      border: "2px solid white",
                    }}
                  >
                    <span className="text-white text-xs font-medium">
                      {index + 1}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-white p-4 rounded-lg border shadow-sm">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{event.title}</h4>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700"
                      >
                        {formatDate(event.date)}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mt-2">{event.description}</p>

                    {/* Importance indicator */}
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <span>Significance:</span>
                      <div className="w-24 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${event.importance}%` }}
                        />
                      </div>
                      <span>{event.importance}/100</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="relationships" className="p-6">
            <div className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="Search relationships..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-4"
                />
              </div>

              {filteredRelationships && filteredRelationships.length > 0 ? (
                filteredRelationships.map((rel) => (
                  <div
                    key={rel.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleExpanded(rel.id)}
                    >
                      <Avatar className="h-10 w-10">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${rel.name}`}
                          alt={rel.name}
                        />
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{rel.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              rel.type.toLowerCase().includes("ally")
                                ? "bg-green-50 text-green-700"
                                : rel.type.toLowerCase().includes("rival")
                                  ? "bg-red-50 text-red-700"
                                  : rel.type.toLowerCase().includes("family")
                                    ? "bg-purple-50 text-purple-700"
                                    : "bg-blue-50 text-blue-700"
                            }
                          >
                            {rel.type}
                          </Badge>
                          {rel.timeframe && (
                            <span className="text-xs text-gray-500">
                              {rel.timeframe}
                            </span>
                          )}
                        </div>
                      </div>
                      {expanded[rel.id] ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    {expanded[rel.id] && (
                      <div className="p-4 bg-gray-50 border-t">
                        {rel.description && (
                          <p className="text-gray-700 mb-3">
                            {rel.description}
                          </p>
                        )}
                        {renderSignificance(rel.significance)}
                        <div className="mt-3 flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onRelated?.(rel.id)}
                          >
                            View profile
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No relationships found matching your search.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="media" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayEntity.media?.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="relative aspect-video bg-gray-100">
                    {item.type === "image" ? (
                      <img
                        src={item.url}
                        alt={item.caption}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {getMediaTypeIcon(item.type)}
                      </div>
                    )}
                    <Badge
                      className="absolute top-2 right-2 bg-white/90"
                      variant="outline"
                    >
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </Badge>
                  </div>
                  <div className="p-4">
                    <p className="font-medium">{item.caption}</p>
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                      {item.date && <span>{item.date}</span>}
                      {item.source && <span>Source: {item.source}</span>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="links" className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">External Resources</h3>
              {displayEntity.externalLinks?.map((link, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <LinkIcon className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <div className="font-medium">{link.title}</div>
                    <div className="text-sm text-blue-500">{link.url}</div>
                  </div>
                  <Button variant="outline" size="sm">
                    Visit
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </Card>
  );
};

export default EntityDetails;
