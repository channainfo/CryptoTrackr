import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export interface CryptoConceptPopupProps {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  showConfetti?: boolean;
}

const CryptoConceptPopup: React.FC<CryptoConceptPopupProps> = ({
  id,
  title,
  description,
  icon,
  isOpen,
  onClose,
  position = 'bottom-right',
  showConfetti = false,
}) => {
  // Position styles
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key={id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className={`fixed z-50 ${positionStyles[position]} max-w-sm`}
        >
          <Card className="shadow-lg border-2 border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {icon && <div className="text-primary">{icon}</div>}
                  <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Crypto Concept Explainer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{description}</p>
            </CardContent>
            <CardFooter className="pt-0 flex justify-end">
              <Button size="sm" onClick={onClose}>Got it</Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CryptoConceptPopup;