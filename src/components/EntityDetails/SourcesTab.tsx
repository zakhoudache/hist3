import React from "react";
import { ExternalLink } from "lucide-react";

interface Source {
  title: string;
  url: string;
}

interface SourcesTabProps {
  sources?: Source[];
}

const SourcesTab: React.FC<SourcesTabProps> = ({ sources = [] }) => {
  if (sources.length === 0) {
    return (
      <div className="py-4 text-sm text-muted-foreground">
        No sources available.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sources.map((source, index) => (
        <div
          key={index}
          className="p-3 rounded-md border flex justify-between items-start"
        >
          <div>
            <h4 className="text-sm font-medium">{source.title}</h4>
          </div>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      ))}
    </div>
  );
};

export default SourcesTab;
