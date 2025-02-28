import React, { useState } from "react";
import TopToolbar from "./TopToolbar";
import MainLayout from "./MainLayout";

interface HomeProps {
  initialFilter?: string;
  initialLayout?: number[];
}

const Home = ({
  initialFilter = "all",
  initialLayout = [30, 40, 30],
}: HomeProps) => {
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [layout, setLayout] = useState(initialLayout);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };

  const handleSearch = () => {
    // Placeholder for search functionality
    console.log("Search requested");
  };

  const handleLayoutChange = (sizes: number[]) => {
    setLayout(sizes);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      <TopToolbar
        onSearch={handleSearch}
        onFilter={() =>
          handleFilterChange(activeFilter === "all" ? "person" : "all")
        }
        onExport={() => console.log("Export requested")}
        onHelp={() => console.log("Help requested")}
      />
      <div className="flex-1 p-4">
        <MainLayout
          defaultLayout={layout}
          onLayoutChange={handleLayoutChange}
        />
      </div>
    </div>
  );
};

export default Home;
