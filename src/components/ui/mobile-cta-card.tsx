import { Link } from 'react-router-dom';
import { ArrowRight, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileCTACardProps {
  title: string;
  description: string;
  buttonText: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  gradient?: string;
}

export function MobileCTACard({ 
  title, 
  description, 
  buttonText, 
  href, 
  icon: Icon = Gift,
  gradient = "from-primary to-primary/70"
}: MobileCTACardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${gradient} p-4 text-white shadow-lg`}>
      {/* Background decorative elements */}
      <div className="absolute top-2 right-2 w-8 h-8 bg-white/10 rounded-full blur-sm animate-pulse"></div>
      <div className="absolute bottom-2 right-4 w-4 h-4 bg-white/20 rounded-full blur-sm animate-bounce" style={{animationDelay: '1s'}}></div>
      
      <div className="relative z-10 flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-tight mb-1">
            {title}
          </h3>
          <p className="text-xs text-white/90 leading-tight mb-2">
            {description}
          </p>
        </div>
        
        <div className="flex-shrink-0">
          <Button 
            size="sm" 
            variant="glass" 
            className="h-8 px-3 text-xs bg-white/20 hover:bg-white/30 border-white/30 hover:border-white/50" 
            asChild
          >
            <Link to={href} className="flex items-center gap-1">
              {buttonText}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}