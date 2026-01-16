import React from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle,} from '@/components/ui/dialog';
import {ArrowRight, Camera} from 'lucide-react';
import type {LegoCompositeProps} from '@/components/lego';
import {LegoComposite} from '@/components/lego';
import {Button} from '@/components/ui/button';

interface DevPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    originalImage: string;
    personName: string;
    legoProps: LegoCompositeProps;
}

export function DevPreviewModal({
                                    isOpen,
                                    onClose,
                                    originalImage,
                                    personName,
                                    legoProps,
                                }: DevPreviewModalProps) {

    const handleCapture = () => {
        // Por ahora solo un aviso, ya que implementar captura real requiere librerías extra
        // Pero podemos intentar un truco de impresión o simplemente dejarlo bonito como pidió
        window.print();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="max-w-[100vw] w-screen h-screen flex flex-col p-0 overflow-hidden bg-white border-none rounded-none">
                <DialogHeader className="p-4 border-b flex flex-row items-center justify-between print:hidden">
                    <DialogTitle>Social Media Preview - {personName}</DialogTitle>
                    <Button variant="outline" size="sm" onClick={handleCapture} className="mr-8">
                        <Camera className="h-4 w-4 mr-2"/>
                        Capture / Print
                    </Button>
                </DialogHeader>

                <div
                    className="flex-1 flex items-center justify-center p-8 bg-gray-50 overflow-auto print:bg-white print:p-0">
                    <div id="preview-capture-area"
                         className="flex items-center gap-12 bg-white p-12 rounded-xl shadow-2xl border border-gray-100 min-w-fit print:shadow-none print:border-none print:p-0">
                        {/* Left: Original Image */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-64 h-80 rounded-lg overflow-hidden border-4 border-white shadow-lg">
                                <img
                                    src={originalImage}
                                    alt="Original"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span
                                className="text-gray-400 font-medium uppercase tracking-widest text-sm">Original</span>
                        </div>

                        {/* Center: Arrow */}
                        <div className="flex flex-col items-center">
                            <div className="bg-yellow-50 p-4 rounded-full border-2 border-yellow-200">
                                <ArrowRight className="h-16 w-16 text-yellow-500" strokeWidth={3}/>
                            </div>
                        </div>

                        {/* Right: Lego Preview */}
                        <div className="flex flex-col items-center gap-4">
                            <div
                                className="w-64 h-80 flex items-center justify-center bg-white rounded-lg border-4 border-white shadow-lg p-4">
                                <LegoComposite
                                    {...legoProps}
                                    className="w-full h-full"
                                />
                            </div>
                            <span
                                className="text-gray-400 font-medium uppercase tracking-widest text-sm">Brickified</span>
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                        @page {
                            size: landscape;
                            margin: 0;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                            -webkit-print-color-adjust: exact;
                        }
                        body * {
                            visibility: hidden;
                        }
                        #preview-capture-area, #preview-capture-area * {
                            visibility: visible;
                        }
                        #preview-capture-area {
                            position: fixed;
                            left: 50%;
                            top: 50%;
                            transform: translate(-50%, -50%);
                            width: auto;
                            height: auto;
                            margin: 0;
                            padding: 0;
                            display: flex !important;
                            align-items: center;
                            justify-content: center;
                            background: white !important;
                        }
                        /* Hide close button and other UI elements that might have been visible */
                        [data-slot="dialog-close"], button {
                            display: none !important;
                        }
                    }
                `
                }}/>
            </DialogContent>
        </Dialog>
    );
}
