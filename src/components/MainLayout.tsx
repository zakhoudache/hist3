import React from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./ui/resizable";
import TextEditor from "./TextEditor";
import KnowledgeGraph from "./KnowledgeGraph";
import EntityDetails from "./EntityDetails";

interface MainLayoutProps {
  defaultLayout?: number[];
  onLayoutChange?: (sizes: number[]) => void;
}

const MainLayout = ({
  defaultLayout = [30, 40, 30],
  onLayoutChange = () => {},
}: MainLayoutProps) => {
  return (
    <div className="h-full w-full bg-background">
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={onLayoutChange}
        className="h-full w-full rounded-lg border"
      >
        <ResizablePanel defaultSize={defaultLayout[0]} minSize={20}>
          <TextEditor />
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <KnowledgeGraph />
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={defaultLayout[2]} minSize={20}>
          <EntityDetails />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default MainLayout;
