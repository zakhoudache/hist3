/**
 * Downloads content in the specified format
 */
export const downloadContent = (
  content: string,
  format: "txt" | "md" | "html",
) => {
  let mimeType = "text/plain";
  let extension = "txt";

  if (format === "html") {
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
