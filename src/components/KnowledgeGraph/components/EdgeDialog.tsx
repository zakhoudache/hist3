import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import { Edge, Node } from "../types";

interface EdgeDialogProps {
  edge: Edge;
  sourceNode?: Node;
  targetNode?: Node;
  onClose: () => void;
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  onDelete?: () => void;
}

const EdgeDialog: React.FC<EdgeDialogProps> = ({
  edge,
  sourceNode,
  targetNode,
  onClose,
  onChange,
  onSubmit,
  onDelete,
}) => {
  return (
    <Dialog defaultOpen={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {edge?.isNew ? "Add New Connection" : "Edit Connection"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edge-relationship" className="text-right">
              Relationship
            </Label>
            <Input
              id="edge-relationship"
              value={edge?.relationship || ""}
              onChange={(e) => onChange("relationship", e.target.value)}
              className="col-span-3"
              placeholder="e.g. Created, Visited, Wrote..."
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">From</Label>
            <div className="col-span-3 font-medium">
              {sourceNode?.label || "Unknown node"}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">To</Label>
            <div className="col-span-3 font-medium">
              {targetNode?.label || "Unknown node"}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          {onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              className="mr-auto"
            >
              Delete
            </Button>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" onClick={onSubmit}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EdgeDialog;
