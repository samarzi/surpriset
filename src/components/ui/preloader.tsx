import { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';

interface PreloaderProps {
    onLoadingComplete?: () => void;
    minDisplayTime?: number; // Minimum time to show preloader in ms
}

export function Preloader({ onLoadingComplete, minDisplayTime = 1500 }: PreloaderProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isOpacityZero, setIsOpacityZero] = useState(false);

    useEffect(() => {
        // Start the timer immediately upon mount
        const startTime = Date.now();

        // Ensure it runs for at least the minimum display time
        const timer = setTimeout(() => {
            setIsOpacityZero(true); // Trigger fade out transition

            // After fade out completes (500ms), notify parent
            setTimeout(() => {
                setIsVisible(false);
                onLoadingComplete?.();
            }, 500);
        }, minDisplayTime);

        return () => clearTimeout(timer);
    }, [minDisplayTime, onLoadingComplete]);

    if (!isVisible) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${isOpacityZero ? 'opacity-0' : 'opacity-100'
                }`}
        >
            <div className="relative flex flex-col items-center">
                {/* Logo or Brand Name */}
                <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent animate-pulse mb-6">
                    SurpriSet
                </h1>

                {/* Loader Animation */}
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                    {/* Inner icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader className="w-6 h-6 text-primary animate-pulse" />
                    </div>
                </div>

                <p className="mt-4 text-sm text-muted-foreground animate-pulse">
                    Загружаем подарки...
                </p>
            </div>
        </div>
    );
}
