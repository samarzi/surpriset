import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-[95vw]'
};

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  icon, 
  children, 
  size = 'md',
  className = '' 
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 admin-modal">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in-0 duration-300 modal-backdrop"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className={`
        relative w-full ${sizeClasses[size]} max-h-[95vh] overflow-hidden 
        bg-background/95 dark:bg-gray-900/95 backdrop-blur-md 
        border-border/50 shadow-2xl modal-content
        animate-in fade-in-0 zoom-in-95 duration-300
        ${className}
      `}>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-gradient-to-r from-background/80 to-muted/20 dark:from-gray-900/80 dark:to-gray-800/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                {icon}
              </div>
            )}
            <CardTitle className="text-xl font-semibold text-foreground">
              {title}
            </CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
          <CardContent className="p-6 bg-background/50 dark:bg-gray-900/50">
            {children}
          </CardContent>
        </div>
      </Card>
    </div>
  );
}

export default Modal;