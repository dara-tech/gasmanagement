import React from 'react';
import { FuelType } from '../../services/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface FuelTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingFuelType: FuelType | null;
  formData: { name: string; unit: string };
  onFormDataChange: (data: { name: string; unit: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const FuelTypeDialog: React.FC<FuelTypeDialogProps> = ({
  open,
  onOpenChange,
  editingFuelType,
  formData,
  onFormDataChange,
  onSubmit,
  onClose,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-md mx-2 md:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">
            {editingFuelType ? 'កែប្រែប្រភេទសាំង' : 'បន្ថែមប្រភេទសាំង'}
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            {editingFuelType ? 'កែប្រែព័ត៌មានប្រភេទសាំង' : 'បញ្ចូលព័ត៌មានប្រភេទសាំងថ្មី'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-2 md:py-4">
            <div className="space-y-2">
              <Label htmlFor="fuelTypeName" className="text-sm md:text-base">ឈ្មោះប្រភេទសាំង</Label>
              <Input
                id="fuelTypeName"
                value={formData.name}
                onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
                placeholder="ឧ. Regular, Premium, Diesel"
                required
                className="h-11 md:h-10 text-base md:text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuelTypeUnit" className="text-sm md:text-base">ឯកតា</Label>
              <Input
                id="fuelTypeUnit"
                value={formData.unit}
                onChange={(e) => onFormDataChange({ ...formData, unit: e.target.value })}
                placeholder="liter"
                className="h-11 md:h-10 text-base md:text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1 sm:flex-none h-11 md:h-10 text-sm md:text-base"
            >
              បោះបង់
            </Button>
            <Button 
              type="submit"
              className="flex-1 sm:flex-none h-11 md:h-10 text-sm md:text-base"
            >
              {editingFuelType ? 'រក្សាទុក' : 'បន្ថែម'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

