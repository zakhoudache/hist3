import { useState, useCallback } from "react";
import * as d3 from "d3";

export const useZoom = (svgRef: React.RefObject<SVGSVGElement>) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(scale * 1.2, 4);
    setScale(newScale);

    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg
        .transition()
        .duration(300)
        .call(d3.zoom().transform as any, d3.zoomIdentity.scale(newScale));
    }
  }, [scale, svgRef]);

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(scale / 1.2, 0.1);
    setScale(newScale);

    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg
        .transition()
        .duration(300)
        .call(d3.zoom().transform as any, d3.zoomIdentity.scale(newScale));
    }
  }, [scale, svgRef]);

  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });

    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg
        .transition()
        .duration(300)
        .call(d3.zoom().transform as any, d3.zoomIdentity);
    }
  }, [svgRef]);

  const initializeZoom = useCallback(
    (gRef: d3.Selection<SVGGElement, unknown, null, undefined>) => {
      if (!svgRef.current) return;

      const svg = d3.select(svgRef.current);
      const zoom = d3
        .zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
          gRef.attr("transform", event.transform);
        });

      svg.call(zoom as any);

      return zoom;
    },
    [svgRef],
  );

  return {
    scale,
    position,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    initializeZoom,
  };
};
