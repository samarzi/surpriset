import { useState, useRef, useEffect } from 'react';
import { ImageFullscreenModal } from '@/components/ui/image-fullscreen-modal';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
    images: string[];
    productName: string;
    isBundle?: boolean;
}

export function ProductGallery({ images, productName, isBundle }: ProductGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [fullscreenOpen, setFullscreenOpen] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Handle scroll snap updates
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const index = Math.round(container.scrollLeft / container.clientWidth);
            if (index !== selectedIndex) {
                setSelectedIndex(index);
            }
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [selectedIndex]);

    const scrollToImage = (index: number) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                left: index * scrollContainerRef.current.clientWidth,
                behavior: 'smooth'
            });
            setSelectedIndex(index);
        }
    };

    const safeImages = images.length > 0 ? images : ['/placeholder-product.jpg'];

    return (
        <div className="space-y-3">
            {/* Main Swipeable Area */}
            <div className="relative rounded-xl overflow-hidden bg-card border shadow-sm aspect-[3/4] group">
                <div
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full w-full"
                    style={{ scrollBehavior: 'smooth' }}
                >
                    {safeImages.map((image, idx) => (
                        <div
                            key={`${image}-${idx}`}
                            className="flex-shrink-0 w-full h-full snap-center"
                        >
                            <img
                                src={image}
                                alt={`${productName} ${idx + 1}`}
                                className="w-full h-full object-cover cursor-zoom-in"
                                onClick={() => {
                                    if (window.innerWidth >= 768) {
                                        setFullscreenOpen(true);
                                    }
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Bundle Badge */}
                {isBundle && (
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-primary text-black px-2 py-1 rounded text-[10px] sm:text-xs font-medium z-10 shadow-sm">
                        Готовый набор
                    </div>
                )}

                {/* Dots Indicator (Mobile) */}
                {safeImages.length > 1 && (
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                        {safeImages.map((_, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "w-1.5 h-1.5 rounded-full transition-all duration-300 shadow-sm",
                                    selectedIndex === idx
                                        ? "bg-white w-3"
                                        : "bg-white/50 hover:bg-white/75"
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Thumbnails (Desktop/Tablet) */}
            {safeImages.length > 1 && (
                <div className="hidden sm:flex gap-2 overflow-x-auto pb-1">
                    {safeImages.map((image, idx) => (
                        <button
                            key={`${image}-${idx}`}
                            onClick={() => scrollToImage(idx)}
                            className={cn(
                                "relative flex aspect-[3/4] w-12 flex-shrink-0 overflow-hidden rounded border transition-all",
                                selectedIndex === idx
                                    ? "border-primary ring-2 ring-primary/20"
                                    : "border-border hover:border-gray-400"
                            )}
                        >
                            <img
                                src={image}
                                alt={`Thumbnail ${idx + 1}`}
                                className="h-full w-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Fullscreen Mobile View Logic is handled by the Modal */}
            <ImageFullscreenModal
                images={safeImages}
                initialIndex={selectedIndex}
                isOpen={fullscreenOpen}
                onClose={() => setFullscreenOpen(false)}
            />
        </div>
    );
}
