import React from "react";
import { BookOpen } from "lucide-react";

interface LogoProps {
  title?: string;
}

const Logo: React.FC<LogoProps> = ({
  title = "Historical Knowledge Graph",
}) => {
  return (
    <div className="flex items-center gap-2">
      <BookOpen className="h-6 w-6 text-blue-600" />
      <h1 className="text-xl font-serif font-semibold">{title}</h1>
    </div>
  );
};

export default Logo;
