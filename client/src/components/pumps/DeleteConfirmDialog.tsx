import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel = 'លុប',
  cancelLabel = 'បោះបង់',
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-md mx-2 md:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">{title}</DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="flex-1 sm:flex-none h-11 md:h-10 text-sm md:text-base"
          >
            {cancelLabel}
          </Button>
          <Button 
            type="button"
            variant="destructive"
            onClick={onConfirm}
            className="flex-1 sm:flex-none h-11 md:h-10 text-sm md:text-base"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

