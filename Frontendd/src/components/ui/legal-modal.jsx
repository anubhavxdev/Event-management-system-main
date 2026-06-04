import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '../ui/button';

export function LegalModal({ isOpen, onClose, title, content }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-card rounded-2xl shadow-2xl overflow-hidden border border-border"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-border bg-card sticky top-0 z-10">
                                <h2 className="text-2xl font-bold text-card-foreground">{title}</h2>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <div
                                    className="prose prose-zinc max-w-none 
                    prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-4 prose-h2:text-foreground
                    prose-p:text-muted-foreground prose-p:leading-relaxed
                    prose-ul:list-disc prose-ul:pl-6 prose-li:text-muted-foreground"
                                    dangerouslySetInnerHTML={{ __html: content }}
                                />
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-border bg-muted flex justify-end">
                                <Button onClick={onClose} className="bg-foreground text-background hover:bg-foreground/90">
                                    Close
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
