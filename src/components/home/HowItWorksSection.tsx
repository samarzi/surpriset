import { ShoppingCart, Package, Truck, CreditCard, Gift, Sparkles } from 'lucide-react';

const steps = [
  {
    number: 1,
    icon: ShoppingCart,
    title: 'Собираем корзину',
    description: 'Выбирайте товары и готовые наборы',
    gradient: 'from-blue-500 via-blue-600 to-cyan-600',
    bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
  },
  {
    number: 2,
    icon: Package,
    title: 'Выбираем упаковку',
    description: 'Улучшите подарок дополнительными услугами',
    gradient: 'from-purple-500 via-purple-600 to-pink-600',
    bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
  },
  {
    number: 3,
    icon: Truck,
    title: 'Способ доставки',
    description: 'Курьер или самовывоз',
    gradient: 'from-orange-500 via-orange-600 to-red-600',
    bgGradient: 'from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30',
  },
  {
    number: 4,
    icon: CreditCard,
    title: 'Оплата',
    description: 'Картой или наличными',
    gradient: 'from-green-500 via-green-600 to-emerald-600',
    bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
  },
  {
    number: 5,
    icon: Gift,
    title: 'Получаем подарок',
    description: 'Готовый набор, собранный с душой',
    gradient: 'from-pink-500 via-pink-600 to-rose-600',
    bgGradient: 'from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="relative py-8 sm:py-12 lg:py-16 overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="container px-3 sm:px-4 relative">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Простой процесс</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading mb-2 sm:mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Как это работает?
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground max-w-xl mx-auto">
            Создайте идеальный подарок за 5 простых шагов
          </p>
        </div>

        {/* Desktop/Tablet: Horizontal timeline */}
        <div className="hidden sm:block">
          <div className="relative max-w-6xl mx-auto">
            {/* Connection line with gradient */}
            <div className="absolute top-[52px] left-[10%] right-[10%] h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-full" />
            
            <div className="grid grid-cols-5 gap-2 lg:gap-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.number}
                    className="relative group"
                    style={{
                      animation: `slideInScale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.1}s both`,
                    }}
                  >
                    <div className="relative">
                      {/* Glow effect on hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-2xl`} />
                      
                      {/* Card */}
                      <div className="relative rounded-2xl p-3 lg:p-5 transition-all duration-300 group-hover:scale-105">
                        {/* Icon container */}
                        <div className="relative mb-3 lg:mb-4">
                          <div className={`w-[52px] h-[52px] lg:w-[68px] lg:h-[68px] mx-auto rounded-2xl bg-gradient-to-br ${step.gradient} shadow-lg flex items-center justify-center relative overflow-hidden group-hover:shadow-2xl transition-shadow duration-300`}>
                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            <Icon className="w-6 h-6 lg:w-8 lg:h-8 text-white relative z-10" strokeWidth={2.5} />
                          </div>
                          {/* Number badge */}
                          <div className={`absolute -top-1 -right-1 w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-gradient-to-br ${step.gradient} text-white flex items-center justify-center text-xs lg:text-sm font-bold shadow-md ring-2 ring-background`}>
                            {step.number}
                          </div>
                        </div>
                        
                        {/* Content */}
                        <h3 className="text-xs lg:text-sm font-bold text-center mb-1 lg:mb-1.5 leading-tight">
                          {step.title}
                        </h3>
                        <p className="text-[10px] lg:text-xs text-muted-foreground text-center leading-snug">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile: Compact vertical layout */}
        <div className="sm:hidden space-y-2.5 max-w-md mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative"
                style={{
                  animation: `slideInLeft 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.08}s both`,
                }}
              >
                <div className="relative rounded-xl p-3 transition-all duration-300 active:scale-[0.98]">
                  <div className="flex items-center gap-3">
                    {/* Icon with number */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${step.gradient} shadow-md flex items-center justify-center relative overflow-hidden`}>
                        <Icon className="w-5 h-5 text-white relative z-10" strokeWidth={2.5} />
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-background border-2 border-primary flex items-center justify-center shadow-sm">
                        <span className="text-[10px] font-bold text-primary">{step.number}</span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold mb-0.5 leading-tight">
                        {step.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Connector arrow for mobile */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="w-0.5 h-3 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent rounded-full" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes slideInScale {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </section>
  );
}
