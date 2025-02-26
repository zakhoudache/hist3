import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../ui/dialog";
import { Button } from "../../ui/button";

interface ConfirmDeleteDialogProps {
  type: "node" | "edge" | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  type,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog defaultOpen={true} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === "node" ? "Delete Node" : "Delete Connection"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p>
            {type === "node"
              ? "Are you sure you want to delete this node? This will also remove all connections to and from this node."
              : "Are you sure you want to delete this connection?"}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDeleteDialog;
