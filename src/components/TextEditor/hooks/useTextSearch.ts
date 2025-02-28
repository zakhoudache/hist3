import { useState, useCallback } from "react";

export const useTextSearch = (
  text: string,
  textareaRef: React.RefObject<HTMLTextAreaElement>,
) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { index: number; text: string }[]
  >([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const handleSearch = useCallback(() => {
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

    // Add to recent searches if not already there
    if (searchQuery.trim() && !recentSearches.includes(searchQuery)) {
      setRecentSearches((prev) => [searchQuery, ...prev].slice(0, 5));
    }
  }, [searchQuery, text, textareaRef, recentSearches]);

  const navigateSearch = useCallback(
    (direction: "next" | "prev") => {
      if (searchResults.length === 0) return;

      let newIndex;
      if (direction === "next") {
        newIndex = (currentSearchIndex + 1) % searchResults.length;
      } else {
        newIndex =
          (currentSearchIndex - 1 + searchResults.length) %
          searchResults.length;
      }

      setCurrentSearchIndex(newIndex);

      if (textareaRef.current) {
        const { index } = searchResults[newIndex];
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          index,
          index + searchQuery.length,
        );
        scrollTextareaToSelection();
      }
    },
    [searchResults, currentSearchIndex, searchQuery, textareaRef],
  );

  const scrollTextareaToSelection = useCallback(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const { selectionStart } = textarea;

      // This is a hacky way to scroll to the selection, but it works
      const lines = text.substring(0, selectionStart).split("\n").length - 1;
      const lineHeight = 20; // approximate line height
      textarea.scrollTop = lines * lineHeight;
    }
  }, [text, textareaRef]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [textareaRef]);

  return {
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
  };
};
