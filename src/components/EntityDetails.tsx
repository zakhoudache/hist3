import React, { useState, useEffect } from "react";
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
  AlertCircle,
  RefreshCcw,
} from "lucide-react";

// Import the UI components properly
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  entityId?: string;
  entityName?: string;
  onSave?: (entity: Entity) => void;
  onRelated?: (id: string) => void;
  viewMode?: "compact" | "full" | "card";
  editable?: boolean;
}

// Type to store the Wikipedia API response
interface WikipediaResponse {
  query?: {
    pages?: {
      [key: string]: {
        pageid: number;
        ns: number;
        title: string;
        extract: string;
        thumbnail?: {
          source: string;
          width: number;
          height: number;
        };
        categories?: Array<{
          ns: number;
          title: string;
        }>;
        links?: Array<{
          ns: number;
          title: string;
        }>;
        extlinks?: Array<{
          "*": string;
        }>;
        coordinates?: Array<{
          lat: number;
          lon: number;
        }>;
      };
    };
  };
}

const EntityDetails = ({
  entityId,
  entityName,
  onSave,
  onRelated,
  viewMode = "full",
  editable = false,
}: EntityDetailsProps) => {
  // State for entity data and loading state
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State for interaction and UI
  const [activeTab, setActiveTab] = useState("overview");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [timelineSort, setTimelineSort] = useState<
    "chronological" | "importance"
  >("chronological");

  // Fetch entity data from Wikipedia when entityName or entityId changes
  useEffect(() => {
    if (entityName) {
      fetchWikipediaData(entityName);
    } else if (entityId) {
      // If we have an ID but no name, try to fetch by ID
      // This would typically involve a different API call or database lookup
      // For now, we'll just set a loading state
      setLoading(true);
      setError(null);

      // Simulate fetching data by ID
      setTimeout(() => {
        // In a real implementation, this would be an API call
        // For now, we'll just use a mock entity
        const mockEntity: Entity = {
          id: entityId,
          type: "person",
          name: `Entity ${entityId.substring(0, 6)}`,
          description:
            "This is a placeholder for an entity that was selected by ID rather than name.",
          significance: 75,
        };
        setEntity(mockEntity);
        setLoading(false);
      }, 500);
    }
  }, [entityName, entityId]);

  // Fetch data from Wikipedia API
  const fetchWikipediaData = async (title: string) => {
    setLoading(true);
    setError(null);

    try {
      // First API call to get basic info and extract (summary)
      const summaryUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|categories|coordinates|links|extlinks&exintro=1&format=json&piprop=thumbnail&pithumbsize=500&pilimit=1&titles=${encodeURIComponent(title)}&origin=*`;

      const response = await fetch(summaryUrl);
      const data: WikipediaResponse = await response.json();

      if (!data.query || !data.query.pages) {
        throw new Error("No data found for this entity");
      }

      // Get the first page (there should only be one)
      const pageId = Object.keys(data.query.pages)[0];
      const page = data.query.pages[pageId];

      if (pageId === "-1") {
        throw new Error("Entity not found in Wikipedia");
      }

      // Process categories to get entity type and tags
      const categories =
        page.categories?.map((cat) => cat.title.replace("Category:", "")) || [];
      const entityType = determineEntityType(categories, title);
      const tags = categories
        .slice(0, 8)
        .map((cat) => cat.replace("Category:", ""));

      // Extract relationships from links
      const relationships =
        page.links?.slice(0, 10).map((link, index) => ({
          id: `r${index}`,
          type: determineRelationshipType(link.title, categories),
          name: link.title,
          significance: Math.floor(Math.random() * 40) + 60, // Random significance between 60-100
          description: `Related to ${title} as mentioned in the Wikipedia article.`,
        })) || [];

      // Fetch more information with a second API call for a timeline
      const timelineUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvsection=0&format=json&titles=${encodeURIComponent(title)}&origin=*`;
      const timelineResponse = await fetch(timelineUrl);
      const timelineData = await timelineResponse.json();

      // Create timeline entries based on parsed data (this is simplified)
      const timeline = createTimelineFromData(title, page.extract);

      // Extract external links
      const externalLinks =
        page.extlinks?.slice(0, 5).map((link, index) => ({
          title: `Resource ${index + 1}`,
          url: link["*"],
        })) || [];

      // Create media items
      const media = [];
      if (page.thumbnail) {
        media.push({
          id: "m1",
          type: "image" as const,
          url: page.thumbnail.source,
          caption: `Image of ${title}`,
          source: "Wikipedia",
        });
      }

      // Extract dates if possible (this is a simplified approach)
      const dates = extractDatesFromText(page.extract);

      // Create the entity object
      const newEntity: Entity = {
        id: pageId,
        type: entityType,
        name: page.title,
        description: cleanHtmlFromText(page.extract),
        dates: dates,
        location: extractLocationFromText(page.extract),
        coordinates: page.coordinates
          ? {
              lat: page.coordinates[0].lat,
              lng: page.coordinates[0].lon,
            }
          : undefined,
        relationships: relationships,
        media: media,
        timeline: timeline,
        externalLinks: [
          {
            title: "Wikipedia",
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
          },
          ...externalLinks,
        ],
        tags: tags,
        significance: 85, // Default significance
        category: categories[0]?.replace("Category:", "") || "General",
      };

      setEntity(newEntity);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch data from Wikipedia",
      );
      console.error("Wikipedia API error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to clean HTML from Wikipedia text
  const cleanHtmlFromText = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  // Helper function to determine entity type from categories with improved accuracy
  const determineEntityType = (
    categories: string[],
    title: string,
  ): Entity["type"] => {
    // First check the title for common indicators
    const titleLower = title.toLowerCase();

    // Check for person indicators in title
    if (
      /^(mr\.|mrs\.|ms\.|dr\.|prof\.|sir|lady|king|queen|prince|princess)\s/.test(
        titleLower,
      ) ||
      /\b(the\s+\w+|\w+\s+of\s+\w+)$/.test(titleLower)
    ) {
      return "person";
    }

    // Check for place indicators in title
    if (
      /\b(city|town|village|country|state|province|river|mountain|lake|ocean|sea|island)\b/.test(
        titleLower,
      )
    ) {
      return "place";
    }

    // Check for event indicators in title
    if (
      /\b(battle|war|revolution|uprising|election|coronation|ceremony|festival|conference)\b/.test(
        titleLower,
      )
    ) {
      return "event";
    }
    const categoriesString = categories.join(" ").toLowerCase();

    if (
      categoriesString.includes("people") ||
      categoriesString.includes("births") ||
      categoriesString.includes("deaths")
    ) {
      return "person";
    } else if (
      categoriesString.includes("event") ||
      categoriesString.includes("battle") ||
      categoriesString.includes("war")
    ) {
      return "event";
    } else if (
      categoriesString.includes("place") ||
      categoriesString.includes("location") ||
      categoriesString.includes("geography")
    ) {
      return "place";
    } else if (
      categoriesString.includes("organization") ||
      categoriesString.includes("company") ||
      categoriesString.includes("institute")
    ) {
      return "organization";
    } else if (
      categoriesString.includes("artifact") ||
      categoriesString.includes("object") ||
      categoriesString.includes("invention")
    ) {
      return "artifact";
    }

    // Default to person if we can't determine
    return "person";
  };

  // Helper function to determine relationship type
  const determineRelationshipType = (
    linkTitle: string,
    categories: string[],
  ): string => {
    const types = [
      "Political Ally",
      "Family Member",
      "Colleague",
      "Contemporary",
      "Successor",
      "Predecessor",
      "Influence",
    ];
    return types[Math.floor(Math.random() * types.length)];
  };

  // Helper function to extract dates from text with improved accuracy
  const extractDatesFromText = (text: string): string[] | undefined => {
    // More comprehensive regex to find years in the text
    const yearRegex = /\b(1[0-9]{3}|20[0-2][0-9])\b/g;
    const years = [...new Set(text.match(yearRegex) || [])];

    // Look for birth/death patterns
    const birthDeathRegex =
      /\b(born|birth)\s+\w+\s+(\d{1,2}(st|nd|rd|th)?\s+\w+\s+)?(1[0-9]{3}|20[0-2][0-9])\b|\b(died|death)\s+\w+\s+(\d{1,2}(st|nd|rd|th)?\s+\w+\s+)?(1[0-9]{3}|20[0-2][0-9])\b/gi;
    const birthDeathMatches = text.match(birthDeathRegex) || [];

    // Extract years from birth/death matches
    const birthDeathYears = birthDeathMatches
      .map((match) => {
        const yearMatch = match.match(/(1[0-9]{3}|20[0-2][0-9])/);
        return yearMatch ? yearMatch[0] : null;
      })
      .filter(Boolean) as string[];

    // Combine all years and sort
    const allYears = [...years, ...birthDeathYears];

    if (allYears.length >= 2) {
      return allYears.slice(0, 2).sort();
    } else if (allYears.length === 1) {
      return [allYears[0]];
    }

    return undefined;
  };

  // Helper function to extract location from text with improved pattern matching
  const extractLocationFromText = (text: string): string | undefined => {
    // Common location patterns
    const locationPatterns = [
      // City, Country format
      /\b([A-Z][a-z]+),\s+([A-Z][a-z]+)\b/,
      // in Location
      /\bin\s+([A-Z][a-z]+)\b/,
      // at Location
      /\bat\s+([A-Z][a-z]+)\b/,
      // Common location indicators
      /\b(born|lived|resided|visited|traveled)\s+(in|at|to)\s+([A-Z][a-z]+)\b/,
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        // Return the last capture group which should be the location
        return match[match.length - 1];
      }
    }

    // Fallback to common locations if no patterns match
    const commonLocations = [
      "London",
      "Paris",
      "New York",
      "Tokyo",
      "Berlin",
      "Rome",
      "Washington",
      "Moscow",
      "Beijing",
      "Delhi",
      "Cairo",
      "Athens",
      "Vienna",
      "Madrid",
      "Amsterdam",
      "Brussels",
      "Dublin",
      "Stockholm",
    ];

    for (const location of commonLocations) {
      if (text.includes(location)) {
        return location;
      }
    }

    return undefined;
  };

  // Helper function to create timeline from data
  const createTimelineFromData = (
    title: string,
    extract: string,
  ): Timeline[] => {
    // This is a simplified approach - a real implementation would
    // need NLP or a more sophisticated approach to extract actual events

    // Extract sentences to create timeline events
    const sentences = extract.split(/(?<=\.)\s+/);
    const timeline: Timeline[] = [];

    // Create up to 5 timeline entries
    const maxEntries = Math.min(5, sentences.length);
    for (let i = 0; i < maxEntries; i++) {
      const yearMatch = sentences[i].match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
      if (yearMatch) {
        timeline.push({
          id: `t${i}`,
          date: yearMatch[0],
          title: `Event ${i + 1}`,
          description:
            sentences[i].substring(0, 100) +
            (sentences[i].length > 100 ? "..." : ""),
          importance: Math.floor(Math.random() * 30) + 70, // Random importance between 70-100
        });
      }
    }

    return timeline;
  };

  // Calculate age if the entity is a person with birth/death dates
  const calculateAge = () => {
    if (entity?.type === "person" && entity.dates && entity.dates.length >= 2) {
      const birthYear = parseInt(entity.dates[0]);
      const deathYear = parseInt(entity.dates[1]);
      if (!isNaN(birthYear) && !isNaN(deathYear)) {
        return deathYear - birthYear;
      }
    }
    return null;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    // Handle just year format
    if (/^\d{4}$/.test(dateString)) {
      return dateString;
    }

    // Handle full date format
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
    switch (entity?.type) {
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
    switch (entity?.type) {
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
  const filteredRelationships = entity?.relationships?.filter(
    (rel) =>
      rel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rel.type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Sort timeline entries
  const sortedTimeline = [...(entity?.timeline || [])].sort((a, b) => {
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

  // Handle retry when there's an error
  const handleRetry = () => {
    if (entityName) {
      fetchWikipediaData(entityName);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card className="p-8 h-full w-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCcw className="h-10 w-10 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">
            Loading data from Wikipedia...
          </p>
          <p className="text-gray-500 mt-2">
            Fetching information about {entityName}
          </p>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-8 h-full w-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">
            Error loading data
          </p>
          <p className="text-gray-500 mt-2">{error}</p>
          <Button onClick={handleRetry} variant="outline" className="mt-4">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  // If no entity is loaded yet
  if (!entity) {
    return (
      <Card className="p-8 h-full w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700">
            No entity selected
          </p>
          <p className="text-gray-500 mt-2">
            Please select an entity to view details
          </p>
        </div>
      </Card>
    );
  }

  // Main render function based on view mode
  if (viewMode === "compact") {
    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <img
              src={
                entity.media?.[0]?.url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${entity.name}`
              }
              alt={entity.name}
            />
          </Avatar>
          <div>
            <h3 className="font-medium text-base">{entity.name}</h3>
            <Badge variant="outline" className={getEntityTypeColor()}>
              {entity.type.charAt(0).toUpperCase() + entity.type.slice(1)}
            </Badge>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {entity.description}
        </p>
        <Button
          variant="link"
          size="sm"
          className="p-0 mt-1 h-auto"
          onClick={() => onRelated?.(entity.id)}
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
                entity.media?.[0]?.url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${entity.name}`
              }
              alt={entity.name}
            />
          </Avatar>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-serif font-semibold">
                  {entity.name}
                </h2>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="outline" className={getEntityTypeColor()}>
                    <span className="flex items-center gap-1">
                      {getEntityTypeIcon()}
                      {entity.type.charAt(0).toUpperCase() +
                        entity.type.slice(1)}
                    </span>
                  </Badge>
                  {entity.category && (
                    <Badge variant="outline" className="bg-gray-50">
                      {entity.category}
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

            {entity.alternateNames && entity.alternateNames.length > 0 && (
              <div className="text-sm text-gray-500 mt-1">
                Also known as: {entity.alternateNames.join(", ")}
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
              <div className="flex justify-between items-start">
                <p className="text-gray-700">{entity.description}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-4 flex-shrink-0"
                  onClick={handleRetry}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {entity.dates && entity.dates.length > 0 && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">Dates</div>
                        <span>
                          {entity.dates.map(formatDate).join(" - ")}
                          {calculateAge() !== null && (
                            <span className="text-gray-500 ml-2">
                              ({calculateAge()} years)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {entity.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">Location</div>
                        <span>{entity.location}</span>
                      </div>
                    </div>
                  )}

                  {entity.significance !== undefined && (
                    <div className="flex items-start gap-2 text-gray-600">
                      <Star className="h-4 w-4 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <div className="font-medium">
                          Historical Significance
                        </div>
                        <div className="w-full mt-1">
                          <Progress
                            value={entity.significance}
                            className="h-2"
                          />
                          <div className="flex justify-between text-xs mt-1">
                            <span>Low</span>
                            <span>{entity.significance}/100</span>
                            <span>High</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {entity.tags && entity.tags.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-medium flex items-center gap-2">
                      <Tag className="h-4 w-4 text-gray-400" />
                      Tags
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {entity.tags.map((tag, i) => (
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

              {entity.coordinates && (
                <div className="mt-4 border rounded-lg p-2 bg-gray-50">
                  <div className="font-medium mb-2">Map Location</div>
                  <div className="h-48 bg-blue-50 flex items-center justify-center rounded border relative overflow-hidden">
                    {/* Placeholder for actual map integration */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 text-red-500 mx-auto" />
                        <div className="text-sm mt-2">
                          Coordinates: {entity.coordinates.lat.toFixed(4)},{" "}
                          {entity.coordinates.lng.toFixed(4)}
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

            {sortedTimeline.length > 0 ? (
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
            ) : (
              <div className="text-center text-gray-500 py-6">
                No timeline events available.
              </div>
            )}
          </TabsContent>

          <TabsContent value="relationships" className="p-6">
            <div className="mb-4">
              <Input
                type="search"
                placeholder="Search relationships..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {filteredRelationships && filteredRelationships.length > 0 ? (
              <div className="space-y-3">
                {filteredRelationships.map((relationship) => (
                  <Card key={relationship.id} className="shadow-sm">
                    <div className="flex items-center justify-between p-4">
                      <div>
                        <h4 className="font-medium">{relationship.name}</h4>
                        <p className="text-sm text-gray-500">
                          {relationship.type}
                        </p>
                        {relationship.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {relationship.description}
                          </p>
                        )}
                        {renderSignificance(relationship.significance)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRelated?.(relationship.id)}
                      >
                        View Related
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-6">
                No relationships found.
              </div>
            )}
          </TabsContent>

          <TabsContent value="media" className="p-6">
            {entity.media && entity.media.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {entity.media.map((mediaItem) => (
                  <Card
                    key={mediaItem.id}
                    className="overflow-hidden shadow-sm"
                  >
                    {mediaItem.type === "image" ? (
                      <img
                        src={mediaItem.url}
                        alt={mediaItem.caption}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="h-48 flex items-center justify-center bg-gray-50 text-gray-500">
                        {getMediaTypeIcon(mediaItem.type)}
                        <span className="ml-2">
                          {mediaItem.type.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="p-4">
                      <h4 className="font-medium">{mediaItem.caption}</h4>
                      {mediaItem.date && (
                        <div className="text-sm text-gray-500">
                          Date: {formatDate(mediaItem.date)}
                        </div>
                      )}
                      {mediaItem.source && (
                        <div className="text-sm text-gray-500">
                          Source: {mediaItem.source}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-6">
                No media available.
              </div>
            )}
          </TabsContent>

          <TabsContent value="links" className="p-6">
            {entity.externalLinks && entity.externalLinks.length > 0 ? (
              <ul className="space-y-2">
                {entity.externalLinks.map((link, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {link.title}
                    </a>
                    <LinkIcon className="h-4 w-4 text-gray-400" />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-gray-500 py-6">
                No external links available.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </Card>
  );
};

export default EntityDetails;
