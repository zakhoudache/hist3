import React, { useState, useCallback, useRef, useEffect } from "react";
import { analyzeText } from "@/lib/textAnalysis";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Link,
  Image,
  FileText,
  Calendar,
  User,
  MapPin,
  Search,
  Clock,
  ChevronDown,
  Save,
  Undo,
  Redo,
  Eye,
  Code,
  Download,
  Share2,
  Settings,
  Check,
  AlertTriangle,
  BookOpen,
  BarChart2,
  Zap,
  LifeBuoy,
} from "lucide-react";

// Enhanced entity types
type EntityType =
  | "person"
  | "place"
  | "event"
  | "organization"
  | "concept"
  | "date"
  | "artifact";

interface Entity {
  text: string;
  type: EntityType;
  confidence: number;
  startOffset: number;
  endOffset: number;
  metadata?: {
    description?: string;
    importance?: number;
    dates?: string[];
    category?: string;
  };
}

interface TextInsight {
  type:
    | "readability"
    | "sentiment"
    | "complexity"
    | "historicalAccuracy"
    | "bias";
  score: number;
  summary: string;
  details?: string[];
}

interface TextSnapshot {
  id: string;
  timestamp: number;
  content: string;
  wordCount: number;
  description: string;
}

interface TextEditorProps {
  content?: string;
  onContentChange?: (content: string) => void;
  onEntityDetected?: (entity: Entity) => void;
  mode?: "standard" | "research" | "teaching" | "collaborative";
  readOnly?: boolean;
  maxLength?: number;
  autoSave?: boolean;
  showAnalytics?: boolean;
}

const TextEditor = ({
  content = "Start typing your historical text here...",
  onContentChange = () => {},
  onEntityDetected = () => {},
  mode = "standard",
  readOnly = false,
  maxLength,
  autoSave = true,
  showAnalytics = true,
}: TextEditorProps) => {
  const [text, setText] = useState(content);
  const [selectedTab, setSelectedTab] = useState("write");
  const [editMode, setEditMode] = useState<"rich" | "markdown" | "source">(
    "rich",
  );
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
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [history, setHistory] = useState<TextSnapshot[]>([]);
  const [selectedStyleTab, setSelectedStyleTab] = useState("text");
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [aiAssistanceEnabled, setAiAssistanceEnabled] = useState(true);
  const [highlightEntities, setHighlightEntities] = useState(true);
  const [focusMode, setFocusMode] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const analyzeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const modeSettings = {
    standard: {
      title: "Standard Editor",
      features: ["basic", "formatting", "entities"],
    },
    research: {
      title: "Research Mode",
      features: ["advanced", "citations", "factChecking", "timeline"],
    },
    teaching: {
      title: "Teaching Mode",
      features: ["simplification", "glossary", "explanations"],
    },
    collaborative: {
      title: "Collaborative Mode",
      features: ["comments", "suggestions", "revisionHistory"],
    },
  };

  // Calculate word and character counts
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const charCount = text.length;

  const selectedCount = (() => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selectedText = text.substring(start, end);
      return {
        chars: selectedText.length,
        words: selectedText.split(/\s+/).filter(Boolean).length,
      };
    }
    return { chars: 0, words: 0 };
  })();

  // Handle text change with auto-analysis
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    onContentChange(newText);
    setUnsavedChanges(true);

    // Auto-analyze after user stops typing
    if (autoAnalyze) {
      if (analyzeTimeoutRef.current) {
        clearTimeout(analyzeTimeoutRef.current);
      }
      analyzeTimeoutRef.current = setTimeout(() => {
        handleAnalyze();
      }, 1500);
    }
  };

  // Text analysis function
  const handleAnalyze = useCallback(async () => {
    setLoading(true);
    try {
      // Mock analysis for demo - would connect to real API
      const detectedEntities = await analyzeText(text);

      // Enhanced mock entities
      const enhancedEntities: Entity[] = detectedEntities.map(
        (entity: any, index: number) => ({
          ...entity,
          confidence: Math.random() * 0.4 + 0.6, // Random confidence between 60-100%
          startOffset: text.indexOf(entity.text),
          endOffset: text.indexOf(entity.text) + entity.text.length,
          metadata: {
            description: `Historical ${entity.type} relevant to the text.`,
            importance: Math.floor(Math.random() * 100),
          },
        }),
      );

      setEntities(enhancedEntities);
      enhancedEntities.forEach((entity) => {
        onEntityDetected(entity);
      });

      // Generate insights
      const mockInsights: TextInsight[] = [
        {
          type: "readability",
          score: Math.random() * 100,
          summary: "Text readability is moderate to high.",
          details: [
            "Sentence length is appropriate",
            "Vocabulary is accessible",
          ],
        },
        {
          type: "sentiment",
          score: Math.random() * 100,
          summary: "Neutral to slightly positive tone detected.",
          details: ["Low emotional language", "Factual presentation"],
        },
        {
          type: "complexity",
          score: Math.random() * 100,
          summary: "Medium complexity suitable for general audiences.",
          details: [
            "Some specialized terminology present",
            "Context provided for complex concepts",
          ],
        },
        {
          type: "historicalAccuracy",
          score: Math.random() * 100,
          summary: "Most historical references appear accurate.",
          details: [
            "Cross-referenced with historical data",
            "Timeline consistency maintained",
          ],
        },
        {
          type: "bias",
          score: Math.random() * 100,
          summary: "Minimal detectable bias in presentation.",
          details: [
            "Multiple perspectives acknowledged",
            "Source diversity could be improved",
          ],
        },
      ];

      setInsights(mockInsights);

      // Save snapshot to history
      const newSnapshot: TextSnapshot = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        content: text,
        wordCount,
        description: `Revision with ${enhancedEntities.length} entities detected`,
      };

      setHistory((prev) => [newSnapshot, ...prev]);
      setUnsavedChanges(false);
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setLoading(false);
    }
  }, [text, wordCount, onEntityDetected]);

  // Search functionality
  const handleSearch = useCallback(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }

    const regex = new RegExp(searchQuery, "gi");
    const matches: { index: number; text: string }[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        text: match[0],
      });
    }

    setSearchResults(matches);
    setCurrentSearchIndex(matches.length > 0 ? 0 : -1);

    // Scroll to first result
    if (matches.length > 0 && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        matches[0].index,
        matches[0].index + matches[0].text.length,
      );
    }
  }, [searchQuery, text]);

  // Navigate search results
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

    // Scroll to selection
    if (textareaRef.current) {
      const result = searchResults[newIndex];
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        result.index,
        result.index + result.text.length,
      );
    }
  };

  // Formatting functions
  const applyFormatting = (format: string) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = text.substring(start, end);

    let formattedText = "";
    let newCursorPos = end;

    switch (format) {
      case "bold":
        formattedText = `**${selectedText}**`;
        newCursorPos = start + 2 + selectedText.length;
        break;
      case "italic":
        formattedText = `_${selectedText}_`;
        newCursorPos = start + 1 + selectedText.length;
        break;
      case "underline":
        formattedText = `<u>${selectedText}</u>`;
        newCursorPos = start + 3 + selectedText.length;
        break;
      case "h1":
        formattedText = `\n# ${selectedText}\n`;
        newCursorPos = start + 3 + selectedText.length;
        break;
      case "h2":
        formattedText = `\n## ${selectedText}\n`;
        newCursorPos = start + 4 + selectedText.length;
        break;
      case "h3":
        formattedText = `\n### ${selectedText}\n`;
        newCursorPos = start + 5 + selectedText.length;
        break;
      case "quote":
        formattedText = `\n> ${selectedText}\n`;
        newCursorPos = start + 3 + selectedText.length;
        break;
      case "list":
        formattedText = selectedText
          .split("\n")
          .map((line) => `- ${line}`)
          .join("\n");
        break;
      case "orderedList":
        formattedText = selectedText
          .split("\n")
          .map((line, i) => `${i + 1}. ${line}`)
          .join("\n");
        break;
      case "link":
        formattedText = `[${selectedText}](url)`;
        newCursorPos = start + selectedText.length + 3;
        break;
      default:
        return;
    }

    const newText =
      text.substring(0, start) + formattedText + text.substring(end);
    setText(newText);
    onContentChange(newText);

    // This will be executed after the state update and re-render
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Save current text as a snapshot
  const saveSnapshot = () => {
    const newSnapshot: TextSnapshot = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      content: text,
      wordCount,
      description: "Manual save",
    };

    setHistory((prev) => [newSnapshot, ...prev]);
    setUnsavedChanges(false);
  };

  // Restore from snapshot
  const restoreSnapshot = (snapshot: TextSnapshot) => {
    if (unsavedChanges) {
      if (
        window.confirm(
          "You have unsaved changes. Are you sure you want to revert to a previous version?",
        )
      ) {
        setText(snapshot.content);
        onContentChange(snapshot.content);
        setUnsavedChanges(false);
      }
    } else {
      setText(snapshot.content);
      onContentChange(snapshot.content);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get text with highlighted entities for preview
  const getHighlightedText = () => {
    if (!highlightEntities || entities.length === 0) {
      return text;
    }

    // Sort entities by starting position (descending)
    const sortedEntities = [...entities].sort(
      (a, b) => b.startOffset - a.startOffset,
    );

    let result = text;
    for (const entity of sortedEntities) {
      const { startOffset, endOffset, type } = entity;

      const colorMap: Record<EntityType, string> = {
        person: "#e6f2ff",
        place: "#e6ffe6",
        event: "#ffe6e6",
        organization: "#f2e6ff",
        concept: "#fff2e6",
        date: "#e6ffff",
        artifact: "#ffe6f2",
      };

      const color = colorMap[type] || "#f0f0f0";

      const replacement = `<span style="background-color: ${color}; padding: 0 2px; border-radius: 2px;">${result.substring(startOffset, endOffset)}</span>`;
      result =
        result.substring(0, startOffset) +
        replacement +
        result.substring(endOffset);
    }

    return result;
  };

  // Download text content
  const downloadContent = (format: "txt" | "md" | "html") => {
    let content = text;
    let mimeType = "text/plain";
    let extension = "txt";

    if (format === "html") {
      content = `<!DOCTYPE html>
<html>
<head>
  <title>Historical Document</title>
  <meta charset="utf-8">
</head>
<body>
  <article>
    ${text
      .split("\n")
      .map((line) => `<p>${line}</p>`)
      .join("")}
  </article>
</body>
</html>`;
      mimeType = "text/html";
      extension = "html";
    } else if (format === "md") {
      // Content already in markdown format
      mimeType = "text/markdown";
      extension = "md";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historical_document.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && unsavedChanges) {
      const timer = setTimeout(() => {
        saveSnapshot();
      }, 30000); // Auto-save after 30 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [text, unsavedChanges, autoSave]);

  // Effect for search handling
  useEffect(() => {
    if (searchQuery === "") {
      setSearchResults([]);
    }
  }, [searchQuery]);

  return (
    <Card
      className={`h-full w-full bg-white flex flex-col ${focusMode ? "max-w-3xl mx-auto" : ""}`}
    >
      <div className="border-b p-2">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <div className="flex justify-between items-center px-2">
            <TabsList>
              <TabsTrigger value="write" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>Write</span>
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </TabsTrigger>
              <TabsTrigger value="analyze" className="flex items-center gap-1">
                <BarChart2 className="h-4 w-4" />
                <span>Analyze</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>History</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFocusMode(!focusMode)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{focusMode ? "Exit focus mode" : "Focus mode"}</p>
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
                      disabled={!unsavedChanges}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Save snapshot</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadContent("txt")}
                    >
                      Plain Text (.txt)
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadContent("md")}
                    >
                      Markdown (.md)
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadContent("html")}
                    >
                      HTML (.html)
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Editor Settings</h4>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="font-size">
                          Font Size: {fontSize}px
                        </Label>
                      </div>
                      <Slider
                        id="font-size"
                        min={12}
                        max={24}
                        step={1}
                        value={[fontSize]}
                        onValueChange={(value) => setFontSize(value[0])}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="word-count"
                        checked={showWordCount}
                        onCheckedChange={setShowWordCount}
                      />
                      <Label htmlFor="word-count">Show word count</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="auto-analyze"
                        checked={autoAnalyze}
                        onCheckedChange={setAutoAnalyze}
                      />
                      <Label htmlFor="auto-analyze">Auto-analyze content</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="highlight-entities"
                        checked={highlightEntities}
                        onCheckedChange={setHighlightEntities}
                      />
                      <Label htmlFor="highlight-entities">
                        Highlight detected entities
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="ai-assistance"
                        checked={aiAssistanceEnabled}
                        onCheckedChange={setAiAssistanceEnabled}
                      />
                      <Label htmlFor="ai-assistance">
                        AI writing assistance
                      </Label>
                    </div>

                    <div className="pt-2 border-t">
                      <h4 className="font-medium mb-2">Editor Mode</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={editMode === "rich" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setEditMode("rich")}
                        >
                          Rich Text
                        </Button>
                        <Button
                          variant={
                            editMode === "markdown" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setEditMode("markdown")}
                        >
                          Markdown
                        </Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <TabsContent value="write" className="pt-0 px-0">
            {/* Formatting Toolbar */}
            <div className="border-b border-t flex flex-wrap items-center p-1 gap-1 bg-gray-50">
              <Tabs
                value={selectedStyleTab}
                onValueChange={setSelectedStyleTab}
                className="w-full"
              >
                <TabsList className="w-full justify-start mb-1">
                  <TabsTrigger value="text" className="text-xs">
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="paragraph" className="text-xs">
                    Paragraph
                  </TabsTrigger>
                  <TabsTrigger value="insert" className="text-xs">
                    Insert
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-xs">
                    History
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="text"
                  className="pt-0 px-0 flex flex-wrap items-center gap-1"
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => applyFormatting("bold")}
                        >
                          <Bold className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Bold (Ctrl+B)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => applyFormatting("italic")}
                        >
                          <Italic className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Italic (Ctrl+I)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => applyFormatting("underline")}
                        >
                          <Underline className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Underline (Ctrl+U)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <div className="h-6 border-l mx-1"></div>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => applyFormatting("h1")}
                        >
                          <Heading1 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Heading 1</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => applyFormatting("h2")}
                        >
                          <Heading2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Heading 2</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => applyFormatting("h3")}
                        >
                          <Heading3 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Heading 3</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TabsContent>

                <TabsContent
                  value="paragraph"
                  className="pt-0 px-0 flex flex-wrap items-center gap-1"
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <AlignLeft className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Align left</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <AlignCenter className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Align center</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <AlignRight className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Align right</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <div className="h-6 border-l mx-1"></div>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => applyFormatting("list")}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Bullet list</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => applyFormatting("orderedList")}
                        >
                          <ListOrdered className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>

                      <TooltipContent>
                        <p>Numbered list</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => applyFormatting("quote")}
                        >
                          <Quote className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Block quote</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TabsContent>

                <TabsContent
                  value="insert"
                  className="pt-0 px-0 flex flex-wrap items-center gap-1"
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => applyFormatting("link")}
                        >
                          <Link className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Insert link</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Image className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Insert image</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Code className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Insert code block</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Calendar className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Insert date</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TabsContent>

                <TabsContent
                  value="history"
                  className="pt-0 px-0 flex flex-wrap items-center gap-1"
                >
                  <Button variant="ghost" size="icon">
                    <Undo className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Redo className="h-4 w-4" />
                  </Button>
                </TabsContent>
              </Tabs>
            </div>

            {/* Search Bar */}
            <div className="border-b flex items-center gap-2 p-2 bg-gray-50">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search in document..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-8"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSearch}
                disabled={!searchQuery}
              >
                Find
              </Button>
              {searchResults.length > 0 && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigateSearch("prev")}
                  >
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigateSearch("next")}
                  >
                    Next
                  </Button>
                  <span className="text-xs text-gray-500">
                    {currentSearchIndex + 1}/{searchResults.length}
                  </span>
                </>
              )}
            </div>

            {/* Text Editor */}
            <div className="flex-1 relative overflow-auto">
              <Textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                className="min-h-full w-full resize-none p-4 border-0 focus-visible:ring-0 rounded-none"
                placeholder="Start typing your historical text here..."
                style={{ fontSize: `${fontSize}px` }}
                readOnly={readOnly}
                maxLength={maxLength}
              />

              {/* Word Counter */}
              {showWordCount && (
                <div className="absolute right-2 bottom-2 text-xs text-gray-500 bg-white bg-opacity-70 p-1 rounded">
                  {selectedCount.words > 0 ? (
                    <>
                      {selectedCount.words} words, {selectedCount.chars} chars
                      selected
                    </>
                  ) : (
                    <>
                      {wordCount} words, {charCount} characters
                    </>
                  )}
                </div>
              )}

              {/* AI Assistant */}
              {aiAssistanceEnabled && text.length > 0 && (
                <div className="absolute bottom-10 right-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="icon" className="rounded-full shadow-lg">
                        <Zap className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="end" className="w-64 p-4">
                      <div className="space-y-2">
                        <h3 className="font-medium">AI Suggestions</h3>
                        <div className="text-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-left"
                          >
                            <span>Check historical accuracy</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-left"
                          >
                            <span>Improve writing style</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-left"
                          >
                            <span>Add relevant context</span>
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="pt-0 px-0 overflow-auto">
            <div className="p-4">
              <article
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: getHighlightedText() }}
              />
            </div>
          </TabsContent>

          <TabsContent value="analyze" className="pt-0 px-0">
            <div className="flex h-full">
              <div className="w-3/4 p-4 overflow-auto">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium">Text Analysis</h3>
                  <Button onClick={handleAnalyze} disabled={loading} size="sm">
                    {loading ? "Analyzing..." : "Analyze Text"}
                  </Button>
                </div>

                {/* Insights */}
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Content Insights</h4>
                  <div className="space-y-4">
                    {insights.map((insight, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium capitalize">
                            {insight.type}
                          </span>
                          <Badge
                            variant={
                              insight.score > 70
                                ? "default"
                                : insight.score > 40
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {Math.round(insight.score)}%
                          </Badge>
                        </div>
                        <Progress value={insight.score} className="h-2 mb-2" />
                        <p className="text-sm">{insight.summary}</p>
                        {insight.details && (
                          <ul className="text-xs text-gray-600 mt-1 space-y-1 pl-4">
                            {insight.details.map((detail, i) => (
                              <li key={i} className="list-disc list-outside">
                                {detail}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Writing Style Analysis */}
                {insights.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Writing Style</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="border rounded p-3">
                        <h5 className="text-sm font-medium mb-1">Formality</h5>
                        <div className="relative h-1 bg-gray-200 rounded">
                          <div
                            className="absolute h-1 bg-blue-500 rounded"
                            style={{ width: `${Math.random() * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span>Casual</span>
                          <span>Formal</span>
                        </div>
                      </div>

                      <div className="border rounded p-3">
                        <h5 className="text-sm font-medium mb-1">Clarity</h5>
                        <div className="relative h-1 bg-gray-200 rounded">
                          <div
                            className="absolute h-1 bg-blue-500 rounded"
                            style={{ width: `${Math.random() * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span>Complex</span>
                          <span>Clear</span>
                        </div>
                      </div>

                      <div className="border rounded p-3">
                        <h5 className="text-sm font-medium mb-1">Tone</h5>
                        <div className="relative h-1 bg-gray-200 rounded">
                          <div
                            className="absolute h-1 bg-blue-500 rounded"
                            style={{ width: `${Math.random() * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span>Subjective</span>
                          <span>Objective</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-1/4 border-l p-4 overflow-auto">
                <h3 className="text-lg font-medium mb-4">Detected Entities</h3>
                <div className="space-y-3">
                  {entities.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No entities detected yet. Click 'Analyze Text' to identify
                      important elements in your content.
                    </p>
                  ) : (
                    entities.map((entity, index) => (
                      <div key={index} className="border rounded p-2">
                        <div className="flex items-center justify-between mb-1">
                          <Badge className="capitalize">{entity.type}</Badge>
                          <span className="text-xs">
                            {Math.round(entity.confidence * 100)}%
                          </span>
                        </div>
                        <p className="font-medium">{entity.text}</p>
                        {entity.metadata?.description && (
                          <p className="text-xs text-gray-600 mt-1">
                            {entity.metadata.description}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="pt-0 px-0">
            <div className="p-4">
              <h3 className="text-lg font-medium mb-4">Revision History</h3>

              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No revision history yet.</p>
                  <p className="text-sm">
                    Changes will be saved automatically as you edit.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-3">
                    {history.map((snapshot) => (
                      <Card key={snapshot.id} className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium">
                              {formatTimestamp(snapshot.timestamp)}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              {snapshot.wordCount} words
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => restoreSnapshot(snapshot)}
                          >
                            Restore
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600">
                          {snapshot.description}
                        </p>
                        <div className="mt-2 text-xs bg-gray-50 p-2 rounded max-h-20 overflow-hidden">
                          {snapshot.content.substring(0, 150)}
                          {snapshot.content.length > 150 && "..."}
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};

export default TextEditor;
