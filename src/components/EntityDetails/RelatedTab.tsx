import React from "react";
import RelatedEntityCard from "./RelatedEntityCard";

interface RelatedEntity {
  id: string;
  name: string;
  type: string;
  relationship: string;
}

interface RelatedTabProps {
  relatedEntities?: RelatedEntity[];
}

const RelatedTab: React.FC<RelatedTabProps> = ({ relatedEntities = [] }) => {
  if (relatedEntities.length === 0) {
    return (
      <div className="py-4 text-sm text-muted-foreground">
        No related entities found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {relatedEntities.map((related) => (
        <RelatedEntityCard key={related.id} entity={related} />
      ))}
    </div>
  );
};

export default RelatedTab;
