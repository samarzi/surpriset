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
    <div className="modal-overlay flex items-center justify-center p-4 admin-modal">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 transition-opacity animate-in fade-in-0 duration-300 modal-backdrop"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className={`
        relative w-full ${sizeClasses[size]} max-h-[95vh] overflow-hidden 
        card-floating backdrop-blur-md modal-content
        animate-in fade-in-0 zoom-in-95 duration-300
        mx-4 sm:mx-0 max-w-[calc(100vw-2rem)] sm:${sizeClasses[size]}
        ${className}
      `}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-3">
            {icon && <span className="flex-shrink-0">{icon}</span>}
            <span className="text-heading-2">{title}</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Закрыть</span>
          </Button>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[calc(95vh-8rem)]">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}