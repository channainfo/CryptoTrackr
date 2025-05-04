import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCryptoConcepts } from "@/contexts/CryptoConceptsContext";
import { X } from "lucide-react";
import { conceptData } from "../../data/crypto-concepts";

interface CryptoConceptPopupProps {
  children?: React.ReactNode;
}

const CryptoConceptPopup: React.FC<CryptoConceptPopupProps> = ({
  children,
}) => {
  const { currentConcept, closeConcept, markConceptAsSeen } =
    useCryptoConcepts();
  const [isOpen, setIsOpen] = useState(false);

  // Get the concept data based on the current concept ID
  const conceptInfo = currentConcept ? conceptData[currentConcept] : null;

  // Update isOpen state whenever currentConcept changes
  useEffect(() => {
    console.log("Current concept changed:", currentConcept);
    setIsOpen(!!currentConcept);
  }, [currentConcept]);

  // Handle dialog close
  const handleClose = () => {
    closeConcept();
    setIsOpen(false);
  };

  // Mark the concept as seen when user clicks "Got it"
  const handleGotIt = () => {
    if (currentConcept) {
      markConceptAsSeen(currentConcept);
    }
    handleClose();
  };

  // If no concept is selected, don't render anything
  if (!conceptInfo) {
    return null;
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          closeConcept();
        }
      }}
    >
      <DialogContent className="sm:max-w-md" onInteractOutside={handleClose}>
        <DialogHeader>
          <DialogTitle>{conceptInfo.title}</DialogTitle>
          <DialogDescription>
            {conceptInfo.category && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {conceptInfo.category}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {/* Concept Definition */}
          <div className="text-sm">
            <p className="font-medium mb-2">Definition:</p>
            <p className="text-muted-foreground">{conceptInfo.definition}</p>
          </div>

          {/* Concept Explanation */}
          <div className="text-sm">
            <p className="font-medium mb-2">Explanation:</p>
            <p className="text-muted-foreground">{conceptInfo.explanation}</p>
          </div>

          {/* Example (if available) */}
          {conceptInfo.example && (
            <div className="text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-md border">
              <p className="font-medium mb-2">Example:</p>
              <p className="text-muted-foreground">{conceptInfo.example}</p>
            </div>
          )}

          {/* Additional content can be passed as children */}
          {children}
        </div>

        <DialogFooter className="sm:justify-start">
          <Button type="button" onClick={handleGotIt}>
            Got it
          </Button>
          {conceptInfo.learnMoreUrl && (
            <Button variant="outline" asChild>
              <a
                href={conceptInfo.learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more
              </a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CryptoConceptPopup;
