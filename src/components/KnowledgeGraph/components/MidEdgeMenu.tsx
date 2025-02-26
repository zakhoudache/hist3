import React from "react";

interface MidEdgeMenuProps {
  x: number;
  y: number;
  onCreateNode: (relationship: string) => void;
  onClose: () => void;
}

const MidEdgeMenu: React.FC<MidEdgeMenuProps> = ({
  x,
  y,
  onCreateNode,
  onClose,
}) => {
  return (
    <g className="mid-edge-menu" transform={`translate(${x}, ${y})`}>
      {/* Background circle */}
      <circle r="40" fill="white" stroke="#94a3b8" strokeWidth="1" />

      {/* Add entity button */}
      <g cursor="pointer" onClick={() => onCreateNode("Connected to")}>
        <circle cx="0" cy="-15" r="15" fill="#3b82f6" />
        <text x="0" y="-11" textAnchor="middle" fontSize="16px" fill="white">
          +
        </text>
        <text x="0" y="5" textAnchor="middle" fontSize="10px" fill="#3b82f6">
          Add Node
        </text>
      </g>

      {/* Close button */}
      <g cursor="pointer" onClick={onClose}>
        <circle cx="0" cy="15" r="15" fill="#ef4444" />
        <text x="0" y="19" textAnchor="middle" fontSize="16px" fill="white">
          ×
        </text>
        <text x="0" y="35" textAnchor="middle" fontSize="10px" fill="#ef4444">
          Cancel
        </text>
      </g>
    </g>
  );
};

export default MidEdgeMenu;
