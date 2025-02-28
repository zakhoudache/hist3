import React, { useState } from "react";
import type { Node as NodeType } from "../types"; // Import as a type to avoid naming conflict

interface NodeComponentProps {
  node: NodeType;
  isSelected: boolean;
  onNodeClick: (nodeId: string) => void;
  onNodeDragStart: (nodeId: string, event: React.MouseEvent) => void;
  onNodeDragEnd: () => void;
  onNodeDoubleClick: (nodeId: string) => void;
}

export const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  isSelected,
  onNodeClick,
  onNodeDragStart,
  onNodeDragEnd,
  onNodeDoubleClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Node size based on type
  const getNodeSize = () => {
    switch (node.type) {
      case "person":
        return 40;
      case "event":
      case "place":
        return 35;
      case "document":
      case "concept":
      default:
        return 30;
    }
  };

  // Node color based on type
  const getNodeColor = () => {
    switch (node.type) {
      case "person":
        return "#3b82f6"; // blue
      case "event":
        return "#ef4444"; // red
      case "place":
        return "#10b981"; // green
      case "document":
        return "#f59e0b"; // amber
      case "concept":
        return "#8b5cf6"; // purple
      default:
        return "#64748b"; // slate
    }
  };

  // Icon based on node type
  const getNodeIcon = () => {
    switch (node.type) {
      case "person":
        return "👤";
      case "event":
        return "📅";
      case "place":
        return "📍";
      case "document":
        return "📄";
      case "concept":
        return "💡";
      default:
        return "❓";
    }
  };

  const nodeSize = getNodeSize();
  const nodeColor = getNodeColor();
  const nodeIcon = getNodeIcon();

  if (!node.x || !node.y) {
    return null;
  }

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onNodeClick(node.id)}
      onDoubleClick={() => onNodeDoubleClick(node.id)}
      onMouseDown={(e) => onNodeDragStart(node.id, e)}
      onMouseUp={onNodeDragEnd}
      style={{ cursor: "pointer" }}
    >
      {/* Node background circle */}
      <circle
        r={nodeSize}
        fill={isSelected || isHovered ? getNodeColor() : "white"}
        stroke={getNodeColor()}
        strokeWidth={isSelected || isHovered ? 3 : 2}
        strokeDasharray={node.isNew ? "5,5" : "none"}
        opacity={isSelected || isHovered ? 1 : 0.9}
      />

      {/* Node image if available */}
      {node.image ? (
        <image
          href={node.image}
          x={-nodeSize / 2}
          y={-nodeSize / 2}
          width={nodeSize}
          height={nodeSize}
          clipPath={`circle(${nodeSize}px at ${nodeSize / 2}px ${nodeSize / 2}px)`}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        // Fallback icon if no image
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={nodeSize / 2}
          fill={isSelected || isHovered ? "white" : nodeColor}
        >
          {nodeIcon}
        </text>
      )}

      {/* Node label */}
      <text
        dy={nodeSize + 12}
        textAnchor="middle"
        fontSize="12px"
        fontWeight={isSelected ? "bold" : "normal"}
        fill={isSelected ? nodeColor : "#1e293b"}
        pointerEvents="none"
      >
        {node.label}
      </text>

      {/* Small indicator for editing state */}
      {node.isEditing && (
        <circle
          r={5}
          cx={nodeSize - 5}
          cy={-nodeSize + 5}
          fill="#fbbf24"
          stroke="white"
          strokeWidth={1}
        />
      )}
    </g>
  );
};

export default NodeComponent;
