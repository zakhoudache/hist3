import React, { useState, useCallback, useRef, useEffect } from "react";
import { Textarea } from "../ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import { Slider } from "../ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "../ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
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
} from "lucide-react";
import KnowledgeGraph from "../KnowledgeGraph";
import { supabase } from "@/lib/supabase";
import {
  EntityType,
  Entity,
  TextInsight,
  TextSnapshot,
  Node,
  Edge,
  TextEditorProps,
} from "./types";
import { useTextFormatting } from "./hooks/useTextFormatting";
import { useTextSearch } from "./hooks/useTextSearch";
import { useTextAnalysis } from "./hooks/useTextAnalysis";
import { useKnowledgeGraph } from "./hooks/useKnowledgeGraph";
import { getHighlightedText } from "./utils/textHighlighting";
import { downloadContent } from "./utils/exportUtils";

const TextEditor: React.FC<TextEditorProps> = ({
  initialContent = "",
  onContentChange,
  onEntityDetected,
  onNodesChange,
  onEdgesChange,
  mode = "standard",
  readOnly = false,
  maxLength,
  autoSave = true,
  showAnalytics = true,
}) => {
  // Component state
  const [text, setText] = useState(initialContent);
  const [selectedTab, setSelectedTab] = useState<
    "write" | "preview" | "analyze" | "graph"
  >("write");
  const [editMode, setEditMode] = useState<"rich" | "markdown">("rich");
  const [fontSize, setFontSize] = useState(16);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [insights, setInsights] = useState<TextInsight[]>([]);
  const [loading, setLoading] = useState(false);
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
  const [graphLoading, setGraphLoading] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const analyzeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Custom hooks
  const { applyFormatting } = useTextFormatting(textareaRef, text, setText);
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    currentSearchIndex,
    setCurrentSearchIndex,
    recentSearches,
    setRecentSearches,
    handleSearch,
    navigateSearch,
    clearSearch,
  } = useTextSearch(text, textareaRef);

  const { handleAnalyze, nodeList, setNodeList, edgeList, setEdgeList } =
    useTextAnalysis(
      text,
      entities,
      setEntities,
      setInsights,
      setNodeList,
      setEdgeList,
      onEntityDetected,
    );

  const { generateKnowledgeGraph } = useKnowledgeGraph(
    text,
    setNodeList,
    setEdgeList,
    setGraphLoading,
    entities,
  );

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
  }, [searchQuery, setSearchResults]);

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
                      <Button onClick={() => downloadContent(text, "txt")}>
                        Download as TXT
                      </Button>
                      <Button onClick={() => downloadContent(text, "md")}>
                        Download as Markdown
                      </Button>
                      <Button
                        onClick={() =>
                          downloadContent(
                            getHighlightedText(
                              text,
                              entities,
                              highlightEntities,
                            ),
                            "html",
                          )
                        }
                      >
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
                dangerouslySetInnerHTML={{
                  __html: getHighlightedText(text, entities, highlightEntities),
                }}
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
                <KnowledgeGraph nodes={nodeList} edges={edgeList} />
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
