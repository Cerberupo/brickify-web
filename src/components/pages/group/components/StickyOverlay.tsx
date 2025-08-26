import React, {useEffect} from 'react';
import {XIcon} from 'lucide-react';

/**
 * StickyOverlay: full-screen white translucent backdrop with blur, centering its children.
 * - Clicking on the backdrop invokes onClose when provided.
 */
export function StickyOverlay({
                                  children,
                                  onClose,
                                  className = ''
                              }: {
    children: React.ReactNode;
    onClose?: () => void;
    className?: string;
}) {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);
    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="absolute inset-0 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60"
            >
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white/90 transition-colors shadow-sm"
                        aria-label="Close"
                    >
                        <XIcon className="h-5 w-5 text-gray-600"/>
                    </button>
                )}
            </div>
            {/* Centered content */}
            <div className="relative h-full w-full overflow-y-auto">
                <div className="min-h-full px-4 py-6 flex items-center justify-center">
                    <div
                        className={
                            "w-full max-h-full max-w-3xl rounded-lg bg-white shadow-lg " + className
                        }
                    >
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
