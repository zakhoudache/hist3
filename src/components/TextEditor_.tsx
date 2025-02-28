import React, { useState, useCallback, useRef, useEffect } from "react";
// import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Textarea } from "./ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "./ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  Save,
  Download,
  Search,
  ChevronUp,
  ChevronDown,
  Settings,
  Eye,
  FileText,
  BarChart2,
  Clock,
  UserRound,
  MapPin,
  Calendar,
  Book,
  Lightbulb,
  Flag,
  Sparkles,
  Workflow,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import KnowledgeGraph from "./KnowledgeGraph";
import { createClient } from "@supabase/supabase-js";

// Initialize the Supabase client (place this at the top of your file or in a utils file)
const supabase = createClient(
  "https://uimmjzuqdqxfqoikcexf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbW1qenVxZHF4ZnFvaWtjZXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwNDA1NTcsImV4cCI6MjA1NTYxNjU1N30.gSdv5Q0seyNiWhjEwXCzKzxYN1TUTFGxOpKUZtF06J0",
);
// Type definitions
export type EntityType =
  | "person"
  | "place"
  | "event"
  | "concept"
  | "organization"
  | "artifact"
  | "time"
  | "other";

export interface Entity {
  id: string;
  text: string;
  type: EntityType;
  confidence: number;
  offsets: { start: number; end: number }[];
  metadata?: {
    description?: string;
    importance?: number;
    dates?: { start?: string; end?: string };
    category?: string;
  };
}

export interface TextInsight {
  type:
    | "readability"
    | "sentiment"
    | "complexity"
    | "historical_accuracy"
    | "bias";
  score: number;
  summary: string;
  details?: string;
}

export interface TextSnapshot {
  id: string;
  timestamp: number;
  content: string;
  wordCount: number;
  description?: string;
}

export interface Node {
  id: string;
  type: EntityType;
  label: string;
  x?: number;
  y?: number;
  description?: string;
  image?: string;
  date?: string;
  isNew?: boolean;
  isEditing?: boolean;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  isNew?: boolean;
  isEditing?: boolean;
}

export interface TextEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onEntityDetected?: (entity: Entity) => void;
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  onNodeSelect?: (nodeId: string) => void;
  mode?: "standard" | "research" | "teaching" | "collaborative";
  readOnly?: boolean;
  maxLength?: number;
  autoSave?: boolean;
  showAnalytics?: boolean;
}

const TextEditor: React.FC<TextEditorProps> = ({
  initialContent = "",
  onContentChange,
  onEntityDetected,
  onNodesChange,
  onEdgesChange,
  onNodeSelect,
  mode = "standard",
  readOnly = false,
  maxLength,
  autoSave = true,
  showAnalytics = true,
}) => {
  // Supabase client for database operations
  // const supabase = useSupabaseClient();

  // Component state
  const [text, setText] = useState(initialContent);
  const [selectedTab, setSelectedTab] = useState<
    "write" | "preview" | "analyze" | "graph" | "flashcards"
  >("write");
  const [editMode, setEditMode] = useState<"rich" | "markdown">("rich");
  const [fontSize, setFontSize] = useState(16);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [insights, setInsights] = useState<TextInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { index: number; text: string }[]
  >([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [showWordCount, setShowWordCount] = useState(true);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [history, setHistory] = useState<TextSnapshot[]>([]);
  const [selectedStyleTab, setSelectedStyleTab] = useState<
    "text" | "paragraph" | "insert" | "history"
  >("text");
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [aiAssistanceEnabled, setAiAssistanceEnabled] = useState(true);
  const [highlightEntities, setHighlightEntities] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [nodeList, setNodeList] = useState<Node[]>([]);
  const [edgeList, setEdgeList] = useState<Edge[]>([]);
  const [graphLoading, setGraphLoading] = useState(false);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const analyzeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mode settings
  const modeSettings = {
    standard: {
      showAnalytics: true,
      showAI: true,
      showGraph: true,
    },
    research: {
      showAnalytics: true,
      showAI: true,
      showGraph: true,
    },
    teaching: {
      showAnalytics: true,
      showAI: true,
      showGraph: true,
    },
    collaborative: {
      showAnalytics: true,
      showAI: true,
      showGraph: true,
    },
  };

  // Word/Character count calculation
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const characterCount = text.length;

  let selectedText = "";
  let selectedWordCount = 0;
  let selectedCharacterCount = 0;

  if (textareaRef.current) {
    const { selectionStart, selectionEnd } = textareaRef.current;
    if (selectionStart !== selectionEnd) {
      selectedText = text.slice(selectionStart, selectionEnd);
      selectedWordCount = selectedText
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
      selectedCharacterCount = selectedText.length;
    }
  }

  // Text change handler
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);

    if (onContentChange) {
      onContentChange(newText);
    }

    setUnsavedChanges(true);

    // Auto analyze after delay
    if (autoAnalyze) {
      if (analyzeTimeoutRef.current) {
        clearTimeout(analyzeTimeoutRef.current);
      }

      analyzeTimeoutRef.current = setTimeout(() => {
        handleAnalyze();
      }, 1500);
    }
  };

  // Update parent components when nodes or edges change
  useEffect(() => {
    if (onNodesChange && nodeList.length > 0) {
      onNodesChange(nodeList);
    }
  }, [nodeList, onNodesChange]);

  useEffect(() => {
    if (onEdgesChange && edgeList.length > 0) {
      onEdgesChange(edgeList);
    }
  }, [edgeList, onEdgesChange]);

  // Generate flashcards from entity data
  const generateFlashcards = () => {
    if (entities.length === 0) return [];

    const flashcards = [];

    // Add entity type flashcards
    for (const entity of entities.slice(0, 5)) {
      flashcards.push({
        question: `What type of entity is "${entity.text}"?`,
        answer: `"${entity.text}" is a ${entity.type}.`,
      });
    }

    // Add relationship flashcards if we have edges
    if (edgeList.length > 0) {
      for (const edge of edgeList.slice(0, 3)) {
        const sourceNode = nodeList.find((n) => n.id === edge.source);
        const targetNode = nodeList.find((n) => n.id === edge.target);
        if (sourceNode && targetNode) {
          flashcards.push({
            question: `What is the relationship between "${sourceNode.label}" and "${targetNode.label}"?`,
            answer: `"${sourceNode.label}" ${edge.relationship || "is connected to"} "${targetNode.label}".`,
          });
        }
      }
    }

    // Add general knowledge flashcards based on entities
    for (const entity of entities.slice(0, 3)) {
      flashcards.push({
        question: `Describe "${entity.text}" in your own words.`,
        answer:
          entity.metadata?.description ||
          `"${entity.text}" is a ${entity.type} mentioned in the text.`,
      });
    }

    return flashcards;
  };

  const handleNextFlashcard = () => {
    setShowFlashcardAnswer(false);
    const flashcards = generateFlashcards();
    setCurrentFlashcardIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevFlashcard = () => {
    setShowFlashcardAnswer(false);
    const flashcards = generateFlashcards();
    setCurrentFlashcardIndex(
      (prev) => (prev - 1 + flashcards.length) % flashcards.length,
    );
  };

  // Text analysis handler
  const handleAnalyze = useCallback(async () => {
    if (!text.trim()) return;

    setLoading(true);

    try {
      // Import the entity extraction service
      const { analyzeText } = await import("@/services/entityExtraction");

      // Analyze the text
      const result = await analyzeText(text);

      // Update state with the analysis results
      setEntities(result.entities);
      setInsights(result.insights);
      setNodeList(result.nodes);
      setEdgeList(result.edges);

      // Notify parent component about detected entities
      if (onEntityDetected) {
        result.entities.forEach((entity) => onEntityDetected(entity));
      }

      // Create new snapshot
      const newSnapshot: TextSnapshot = {
        id: `snapshot-${Date.now()}`,
        timestamp: Date.now(),
        content: text,
        wordCount,
        description: `Snapshot at ${new Date().toLocaleTimeString()}`,
      };

      setHistory((prev) => [...prev, newSnapshot]);
      setUnsavedChanges(false);
    } catch (err) {
      console.error("Analysis error:", err);
    } finally {
      setLoading(false);
    }
  }, [text, wordCount, onEntityDetected]);

  // Search functionality
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const regex = new RegExp(searchQuery, "gi");
    const results: { index: number; text: string }[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      results.push({
        index: match.index,
        text: match[0],
      });
    }

    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);

    if (results.length > 0 && textareaRef.current) {
      const { index } = results[0];
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(index, index + searchQuery.length);
      scrollTextareaToSelection();
    }
  };

  const navigateSearch = (direction: "next" | "prev") => {
    if (searchResults.length === 0) return;

    let newIndex;
    if (direction === "next") {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex =
        (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    }

    setCurrentSearchIndex(newIndex);

    if (textareaRef.current) {
      const { index } = searchResults[newIndex];
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(index, index + searchQuery.length);
      scrollTextareaToSelection();
    }
  };

  const scrollTextareaToSelection = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const { selectionStart } = textarea;

      // This is a hacky way to scroll to the selection, but it works
      const lines = text.substring(0, selectionStart).split("\n").length - 1;
      const lineHeight = 20; // approximate line height
      textarea.scrollTop = lines * lineHeight;
    }
  };

  // Text formatting
  const applyFormatting = (format: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const selectedText = text.substring(selectionStart, selectionEnd);

    let newText = text;
    let newCursorPos = selectionEnd;

    switch (format) {
      case "bold":
        newText =
          text.substring(0, selectionStart) +
          `**${selectedText}**` +
          text.substring(selectionEnd);
        newCursorPos = selectionEnd + 4;
        break;
      case "italic":
        newText =
          text.substring(0, selectionStart) +
          `*${selectedText}*` +
          text.substring(selectionEnd);
        newCursorPos = selectionEnd + 2;
        break;
      case "underline":
        newText =
          text.substring(0, selectionStart) +
          `__${selectedText}__` +
          text.substring(selectionEnd);
        newCursorPos = selectionEnd + 4;
        break;
      case "h1":
        newText =
          text.substring(0, selectionStart) +
          `# ${selectedText}` +
          text.substring(selectionEnd);
        newCursorPos = selectionEnd + 2;
        break;
      case "h2":
        newText =
          text.substring(0, selectionStart) +
          `## ${selectedText}` +
          text.substring(selectionEnd);
        newCursorPos = selectionEnd + 3;
        break;
      case "h3":
        newText =
          text.substring(0, selectionStart) +
          `### ${selectedText}` +
          text.substring(selectionEnd);
        newCursorPos = selectionEnd + 4;
        break;
      case "ul":
        newText =
          text.substring(0, selectionStart) +
          `- ${selectedText}` +
          text.substring(selectionEnd);
        newCursorPos = selectionEnd + 2;
        break;
      case "ol":
        newText =
          text.substring(0, selectionStart) +
          `1. ${selectedText}` +
          text.substring(selectionEnd);
        newCursorPos = selectionEnd + 3;
        break;
      case "quote":
        newText =
          text.substring(0, selectionStart) +
          `> ${selectedText}` +
          text.substring(selectionEnd);
        newCursorPos = selectionEnd + 2;
        break;
      case "link":
        newText =
          text.substring(0, selectionStart) +
          `[${selectedText}](url)` +
          text.substring(selectionEnd);
        newCursorPos = selectionEnd + 7;
        break;
    }

    setText(newText);

    // Need to wait for state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Snapshot functions
  const saveSnapshot = () => {
    const newSnapshot: TextSnapshot = {
      id: `snapshot-${Date.now()}`,
      timestamp: Date.now(),
      content: text,
      wordCount,
      description: "Manual save",
    };

    setHistory((prev) => [...prev, newSnapshot]);
    setUnsavedChanges(false);
  };

  const restoreSnapshot = (snapshot: TextSnapshot) => {
    if (unsavedChanges) {
      if (
        !window.confirm(
          "You have unsaved changes. Are you sure you want to restore a previous version?",
        )
      ) {
        return;
      }
    }

    setText(snapshot.content);
    setUnsavedChanges(false);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  // Get highlighted text with entities
  const getHighlightedText = () => {
    if (!highlightEntities || !entities || entities.length === 0) {
      return `<div class="prose">${text.replace(/\n/g, "<br/>")}</div>`;
    }

    let htmlText = text;
    // Create a safe copy of entities and ensure all have valid offsets
    const entitiesWithOffsets = entities.filter(
      (entity) =>
        entity &&
        entity.offsets &&
        entity.offsets.length > 0 &&
        entity.offsets[0] &&
        typeof entity.offsets[0].start === "number",
    );

    // Sort entities by starting offset (descending) to replace from the end
    const sortedEntities = [...entitiesWithOffsets].sort((a, b) => {
      return (b.offsets[0].start || 0) - (a.offsets[0].start || 0);
    });

    const colorMap: Record<EntityType, string> = {
      person: "#ffcccb",
      place: "#c2f0c2",
      event: "#c2e0ff",
      concept: "#f5f5dc",
      organization: "#ffd700",
      artifact: "#e6e6fa",
      time: "#f08080",
      other: "#d3d3d3",
    };

    sortedEntities.forEach((entity) => {
      if (!entity.offsets || entity.offsets.length === 0) return;

      entity.offsets.forEach((offset) => {
        if (
          !offset ||
          typeof offset.start !== "number" ||
          typeof offset.end !== "number"
        )
          return;

        const { start, end } = offset;
        if (start < 0 || end > htmlText.length || start >= end) return;

        const entityText = htmlText.substring(start, end);
        const entityType = entity.type || "other";
        const highlightedEntity = `<span class="entity-highlight" style="background-color: ${colorMap[entityType] || "#d3d3d3"};" title="${entityType}: ${entity.metadata?.description || ""}">${entityText}</span>`;
        htmlText =
          htmlText.substring(0, start) +
          highlightedEntity +
          htmlText.substring(end);
      });
    });

    return `<div class="prose">${htmlText.replace(/\n/g, "<br/>")}</div>`;
  };

  // Download content
  const downloadContent = (format: "txt" | "md" | "html") => {
    let content = text;
    let mimeType = "text/plain";
    let extension = "txt";

    if (format === "html") {
      content = getHighlightedText();
      mimeType = "text/html";
      extension = "html";
    } else if (format === "md") {
      mimeType = "text/markdown";
      extension = "md";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `document.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  // Make sure you have the Supabase client properly initialized before using it

  // Updated generateKnowledgeGraph function with error checking
  const generateKnowledgeGraph = async () => {
    setGraphLoading(true);
    try {
      // Check if supabase and supabase.functions are defined
      if (!supabase || !supabase.functions) {
        console.error("Supabase client or functions not available");
        throw new Error("Supabase client not properly initialized");
      }

      console.log("Invoking Supabase function: generateKnowledgeGraph");
      const { data, error } = await supabase.functions.invoke(
        "generateKnowledgeGraph",
        {
          body: { text },
        },
      );

      console.log("Supabase function response:", { data, error });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.nodes && data?.edges) {
        console.log("Knowledge graph data received:", {
          nodes: data.nodes,
          edges: data.edges,
        });
        setNodeList(data.nodes);
        setEdgeList(data.edges);
      }
    } catch (err) {
      console.error("Knowledge graph generation error:", err);
      console.log("Falling back to mock data");

      // Fallback to mock data
      const mockNodes: Node[] = entities.map((entity, index) => ({
        id: entity.id,
        type: entity.type,
        label: entity.text,
        description: entity.metadata?.description,
      }));

      const mockEdges: Edge[] = [];
      // Create some sample edges
      for (let i = 0; i < mockNodes.length - 1; i++) {
        mockEdges.push({
          id: `edge-${i}`,
          source: mockNodes[i].id,
          target: mockNodes[i + 1].id,
          relationship: "related to",
        });
      }

      console.log("Mock Nodes:", mockNodes);
      console.log("Mock Edges:", mockEdges);
      setNodeList(mockNodes);
      setEdgeList(mockEdges);
    } finally {
      setGraphLoading(false);
      console.log("Graph loading complete.");
    }
  };
  // Auto-save effect
  useEffect(() => {
    if (autoSave && unsavedChanges) {
      const timeoutId = setTimeout(() => {
        saveSnapshot();
      }, 30000); // Auto-save after 30 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [text, unsavedChanges, autoSave]);

  // Clear search results when search query is cleared
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
    }
  }, [searchQuery]);

  return (
    <div className={`text-editor ${focusMode ? "focus-mode" : ""}`}>
      <Tabs
        value={selectedTab}
        onValueChange={(val) => setSelectedTab(val as any)}
      >
        <div className="flex justify-between items-center mb-2">
          <TabsList>
            <TabsTrigger value="write" className="flex items-center gap-1">
              <FileText size={16} />
              <span>Write</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-1">
              <Eye size={16} />
              <span>Preview</span>
            </TabsTrigger>
            <TabsTrigger value="analyze" className="flex items-center gap-1">
              <BarChart2 size={16} />
              <span>Analyze</span>
            </TabsTrigger>
            <TabsTrigger value="graph" className="flex items-center gap-1">
              <Workflow size={16} />
              <span>Knowledge Graph</span>
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="flex items-center gap-1">
              <BookOpen size={16} />
              <span>Flashcards</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {selectedTab === "write" && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setFocusMode(!focusMode)}
                      >
                        {focusMode ? (
                          <Minimize size={18} />
                        ) : (
                          <Maximize size={18} />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {focusMode ? "Exit Focus Mode" : "Focus Mode"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={saveSnapshot}
                      >
                        <Save size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Save</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Download size={18} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48">
                    <div className="flex flex-col gap-2">
                      <Button onClick={() => downloadContent("txt")}>
                        Download as TXT
                      </Button>
                      <Button onClick={() => downloadContent("md")}>
                        Download as Markdown
                      </Button>
                      <Button onClick={() => downloadContent("html")}>
                        Download as HTML
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Settings size={18} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h3 className="font-medium">Editor Settings</h3>

                      <div className="space-y-2">
                        <Label htmlFor="fontSize">
                          Font Size: {fontSize}px
                        </Label>
                        <Slider
                          id="fontSize"
                          min={12}
                          max={24}
                          step={1}
                          value={[fontSize]}
                          onValueChange={(vals) => setFontSize(vals[0])}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="word-count">Show Word Count</Label>
                        <Switch
                          id="word-count"
                          checked={showWordCount}
                          onCheckedChange={setShowWordCount}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-analyze">Auto-Analyze Text</Label>
                        <Switch
                          id="auto-analyze"
                          checked={autoAnalyze}
                          onCheckedChange={setAutoAnalyze}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="highlight-entities">
                          Highlight Entities
                        </Label>
                        <Switch
                          id="highlight-entities"
                          checked={highlightEntities}
                          onCheckedChange={setHighlightEntities}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="ai-assistance">
                          AI Writing Assistance
                        </Label>
                        <Switch
                          id="ai-assistance"
                          checked={aiAssistanceEnabled}
                          onCheckedChange={setAiAssistanceEnabled}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </>
            )}

            {selectedTab === "analyze" && !loading && (
              <Button
                onClick={handleAnalyze}
                size="sm"
                className="flex items-center gap-1"
              >
                <BarChart2 size={16} />
                <span>Analyze Now</span>
              </Button>
            )}

            {selectedTab === "graph" && !graphLoading && (
              <Button
                onClick={generateKnowledgeGraph}
                size="sm"
                className="flex items-center gap-1"
              >
                <Workflow size={16} />
                <span>Generate Graph</span>
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="write" className="p-0">
          <Card className="relative">
            {selectedTab === "write" && (
              <div className="flex items-center gap-2 p-2 border-b">
                <Tabs
                  value={selectedStyleTab}
                  onValueChange={(val) => setSelectedStyleTab(val as any)}
                >
                  <TabsList className="h-8">
                    <TabsTrigger value="text" className="h-7 px-2 text-xs">
                      Text
                    </TabsTrigger>
                    <TabsTrigger value="paragraph" className="h-7 px-2 text-xs">
                      Paragraph
                    </TabsTrigger>
                    <TabsTrigger value="insert" className="h-7 px-2 text-xs">
                      Insert
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex-1">
                  {selectedStyleTab === "text" && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => applyFormatting("bold")}
                      >
                        <Bold size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => applyFormatting("italic")}
                      >
                        <Italic size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => applyFormatting("underline")}
                      >
                        <Underline size={15} />
                      </Button>
                    </div>
                  )}

                  {selectedStyleTab === "paragraph" && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => applyFormatting("h1")}
                      >
                        <Heading1 size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => applyFormatting("h2")}
                      >
                        <Heading2 size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => applyFormatting("h3")}
                      >
                        <Heading3 size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => applyFormatting("ul")}
                      >
                        <List size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => applyFormatting("ol")}
                      >
                        <ListOrdered size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => applyFormatting("quote")}
                      >
                        <Quote size={15} />
                      </Button>
                    </div>
                  )}

                  {selectedStyleTab === "insert" && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => applyFormatting("link")}
                      >
                        <Link size={15} />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 border rounded-md overflow-hidden">
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-0 h-8 w-36"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearch();
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleSearch}
                    >
                      <Search size={15} />
                    </Button>
                    {searchResults.length > 0 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => navigateSearch("prev")}
                          disabled={searchResults.length <= 1}
                        >
                          <ChevronUp size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => navigateSearch("next")}
                          disabled={searchResults.length <= 1}
                        >
                          <ChevronDown size={15} />
                        </Button>
                        <span className="mr-2 text-xs text-gray-500">
                          {currentSearchIndex + 1}/{searchResults.length}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <ScrollArea className="h-[60vh]">
              <Textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                placeholder="Start writing or paste your text here..."
                className="min-h-[40vh] resize-none border-0 focus-visible:ring-0 p-4 font-serif"
                style={{ fontSize: `${fontSize}px` }}
                readOnly={readOnly}
                maxLength={maxLength}
              />
            </ScrollArea>

            {showWordCount && (
              <div className="text-xs text-gray-500 p-2 border-t flex justify-between items-center">
                <div>
                  {selectedText ? (
                    <span>
                      Selection: {selectedWordCount} words,{" "}
                      {selectedCharacterCount} characters |
                    </span>
                  ) : null}{" "}
                  Total: {wordCount} words, {characterCount} characters
                  {maxLength && (
                    <span>
                      {" "}
                      | {characterCount}/{maxLength} characters used
                    </span>
                  )}
                </div>
                {unsavedChanges && (
                  <Badge variant="outline">Unsaved changes</Badge>
                )}
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                <div className="bg-white p-4 rounded-md shadow-md">
                  <div className="flex flex-col items-center gap-2">
                    <Progress value={45} className="w-48" />
                    <span className="text-sm">Analyzing text...</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="p-0">
          <Card>
            <ScrollArea className="h-[70vh]">
              <div
                className="p-4 font-serif"
                style={{ fontSize: `${fontSize}px` }}
                dangerouslySetInnerHTML={{ __html: getHighlightedText() }}
              />
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="analyze" className="p-0">
          <Card>
            <ScrollArea className="h-[70vh]">
              <div className="p-4">
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Text Insights</h3>
                  {insights.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {insights.map((insight, idx) => (
                        <Card key={idx} className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            {insight.type === "readability" && (
                              <Book className="text-blue-500" size={18} />
                            )}
                            {insight.type === "sentiment" && (
                              <Sparkles className="text-yellow-500" size={18} />
                            )}
                            {insight.type === "complexity" && (
                              <Lightbulb
                                className="text-purple-500"
                                size={18}
                              />
                            )}
                            {insight.type === "historical_accuracy" && (
                              <Flag className="text-green-500" size={18} />
                            )}
                            {insight.type === "bias" && (
                              <Flag className="text-red-500" size={18} />
                            )}
                            <h4 className="font-medium capitalize">
                              {insight.type.replace("_", " ")}
                            </h4>
                          </div>
                          <div className="mb-2">
                            <div className="flex justify-between text-sm mb-1">
                              <span>{insight.summary}</span>
                              <span className="font-medium">
                                {insight.score}/100
                              </span>
                            </div>
                            <Progress value={insight.score} />
                          </div>
                          {insight.details && (
                            <p className="text-sm text-gray-600">
                              {insight.details}
                            </p>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      {loading
                        ? "Analyzing text..."
                        : "No insights available. Click 'Analyze Now' to generate insights."}
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">
                    Detected Entities
                  </h3>
                  {entities.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {entities.map((entity) => (
                        <Card key={entity.id} className="p-3">
                          <div className="flex items-center gap-2 mb-1">
                            {entity.type === "person" && (
                              <UserRound size={16} className="text-red-500" />
                            )}
                            {entity.type === "place" && (
                              <MapPin size={16} className="text-green-500" />
                            )}
                            {entity.type === "event" && (
                              <Calendar size={16} className="text-blue-500" />
                            )}
                            {entity.type === "time" && (
                              <Clock size={16} className="text-orange-500" />
                            )}
                            <h4 className="font-medium">{entity.text}</h4>
                            <Badge variant="outline" className="capitalize">
                              {entity.type}
                            </Badge>
                          </div>
                          {entity.metadata?.description && (
                            <p className="text-sm text-gray-600">
                              {entity.metadata.description}
                            </p>
                          )}
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <span>
                              Confidence: {(entity.confidence * 100).toFixed(0)}
                              %
                            </span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      {loading
                        ? "Detecting entities..."
                        : "No entities detected. Click 'Analyze Now' to detect entities."}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="graph" className="p-0">
          <Card>
            <div className="h-[70vh] flex items-center justify-center bg-gray-50">
              {nodeList.length > 0 ? (
                <KnowledgeGraph
                  nodes={nodeList}
                  edges={edgeList}
                  onNodeSelect={onNodeSelect || (() => {})}
                />
              ) : (
                <div className="text-center py-10 text-gray-500">
                  {graphLoading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Progress value={45} className="w-48" />
                      <span>Generating knowledge graph...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Workflow size={40} className="text-gray-400" />
                      <span>
                        No knowledge graph available. Click 'Generate Graph' to
                        create one from your text.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="flashcards" className="p-0">
          <Card>
            <CardContent className="p-6">
              {entities.length > 0 ? (
                <div className="flex flex-col h-full">
                  <div className="flex-grow flex items-center justify-center">
                    <div className="w-full max-w-md bg-white rounded-lg border p-6 shadow-sm transition-all transform hover:shadow-md">
                      <div className="text-sm text-gray-500 mb-2 flex justify-between">
                        <span>
                          Flashcard {currentFlashcardIndex + 1} of{" "}
                          {generateFlashcards().length}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setShowFlashcardAnswer(!showFlashcardAnswer)
                          }
                        >
                          {showFlashcardAnswer ? "Hide Answer" : "Show Answer"}
                        </Button>
                      </div>
                      <div className="min-h-[200px] flex flex-col">
                        <h3 className="text-lg font-medium mb-4">
                          {generateFlashcards()[currentFlashcardIndex]
                            ?.question || "No question available"}
                        </h3>
                        {showFlashcardAnswer && (
                          <div className="mt-auto pt-4 border-t">
                            <p className="text-gray-700">
                              {generateFlashcards()[currentFlashcardIndex]
                                ?.answer || "No answer available"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevFlashcard}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextFlashcard}
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-grow flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No entities detected to create flashcards.</p>
                    <p className="mt-2">
                      Go to the "Analyze" tab to detect entities first.
                    </p>
                    <Button className="mt-4" onClick={handleAnalyze}>
                      Analyze Text
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedTab === "write" && aiAssistanceEnabled && (
        <Card className="mt-4 p-3 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Sparkles size={18} className="text-blue-500" />
            </div>
            <div>
              <h4 className="font-medium mb-1">AI Writing Assistant</h4>
              <p className="text-sm text-gray-600 mb-2">
                {wordCount < 50
                  ? "Start writing to get AI suggestions and insights about your text."
                  : "I notice you're writing about historical topics. Would you like me to suggest relevant reference sources or help expand on any particular point?"}
              </p>
              {wordCount >= 50 && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline">
                    Suggest sources
                  </Button>
                  <Button size="sm" variant="outline">
                    Expand current point
                  </Button>
                  <Button size="sm" variant="outline">
                    Check historical accuracy
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TextEditor;
