// components/KnowledgeGraph/components/Edge.tsx
import React from "react";
import { Edge, Node } from "../types";

interface EdgeComponentProps {
  edge: Edge;
  isHovered: boolean;
  sourceNode: Node;
  targetNode: Node;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: (event: React.MouseEvent) => void;
  onMidPointClick: (x: number, y: number) => void;
}

export const EdgeComponent: React.FC<EdgeComponentProps> = ({
  edge,
  isHovered,
  sourceNode,
  targetNode,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onMidPointClick,
}) => {
  if (!sourceNode.x || !sourceNode.y || !targetNode.x || !targetNode.y) {
    return null;
  }

  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;
  const dr = Math.sqrt(dx * dx + dy * dy) * 1.5; // Curve factor
  const pathData = `M${sourceNode.x},${sourceNode.y}A${dr},${dr} 0 0,1 ${targetNode.x},${targetNode.y}`;

  // Calculate midpoint for potential interaction
  const midX = (sourceNode.x + targetNode.x) / 2;
  const midY = (sourceNode.y + targetNode.y) / 2;

  return (
    <>
      {/* Visible edge */}
      <path
        className="link"
        id={`edge-${edge.id}`}
        d={pathData}
        stroke={isHovered ? "#3b82f6" : "#e2e8f0"}
        strokeWidth={isHovered ? 3 : 2}
        strokeDasharray={edge.isNew ? "5,5" : "none"}
        fill="none"
        markerEnd="url(#arrow)"
        cursor="pointer"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
      />

      {/* Edge label */}
      <text textAnchor="middle" dy={-5} fontSize="10px" pointerEvents="none">
        <textPath href={`#edge-${edge.id}`} startOffset="50%">
          {edge.relationship || ""}
        </textPath>
      </text>

      {/* Invisible wider path for better interactivity */}
      <path
        className="edge-hitbox"
        d={pathData}
        stroke="transparent"
        strokeWidth={15}
        fill="none"
        style={{ cursor: "pointer" }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={(e) => {
          e.stopPropagation();
          onMidPointClick(midX, midY);
        }}
      />
    </>
  );
};
