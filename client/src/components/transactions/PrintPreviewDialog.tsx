import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { FiFile, FiX, FiZoomIn, FiZoomOut, FiMaximize2 } from 'react-icons/fi';

interface PrintPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportHTML: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PrintPreviewDialog: React.FC<PrintPreviewDialogProps> = ({
  open,
  onOpenChange,
  reportHTML,
  onConfirm,
  onCancel,
}) => {
  const [zoom, setZoom] = useState(1);
  const [fitToWidth, setFitToWidth] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate zoom to fit width on mount and window resize
  useEffect(() => {
    if (!open || !previewRef.current || !containerRef.current) return;

    const calculateFitZoom = () => {
      const container = containerRef.current;
      const preview = previewRef.current;
      if (!container || !preview) return;

      // A4 width in mm = 210mm, convert to pixels (assuming 96 DPI)
      const a4WidthPx = (210 / 25.4) * 96; // ~794px
      const containerWidth = container.clientWidth - 48; // Account for padding
      
      const calculatedZoom = Math.min(containerWidth / a4WidthPx, 1);
      if (fitToWidth) {
        setZoom(calculatedZoom);
      }
    };

    calculateFitZoom();
    window.addEventListener('resize', calculateFitZoom);
    return () => window.removeEventListener('resize', calculateFitZoom);
  }, [open, fitToWidth, reportHTML]);



  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
    setFitToWidth(false);
  };

  const handleFitToWidth = () => {
    setFitToWidth(true);
    if (previewRef.current && containerRef.current) {
      const container = containerRef.current;
      const a4WidthPx = (210 / 25.4) * 96;
      const containerWidth = container.clientWidth - 48;
      setZoom(Math.min(containerWidth / a4WidthPx, 1));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} fullScreen>
      <DialogContent className="w-full h-full p-0 flex flex-col">
    
        
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto p-2 sm:p-3 md:p-6 bg-slate-100 dark:bg-slate-900 min-h-0"
        >
          <div className="flex justify-center items-start min-h-full">
            <div 
              ref={previewRef}
              className="print-preview-wrapper  w-full max-w-[210mm] min-h-[297mm] mx-auto"
              style={{ 
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                width: '100%',
                maxWidth: '210mm'
              }}
              dangerouslySetInnerHTML={{ __html: reportHTML }}
            />
          </div>
          <style>{`
            .print-preview-wrapper {
              font-family: 'Kantumruy Pro', 'Arial', sans-serif !important;
              display: block;
            }
            .print-preview-wrapper,
            .print-preview-wrapper * {
              font-family: 'Kantumruy Pro', 'Arial', sans-serif !important;
            }
            .print-preview-wrapper html,
            .print-preview-wrapper body {
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              min-height: 100% !important;
            }
            .print-preview-wrapper body {
              display: block !important;
              width: 100% !important;
              min-height: 100% !important;
            }
            
            @media (max-width: 640px) {
              .print-preview-wrapper {
                font-size: 8pt !important;
              }
              .print-preview-wrapper table {
                font-size: 7pt !important;
              }
              .print-preview-wrapper .header h1 {
                font-size: 18pt !important;
              }
              .print-preview-wrapper .header h2 {
                font-size: 12pt !important;
              }
            }
          `}</style>
        </div>
        
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 md:gap-3 px-3 sm:px-4 md:px-6 py-3 md:py-4 border-t bg-white dark:bg-slate-900 flex-shrink-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="w-full sm:w-auto sm:flex-none h-9 sm:h-10 text-sm font-medium"
          >
            បោះបង់
          </Button>
          <Button 
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto sm:flex-none h-9 sm:h-10 text-sm font-semibold shadow-sm"
          >
            {/* @ts-ignore */}
            <FiFile className="mr-2 h-4 w-4" />
            បោះពុម្ព
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
