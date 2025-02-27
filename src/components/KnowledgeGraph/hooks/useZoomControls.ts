import { useState, useCallback } from "react";
import * as d3 from "d3";

export const useZoomControls = () => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(scale * 1.2, 4);
    setScale(newScale);

    // Apply zoom to SVG if it exists
    const svg = d3.select("svg.knowledge-graph-svg");
    if (!svg.empty()) {
      svg
        .transition()
        .duration(300)
        .call(d3.zoom().transform as any, d3.zoomIdentity.scale(newScale));
    }
  }, [scale]);

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(scale / 1.2, 0.1);
    setScale(newScale);

    // Apply zoom to SVG if it exists
    const svg = d3.select("svg.knowledge-graph-svg");
    if (!svg.empty()) {
      svg
        .transition()
        .duration(300)
        .call(d3.zoom().transform as any, d3.zoomIdentity.scale(newScale));
    }
  }, [scale]);

  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });

    // Apply zoom reset to SVG if it exists
    const svg = d3.select("svg.knowledge-graph-svg");
    if (!svg.empty()) {
      svg
        .transition()
        .duration(300)
        .call(d3.zoom().transform as any, d3.zoomIdentity);
    }
  }, []);

  return {
    scale,
    position,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
  };
};
