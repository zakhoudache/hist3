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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Node } from "../types";

interface NodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeNode: Node | null;
  setActiveNode: (node: Node | null) => void;
  onSubmit: () => void;
}

const NodeDialog: React.FC<NodeDialogProps> = ({
  open,
  onOpenChange,
  activeNode,
  setActiveNode,
  onSubmit,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {activeNode?.isNew ? "Add New Node" : "Edit Node"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="node-type" className="text-right">
              Type
            </Label>
            <Select
              value={activeNode?.type}
              onValueChange={(value) =>
                setActiveNode(
                  activeNode ? { ...activeNode, type: value as any } : null,
                )
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="person">Person</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="place">Place</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="concept">Concept</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="node-label" className="text-right">
              Label
            </Label>
            <Input
              id="node-label"
              value={activeNode?.label || ""}
              onChange={(e) =>
                setActiveNode(
                  activeNode ? { ...activeNode, label: e.target.value } : null,
                )
              }
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="node-description" className="text-right">
              Description
            </Label>
            <Input
              id="node-description"
              value={activeNode?.description || ""}
              onChange={(e) =>
                setActiveNode(
                  activeNode
                    ? { ...activeNode, description: e.target.value }
                    : null,
                )
              }
              className="col-span-3"
            />
          </div>

          {activeNode?.type === "event" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="node-date" className="text-right">
                Date
              </Label>
              <Input
                id="node-date"
                type="date"
                value={activeNode?.date || ""}
                onChange={(e) =>
                  setActiveNode(
                    activeNode ? { ...activeNode, date: e.target.value } : null,
                  )
                }
                className="col-span-3"
              />
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="node-image" className="text-right">
              Image URL
            </Label>
            <Input
              id="node-image"
              value={activeNode?.image || ""}
              onChange={(e) =>
                setActiveNode(
                  activeNode ? { ...activeNode, image: e.target.value } : null,
                )
              }
              className="col-span-3"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" onClick={onSubmit}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NodeDialog;
