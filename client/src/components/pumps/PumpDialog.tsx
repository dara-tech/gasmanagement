import React from 'react';
import { Pump, FuelType } from '../../services/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface PumpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPump: Pump | null;
  fuelTypes: FuelType[];
  formData: { pumpNumber: string; fuelTypeId: string; status: string };
  onFormDataChange: (data: { pumpNumber: string; fuelTypeId: string; status: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const PumpDialog: React.FC<PumpDialogProps> = ({
  open,
  onOpenChange,
  editingPump,
  fuelTypes,
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
            {editingPump ? 'កែប្រែស្តុកសាំង' : 'បន្ថែមស្តុកសាំង'}
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            {editingPump ? 'កែប្រែព័ត៌មានស្តុកសាំង' : 'បញ្ចូលព័ត៌មានស្តុកសាំងថ្មី'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-2 md:py-4">
            <div className="space-y-2">
              <Label htmlFor="pumpNumber" className="text-sm md:text-base">លេខស្តុកសាំង</Label>
              <Input
                id="pumpNumber"
                value={formData.pumpNumber}
                onChange={(e) => onFormDataChange({ ...formData, pumpNumber: e.target.value })}
                placeholder="ឧ. P1, P2, P3"
                required
                className="h-11 md:h-10 text-base md:text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuelTypeId" className="text-sm md:text-base">ប្រភេទសាំង</Label>
              <Select
                value={formData.fuelTypeId || undefined}
                onValueChange={(value) => onFormDataChange({ ...formData, fuelTypeId: value })}
              >
                <SelectTrigger id="fuelTypeId" aria-label="ប្រភេទសាំង" className="h-11 md:h-10 text-sm md:text-base">
                  <SelectValue placeholder="ជ្រើសប្រភេទសាំង" />
                </SelectTrigger>
                <SelectContent>
                  {fuelTypes.map((ft) => (
                    <SelectItem key={ft._id} value={ft._id} className="text-sm">
                      {ft.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm md:text-base">ស្ថានភាព</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => onFormDataChange({ ...formData, status: value })}
              >
                <SelectTrigger id="status" aria-label="ស្ថានភាព" className="h-11 md:h-10 text-sm md:text-base">
                  <SelectValue placeholder="ជ្រើសស្ថានភាព" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="text-sm">សកម្ម</SelectItem>
                  <SelectItem value="inactive" className="text-sm">មិនសកម្ម</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 ស្តុកនឹងត្រូវបានបន្ថែមតាមរយៈ "បន្ថែមស្តុក" tab
            </p>
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
              {editingPump ? 'រក្សាទុក' : 'បន្ថែម'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

