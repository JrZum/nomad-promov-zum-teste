
import { Toggle } from "@/components/ui/toggle";
import { LayoutGrid, List, Table } from "lucide-react";
import { ViewMode } from "./types";

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const ViewModeToggle = ({ viewMode, onViewModeChange }: ViewModeToggleProps) => {
  return (
    <div className="flex gap-2">
      <Toggle
        pressed={viewMode === "cards"}
        onPressedChange={() => onViewModeChange("cards")}
        aria-label="Visualização em cards"
      >
        <LayoutGrid className="h-4 w-4" />
      </Toggle>
      <Toggle
        pressed={viewMode === "list"}
        onPressedChange={() => onViewModeChange("list")}
        aria-label="Visualização em lista"
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        pressed={viewMode === "table"}
        onPressedChange={() => onViewModeChange("table")}
        aria-label="Visualização em tabela"
      >
        <Table className="h-4 w-4" />
      </Toggle>
    </div>
  );
};

export default ViewModeToggle;
