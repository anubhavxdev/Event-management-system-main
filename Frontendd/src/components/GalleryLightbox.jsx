import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function GalleryLightbox({ images = [], initialIndex = 0, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    };

    useEffect(() => {
        // Enforce indices in bounds on load
        if (initialIndex >= 0 && initialIndex < images.length) {
            setCurrentIndex(initialIndex);
        }
    }, [initialIndex, images.length]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowRight') {
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                handlePrev();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        // Disable page scroll when lightbox is active
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [currentIndex, images.length, onClose, handleNext, handlePrev]);

    if (!images || images.length === 0) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md select-none">
                {/* Close Overlay Trigger */}
                <div className="absolute inset-0 cursor-default" onClick={onClose} />

                {/* Top Bar (Title & Counter & Close Button) */}
                <div className="absolute top-0 inset-x-0 h-20 px-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
                    <span className="text-white/80 font-medium tracking-wide text-sm font-mono">
                        {currentIndex + 1} / {images.length}
                    </span>
                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-full bg-white/10 hover:bg-rose-600 text-white transition-all duration-300 transform hover:scale-105"
                        aria-label="Close Gallery"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Left Arrow Button */}
                {images.length > 1 && (
                    <button
                        onClick={handlePrev}
                        className="absolute left-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-10 hover:scale-105 active:scale-95"
                        aria-label="Previous Image"
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </button>
                )}

                {/* Main Content Area (Animated Image) */}
                <div className="relative max-w-5xl max-h-[80vh] w-full h-full px-12 flex items-center justify-center pointer-events-none">
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={currentIndex}
                            src={images[currentIndex]}
                            alt={`Gallery image ${currentIndex + 1}`}
                            initial={{ opacity: 0, x: 80, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -80, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="max-w-full max-h-full object-contain pointer-events-auto rounded-lg shadow-2xl"
                        />
                    </AnimatePresence>
                </div>

                {/* Right Arrow Button */}
                {images.length > 1 && (
                    <button
                        onClick={handleNext}
                        className="absolute right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-10 hover:scale-105 active:scale-95"
                        aria-label="Next Image"
                    >
                        <ChevronRight className="w-8 h-8" />
                    </button>
                )}

                {/* Thumbnail Indicator Bar */}
                {images.length > 1 && (
                    <div className="absolute bottom-6 inset-x-0 flex items-center justify-center gap-2 z-10 bg-gradient-to-t from-black/60 to-transparent py-4">
                        {images.map((img, idx) => (
                            <button
                                key={`thumb-${idx}`}
                                onClick={() => setCurrentIndex(idx)}
                                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
                                    currentIndex === idx ? 'border-rose-500 scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-80'
                                }`}
                            >
                                <img src={img} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </AnimatePresence>
    );
}
