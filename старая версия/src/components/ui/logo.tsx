import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  variant?: 'default' | 'white' | 'dark'
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
}

const textSizeClasses = {
  xs: 'text-sm',
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl'
}

export function Logo({ className, size = 'md', showText = true, variant = 'default' }: LogoProps) {
  
  return (
    <div className={cn('logo-container inline-flex items-center gap-2 sm:gap-3', className)} style={{ display: 'inline-flex', alignItems: 'center', flexDirection: 'row' }}>
      <img 
        src="/logo.svg" 
        alt="SurpriSet Logo"
        className={cn('flex-shrink-0', sizeClasses[size])}
        style={{ flexShrink: 0 }}
      />
      
      {showText && (
        <span 
          className={cn(
            'font-bold tracking-tight leading-tight',
            textSizeClasses[size],
            variant === 'white' 
              ? 'text-white' 
              : variant === 'dark' 
              ? 'text-gray-900' 
              : 'text-foreground'
          )}
          data-theme-text="true"
          style={{
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}
        >
          SurpriSet
        </span>
      )}
    </div>
  )
}