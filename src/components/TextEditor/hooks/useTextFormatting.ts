import { useCallback } from "react";

export const useTextFormatting = (
  textareaRef: React.RefObject<HTMLTextAreaElement>,
  text: string,
  setText: (text: string) => void,
) => {
  const applyFormatting = useCallback(
    (format: string) => {
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
    },
    [text, setText, textareaRef],
  );

  return { applyFormatting };
};
