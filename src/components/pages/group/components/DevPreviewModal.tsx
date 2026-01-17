import React, {useCallback, useMemo, useRef, useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle,} from '@/components/ui/dialog';
import {Camera, Play, Square} from 'lucide-react';
import type {LegoCompositeProps} from '@/components/lego';
import {LegoComposite} from '@/components/lego';
import {Button} from '@/components/ui/button';
import {toSideWithFallback} from '@/lib/lego/parts';
import {toCanvas, toPng} from 'html-to-image';

const isClient = typeof window !== 'undefined';

interface DevPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    originalImage: string;
    personName: string;
    person: any;
    legoProps: LegoCompositeProps;
}

type AspectRatio = '1:1' | '9:16';

export function DevPreviewModal({
                                    isOpen,
                                    onClose,
                                    originalImage,
                                    personName,
                                    person,
                                    legoProps,
                                }: DevPreviewModalProps) {
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingProgress, setRecordingProgress] = useState(0);
    const [randomLegoProps, setRandomLegoProps] = useState<LegoCompositeProps | null>(null);
    const recordingIntervalRef = useRef<number | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Obtener todas las piezas disponibles para aleatorizar
    const availablePieces = useMemo(() => {
        const matches = person?.matches || {};
        const out: Record<string, any[]> = {
            wig: Array.isArray(matches.wig?.matchedPieceIds) ? matches.wig.matchedPieceIds : [],
            head: Array.isArray(matches.head?.matchedPieceIds) ? matches.head.matchedPieceIds : [],
            upperPart: Array.isArray(matches.upperPart?.matchedPieceIds) ? matches.upperPart.matchedPieceIds : [],
            lowerPart: Array.isArray(matches.lowerPart?.matchedPieceIds) ? matches.lowerPart.matchedPieceIds : [],
        };
        return out;
    }, [person]);

    const getRandomPiece = (part: string) => {
        const pieces = availablePieces[part];
        if (!pieces || pieces.length === 0) return undefined;
        const random = pieces[Math.floor(Math.random() * pieces.length)];
        return toSideWithFallback(part === 'wig' ? 'hair' : part === 'upperPart' ? 'body' : part === 'lowerPart' ? 'pants' : 'head', random);
    };

    const randomizeLego = useCallback(() => {
        setRandomLegoProps({
            wig: getRandomPiece('wig'),
            head: getRandomPiece('head'),
            upperPart: getRandomPiece('upperPart'),
            lowerPart: getRandomPiece('lowerPart'),
            side: 'front'
        });
    }, [availablePieces]);

    const handleCaptureJpg = async () => {
        const area = document.getElementById('preview-capture-area');
        if (!area) return;

        try {
            const dataUrl = await toPng(area, {
                quality: 0.95,
                backgroundColor: '#ffffff',
                // Skip problematic external CSS/Fonts that cause SecurityError
                skipFonts: true,
                // html-to-image uses fetch internally if we don't handle it
                // and if the server doesn't have CORS headers, it fails.
                // For now we don't use useCORS: true because it triggers CORS preflights that fail.
            });
            const link = document.createElement('a');
            link.download = `brickify-${personName.replace(/\s+/g, '-').toLowerCase()}-${aspectRatio.replace(':', '-')}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Error capturing image:', err);
        }
    };

    const startRecording = async () => {
        const area = document.getElementById('preview-capture-area');
        if (!area || !isClient) return;

        setIsRecording(true);
        setRecordingProgress(0);
        chunksRef.current = [];

        try {
            // Creamos un canvas para la grabación
            const canvas = document.createElement('canvas');
            const rect = area.getBoundingClientRect();
            // Usar dimensiones reales para mejor calidad
            canvas.width = rect.width * 2;
            canvas.height = rect.height * 2;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');

            const stream = canvas.captureStream(30); // 30 FPS
            const recorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9'
            });

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, {type: 'video/webm'});
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `brickify-${personName.replace(/\s+/g, '-').toLowerCase()}-${aspectRatio.replace(':', '-')}.webm`;
                link.href = url;
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 100);

                setIsRecording(false);
                setRecordingProgress(0);
                setRandomLegoProps(null);
                recorderRef.current = null;
            };

            recorderRef.current = recorder;
            recorder.start();

            let seconds = 0;
            const totalSeconds = 15;
            const frameRate = 10; // capturar 10 veces por segundo el HTML al canvas

            recordingIntervalRef.current = window.setInterval(async () => {
                seconds += (1 / frameRate);
                setRecordingProgress((seconds / totalSeconds) * 100);

                // Cambiar piezas aleatoriamente cada 0.5 segundos (5 frames de captura)
                if (Math.floor(seconds * frameRate) % 5 === 0) {
                    randomizeLego();
                }

                // Capturar el estado actual del HTML al canvas
                try {
                    const tempCanvas = await toCanvas(area, {
                        width: canvas.width,
                        height: canvas.height,
                        skipFonts: true,
                        style: {
                            transform: 'scale(1)',
                            transformOrigin: 'top left'
                        }
                    });
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(tempCanvas, 0, 0);
                } catch (e) {
                    console.error('Error capturing frame:', e);
                }

                if (seconds >= totalSeconds) {
                    stopRecording();
                }
            }, 1000 / frameRate);

        } catch (err) {
            console.error('Error starting recording:', err);
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
        }

        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
            recorderRef.current.stop();
        }
    };

    const currentLegoProps = randomLegoProps || legoProps;

    if (!isOpen || !isClient) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="!max-w-none !w-screen !h-screen flex flex-col p-0 overflow-hidden bg-white border-none rounded-none z-[100] text-black">
                <DialogHeader
                    className="p-4 border-b border-gray-100 flex flex-row items-center justify-between print:hidden">
                    <div className="flex items-center gap-4">
                        <DialogTitle className="text-xl">Content Creator (DEV)</DialogTitle>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setAspectRatio('1:1')}
                                className={`h-8 gap-2 transition-all ${
                                    aspectRatio === '1:1'
                                        ? 'bg-white text-black shadow-sm font-bold'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Square className="h-4 w-4"/> 1:1
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setAspectRatio('9:16')}
                                className={`h-8 gap-2 transition-all ${
                                    aspectRatio === '9:16'
                                        ? 'bg-white text-black shadow-sm font-bold'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <div className={`w-3 h-4 border-2 rounded-sm ${
                                    aspectRatio === '9:16' ? 'border-black' : 'border-gray-500'
                                }`}/>
                                9:16
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mr-8">
                        <Button variant="outline" size="sm" onClick={handleCaptureJpg} disabled={isRecording}
                                className="bg-white border-gray-200 hover:bg-gray-50">
                            <Camera className="h-4 w-4 mr-2"/>
                            Capture JPG
                        </Button>
                        <Button
                            variant={isRecording ? 'destructive' : 'default'}
                            size="sm"
                            onClick={isRecording ? stopRecording : startRecording}
                            className={!isRecording ? "bg-yellow-500 hover:bg-yellow-600 text-black" : ""}
                        >
                            {isRecording ? (
                                <>
                                    <div className="h-2 w-2 rounded-full bg-white animate-pulse mr-2"/>
                                    Recording ({Math.round(recordingProgress)}%)
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4 mr-2"/>
                                    Record 15s Video
                                </>
                            )}
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 overflow-auto">
                    <div
                        id="preview-capture-area"
                        className={`relative overflow-hidden shadow-2xl transition-all duration-300 ${
                            aspectRatio === '1:1'
                                ? 'w-[600px] h-[600px]'
                                : 'h-[min(1000px,90vh)] aspect-[9/16]'
                        }`}
                    >
                        {/* Background */}
                        <img
                            src={aspectRatio === '1:1' ? '/share/1-1.jpg' : '/share/9-16.jpg'}
                            className="absolute inset-0 w-full h-full object-cover"
                            alt="Background"
                            onError={(e) => {
                                try {
                                    const target = e.currentTarget as HTMLImageElement;
                                    target.removeAttribute('crossorigin');
                                    target.src = aspectRatio === '1:1' ? '/share/1-1.jpg' : '/share/9-16.jpg';
                                } catch {
                                }
                            }}
                        />

                        {/* User Original Image */}
                        <div
                            className={`absolute border-4 border-white shadow-lg overflow-hidden transition-all duration-300 ${
                                aspectRatio === '1:1'
                                    ? 'top-[10%] left-[10%] w-[180px] h-[180px] rounded-xl rotate-[-3deg]'
                                    : 'top-[10%] left-1/2 -translate-x-1/2 w-[220px] h-[220px] rounded-full'
                            }`}>
                            <img
                                src={originalImage}
                                className="w-full h-full object-cover"
                                alt={personName}
                                onError={(e) => {
                                    try {
                                        const target = e.currentTarget as HTMLImageElement;
                                        target.removeAttribute('crossorigin');
                                        target.src = originalImage;
                                    } catch {
                                    }
                                }}
                            />
                        </div>

                        {/* Lego Character */}
                        <div className={`absolute transition-all duration-300 ${
                            aspectRatio === '1:1'
                                ? 'bottom-[-15%] right-[-5%] w-[370px]'
                                : 'bottom-[15%] left-1/2 -translate-x-1/2 w-[250px]'
                        }`}>
                            <LegoComposite
                                {...currentLegoProps}
                                className="w-full"
                                hideToggle={true}
                            />
                        </div>

                        {/* REC Indicator */}
                        {isRecording && (
                            <div
                                className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                <div className="h-3 w-3 rounded-full bg-red-600 animate-pulse"/>
                                <span className="text-xs font-bold tracking-tighter">REC</span>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
