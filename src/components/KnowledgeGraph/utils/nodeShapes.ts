// Define shape paths for different node types
export const getNodeShape = (type: string): string => {
  switch (type) {
    case "person":
      return "M -20,-20 L 20,-20 L 20,20 L -20,20 Z"; // Square
    case "event":
      return "M 0,-25 L 25,0 L 0,25 L -25,0 Z"; // Diamond
    case "place":
      return "M 0,-25 L 22,10 L -22,10 Z"; // Triangle
    case "document":
      return "M -18,-25 L 18,-25 L 25,-18 L 25,25 L -25,25 L -25,-18 Z"; // Document shape
    case "concept":
      return "M 0,-25 C 15,-25 25,-15 25,0 C 25,15 15,25 0,25 C -15,25 -25,15 -25,0 C -25,-15 -15,-25 0,-25"; // Circle/Oval
    default:
      return "M 0,-25 C 15,-25 25,-15 25,0 C 25,15 15,25 0,25 C -15,25 -25,15 -25,0 C -25,-15 -15,-25 0,-25"; // Default circle
  }
};
