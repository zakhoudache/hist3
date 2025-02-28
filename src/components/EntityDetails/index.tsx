import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";

// Import sub-components
import EntityHeader from "./EntityHeader";
import EmptyState from "./EmptyState";
import OverviewTab from "./OverviewTab";
import TimelineTab from "./TimelineTab";
import RelatedTab from "./RelatedTab";
import SourcesTab from "./SourcesTab";

// Import types and utilities
import { EntityData, EntityDetailsProps } from "./types";
import { generateMockEntityData } from "./mockData";

const EntityDetails: React.FC<EntityDetailsProps> = ({
  entityId,
  entityName,
}) => {
  const [loading, setLoading] = useState(false);
  const [entity, setEntity] = useState<EntityData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Generate mock data for the selected entity
  useEffect(() => {
    if (!entityId && !entityName) {
      setEntity(null);
      return;
    }

    setLoading(true);

    // In a real app, this would be an API call to fetch entity details
    // For now, we'll generate mock data based on the entity name
    setTimeout(() => {
      const mockEntity: EntityData = generateMockEntityData(
        entityId,
        entityName,
      );
      setEntity(mockEntity);
      setLoading(false);
    }, 800);
  }, [entityId, entityName]);

  // Export entity details as PDF
  const handleExportPDF = () => {
    if (!entity) return;

    // This is a placeholder - in a real app, you would generate a PDF with the entity details
    alert(`Exporting details for ${entity.name} as PDF`);
  };

  if (!entityId && !entityName) {
    return (
      <Card className="h-full flex flex-col">
        <EntityHeader
          entity={null}
          loading={false}
          onExport={handleExportPDF}
        />
        <EmptyState />
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <EntityHeader
        entity={entity}
        loading={loading}
        onExport={handleExportPDF}
      />

      <CardContent className="flex-grow p-0">
        {loading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full rounded-md" />
          </div>
        ) : entity ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full flex flex-col"
          >
            <TabsList className="mx-4 mt-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="related">Related</TabsTrigger>
              <TabsTrigger value="sources">Sources</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-grow">
              <TabsContent value="overview" className="p-4 m-0">
                <OverviewTab entity={entity} />
              </TabsContent>

              <TabsContent value="timeline" className="p-4 m-0">
                <TimelineTab entity={entity} />
              </TabsContent>

              <TabsContent value="related" className="p-4 m-0">
                <RelatedTab relatedEntities={entity.relatedEntities} />
              </TabsContent>

              <TabsContent value="sources" className="p-4 m-0">
                <SourcesTab sources={entity.sources} />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            <p>Failed to load entity details</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EntityDetails;
