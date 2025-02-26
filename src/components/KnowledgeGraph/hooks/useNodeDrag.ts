import * as d3 from "d3";
import { Node } from "../types";

export const useNodeDrag = (
  restartSimulation: (alpha?: number) => void,
  stopSimulation: () => void,
) => {
  const dragstarted = (event: any, d: Node) => {
    if (!event.active) restartSimulation(0.3);
    d.fx = d.x;
    d.fy = d.y;
  };

  const dragged = (event: any, d: Node) => {
    d.fx = event.x;
    d.fy = event.y;
  };

  const dragended = (event: any, d: Node) => {
    if (!event.active) stopSimulation();
    d.fx = null;
    d.fy = null;
  };

  const drag = d3
    .drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);

  return { drag };
};
