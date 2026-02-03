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

export function Logo({ className, size = 'md', showText = true }: LogoProps) {

  return (
    <div className={cn('logo-container inline-flex items-center gap-2 sm:gap-3', className)}>
      <img
        src="/logo.svg"
        alt="SurpriSet Logo"
        className={cn('flex-shrink-0', sizeClasses[size])}
      />

      {showText && (
        <span
          className={cn(
            'font-bold tracking-tight leading-tight logo-text',
            textSizeClasses[size]
          )}
        >
          SurpriSet
        </span>
      )}
    </div>
  )
}