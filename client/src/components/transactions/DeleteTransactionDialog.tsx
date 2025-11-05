import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';

interface DeleteTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const DeleteTransactionDialog: React.FC<DeleteTransactionDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-md mx-2 md:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">លុបព័ត៌មាន</DialogTitle>
          <DialogDescription className="text-xs md:text-sm mt-1">
            តើអ្នកពិតជាចង់លុបព័ត៌មាននេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto h-11 md:h-10 text-sm md:text-base"
          >
            បោះបង់
          </Button>
          <Button 
            type="button"
            variant="destructive"
            onClick={onConfirm}
            className="w-full sm:w-auto h-11 md:h-10 text-sm md:text-base"
          >
            លុប
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

