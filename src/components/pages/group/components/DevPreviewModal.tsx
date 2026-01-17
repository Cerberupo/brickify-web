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
    selectedPieceByPart?: Record<string, any>;
}

type AspectRatio = '1:1' | '9:16';

export function DevPreviewModal({
                                    isOpen,
                                    onClose,
                                    originalImage,
                                    personName,
                                    person,
                                    legoProps,
                                    selectedPieceByPart,
                                }: DevPreviewModalProps) {
    const {t} = useTranslation();
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingProgress, setRecordingProgress] = useState(0);
    const [randomLegoProps, setRandomLegoProps] = useState<LegoCompositeProps | null>(null);
    const [randomSelectedPieces, setRandomSelectedPieces] = useState<Record<string, any> | null>(null);
    const partUsageCounts = useRef<Record<string, number>>({wig: 0, head: 0, upperPart: 0, lowerPart: 0});
    const pieceUsageCounts = useRef<Record<string, Record<string, number>>>({
        wig: {},
        head: {},
        upperPart: {},
        lowerPart: {}
    });
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
    }, [person?.matches]);

    const currentSelectedPieces = useMemo(() => {
        if (randomSelectedPieces) return randomSelectedPieces;

        const matches = person?.matches || {};
        const resolvePiece = (part: string) => {
            // Prioritize selection passed from PersonRow
            if (selectedPieceByPart && selectedPieceByPart[part]) {
                return selectedPieceByPart[part];
            }

            const m = matches[part];
            if (!m) return null;

            const pieces = Array.isArray(m.matchedPieceIds) ? m.matchedPieceIds : [];
            const selected = m.selectedPiece || pieces[0];

            if (!selected) return null;

            // Si ya es un objeto con imágenes, lo devolvemos
            if (typeof selected === 'object' && (selected.imageFrontUrl || selected.imageUrl)) return selected;

            // Si es un ID, buscamos en matchedPieceIds
            const id = typeof selected === 'string' ? selected : (selected.id || selected._id || selected.pieceId);
            return pieces.find((p: any) => {
                const pid = p.id || p._id || p.pieceId;
                return String(pid) === String(id);
            });
        };

        return {
            wig: resolvePiece('wig'),
            head: resolvePiece('head'),
            upperPart: resolvePiece('upperPart'),
            lowerPart: resolvePiece('lowerPart'),
        };
    }, [randomSelectedPieces, person?.matches, selectedPieceByPart]);

    const randomizeLego = useCallback(() => {
        // 1. Decidir qué parte cambiar (la que tenga menor carga)
        const parts = ['wig', 'head', 'upperPart', 'lowerPart'];
        const minPartUsage = Math.min(...parts.map(p => partUsageCounts.current[p]));
        const candidateParts = parts.filter(p => partUsageCounts.current[p] === minPartUsage);
        const selectedPart = candidateParts[Math.floor(Math.random() * candidateParts.length)];

        // Incrementar carga de la parte
        partUsageCounts.current[selectedPart]++;

        // 2. Decidir qué pieza de esa parte poner (la que tenga menor carga)
        const pieces = availablePieces[selectedPart];
        if (!pieces || pieces.length === 0) return;

        const getPieceId = (p: any) => p.id || p._id || p.pieceId || p.elementId || p.storePieceId;

        // Inicializar contadores para piezas nuevas si no existen
        pieces.forEach((p: any) => {
            const id = getPieceId(p);
            if (pieceUsageCounts.current[selectedPart][id] === undefined) {
                pieceUsageCounts.current[selectedPart][id] = 0;
            }
        });

        const minPieceUsage = Math.min(...pieces.map((p: any) => pieceUsageCounts.current[selectedPart][getPieceId(p)]));
        const candidatePieces = pieces.filter((p: any) => pieceUsageCounts.current[selectedPart][getPieceId(p)] === minPieceUsage);
        const selectedPiece = candidatePieces[Math.floor(Math.random() * candidatePieces.length)];

        // Incrementar carga de la pieza
        pieceUsageCounts.current[selectedPart][getPieceId(selectedPiece)]++;

        // 3. Actualizar el estado
        setRandomSelectedPieces(prev => {
            const current = prev || {...currentSelectedPieces};
            return {
                ...current,
                [selectedPart]: selectedPiece
            };
        });

        setRandomLegoProps(prev => {
            const sideImages = toSideWithFallback(
                selectedPart === 'wig' ? 'hair' : selectedPart === 'upperPart' ? 'body' : selectedPart === 'lowerPart' ? 'pants' : 'head',
                selectedPiece
            );

            // Si es la primera vez, inicializamos con los props actuales
            if (!prev) {
                return {
                    ...legoProps,
                    [selectedPart]: sideImages,
                    side: 'front'
                };
            }

            return {
                ...prev,
                [selectedPart]: sideImages
            };
        });
    }, [availablePieces, legoProps, currentSelectedPieces]);

    const handleCaptureJpg = async () => {
        const area = document.getElementById('preview-capture-area');
        if (!area) return;

        try {
            const dataUrl = await toPng(area, {
                quality: 0.95,
                backgroundColor: '#ffffff',
                skipFonts: true,
                fontEmbedCSS: '', // Evita que intente leer reglas CSS externas
                cacheBust: false,
                includeQueryParams: true,
                filter: (node: any) => {
                    if (node?.hasAttribute && node.hasAttribute('data-recording-ignore')) {
                        return false;
                    }
                    return true;
                },
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
        // Reset usage counts
        partUsageCounts.current = {wig: 0, head: 0, upperPart: 0, lowerPart: 0};
        pieceUsageCounts.current = {wig: {}, head: {}, upperPart: {}, lowerPart: {}};

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
                setRandomSelectedPieces(null);
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

                if (Math.floor(seconds * frameRate) % 10 === 0) {
                    randomizeLego();
                }

                // Capturar el estado actual del HTML al canvas
                try {
                    const tempCanvas = await toCanvas(area, {
                        width: canvas.width / 2, // Dimensiones lógicas del elemento
                        height: canvas.height / 2,
                        canvasWidth: canvas.width, // Dimensiones reales del canvas destino
                        canvasHeight: canvas.height,
                        skipFonts: true,
                        cacheBust: true,
                        includeQueryParams: true,
                        filter: (node: any) => {
                            if (node?.hasAttribute && node.hasAttribute('data-recording-ignore')) {
                                return false;
                            }
                            return true;
                        },
                        style: {
                            transform: 'scale(1)',
                            transformOrigin: 'top left',
                            width: (canvas.width / 2) + 'px',
                            height: (canvas.height / 2) + 'px'
                        }
                    });
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
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
                        <DialogTitle className="text-xl">{t('devPreview.title')}</DialogTitle>
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
                            {t('devPreview.captureJpg')}
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
                                    {t('devPreview.recording', {progress: Math.round(recordingProgress)})}
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4 mr-2"/>
                                    {t('devPreview.recordVideo')}
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
                            crossOrigin="anonymous"
                            onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                if (target.getAttribute('crossorigin') === 'anonymous') {
                                    target.removeAttribute('crossorigin');
                                    target.src = aspectRatio === '1:1' ? '/share/1-1.jpg' : '/share/9-16.jpg';
                                }
                            }}
                        />

                        {/* User Original Image */}
                        <div
                            className={`absolute overflow-hidden transition-all duration-300 ${
                                aspectRatio === '1:1'
                                    ? 'top-[16%] left-[19%] w-[39%] h-[52.5%] rounded'
                                    : 'top-[18%] left-[15%] w-[41.2%] h-[31.2%] rounded'
                            }`}>
                            <img
                                src={originalImage}
                                className="w-full h-full object-cover"
                                alt={personName}
                                crossOrigin="anonymous"
                                onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement;
                                    if (target.getAttribute('crossorigin') === 'anonymous') {
                                        target.removeAttribute('crossorigin');
                                        target.src = originalImage;
                                    }
                                }}
                            />
                        </div>

                        {/* Lego Character */}
                        <div className={`absolute transition-all duration-300 ${
                            aspectRatio === '1:1'
                                ? 'bottom-[-15%] right-[-5%] w-[62.66%]'
                                : 'bottom-[5%] right-[-7%] w-[72%]'
                        }`}>
                            <LegoComposite
                                {...currentLegoProps}
                                className="w-full"
                                hideToggle={true}
                                crossOrigin={isRecording ? 'anonymous' : undefined}
                            />
                        </div>

                        {/* Selected Pieces List (Only for 9:16) */}
                        {aspectRatio === '9:16' && (
                            <div className="absolute top-[52%] left-[10%] w-[45%] flex flex-col gap-2">
                                {Object.entries(currentSelectedPieces).map(([key, piece]: [string, any]) => {
                                    if (!piece) return null;
                                    const imgSrc = currentLegoProps.side === 'back' ? piece.imageBackUrl : piece.imageFrontUrl;
                                    if (!imgSrc) return null;

                                    return (
                                        <div key={key}
                                             className="flex items-center gap-3 bg-white/40 backdrop-blur-md rounded-xl p-2 border border-white/40 shadow-sm">
                                            <div
                                                className="w-14 h-14 flex-shrink-0 bg-white rounded-lg p-1.5 shadow-inner">
                                                <img
                                                    src={imgSrc}
                                                    alt={piece.name || key}
                                                    className="w-full h-full object-contain"
                                                    crossOrigin={isRecording ? 'anonymous' : undefined}
                                                    onError={(e) => {
                                                        const target = e.currentTarget as HTMLImageElement;
                                                        if (target.getAttribute('crossorigin') === 'anonymous') {
                                                            target.removeAttribute('crossorigin');
                                                            target.src = imgSrc;
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div
                                                    className="text-[12px] font-bold text-gray-900 truncate leading-tight">
                                                    {piece.name || t('devPreview.legoPiece')}
                                                </div>
                                                <div className="text-[10px] font-medium text-gray-600 truncate">
                                                    {piece.elementId || piece.storePieceId || '-'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* REC Indicator */}
                        {isRecording && (
                            <div
                                className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm data-[recording-ignore]:hidden"
                                data-recording-ignore="true"
                            >
                                <div className="h-3 w-3 rounded-full bg-red-600 animate-pulse"/>
                                <span className="text-xs font-bold tracking-tighter text-white">REC</span>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
