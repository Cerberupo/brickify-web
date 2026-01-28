import React, {useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
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
    const [dayNumber, setDayNumber] = useState<number>(1);
    const [revealMode, setRevealMode] = useState(false);
    const [config, setConfig] = useState({
        totalSeconds: 10.5,
        introStart: 0,
        introEnd: 1.5,
        introTextStart: 0,
        introTextEnd: 1.5,
        legoStart: 1.5,
        legoEnd: 7.5,
        legoSpeed: 3, // Cada cuántos frames cambiar pieza (frameRate=10, 3 = 0.3s)
        ctaStart: 8,
        ctaEnd: 10.5,
        outroStart: 7.5,
        outroEnd: 10.5,
        revealPartSpeed: 0.5 // Segundos que tarda en revelarse cada parte
    });

    const {t} = useTranslation();
    const introText = t('devPreview.dayText', {n: dayNumber});
    const ctaText = t('devPreview.ctaText');

    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [isRecording, setIsRecording] = useState(false);
    const [selectedSlogan, setSelectedSlogan] = useState('');
    const [isClientState, setIsClientState] = useState(false);

    const introImageRef = useRef<HTMLDivElement | null>(null);
    const introTextRef = useRef<HTMLDivElement | null>(null);
    const ctaRef = useRef<HTMLDivElement | null>(null);
    const outroRef = useRef<HTMLDivElement | null>(null);
    const legoContainerRef = useRef<HTMLDivElement | null>(null);
    const piecesListRef = useRef<HTMLDivElement | null>(null);
    const recordLabelRef = useRef<HTMLSpanElement | null>(null);
    const isRecordingRef = useRef(false);
    const overlayStateRef = useRef({
        showIntro: false,
        showIntroText: false,
        showCTA: false,
        showOutro: false
    });
    const revealedPartsRef = useRef<Record<string, boolean>>({
        wig: false,
        head: false,
        upperPart: false,
        lowerPart: false
    });
    const selectedPiecesRef = useRef<Record<string, any>>({});
    const configRef = useRef(config);
    const revealModeRef = useRef(revealMode);

    const slogans = useMemo(() => {
        const s = t('devPreview.slogan', {returnObjects: true});
        return Array.isArray(s) ? s : [t('devPreview.slogan', 'De la foto a las piezas LEGO')];
    }, [t]);

    React.useEffect(() => {
        setIsClientState(true);
        if (slogans.length > 0) {
            const randomSlogan = slogans[Math.floor(Math.random() * slogans.length)];
            setSelectedSlogan(randomSlogan);
        }
    }, [slogans]);

    React.useEffect(() => {
        configRef.current = config;
    }, [config]);

    React.useEffect(() => {
        revealModeRef.current = revealMode;
    }, [revealMode]);

    React.useEffect(() => {
        isRecordingRef.current = isRecording;
    }, [isRecording]);

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
    }, [person?.matches, selectedPieceByPart]);

    React.useEffect(() => {
        selectedPiecesRef.current = currentSelectedPieces;
    }, [currentSelectedPieces]);

    const partUsageCounts = useRef<Record<string, number>>({
        wig: 0,
        head: 0,
        upperPart: 0,
        lowerPart: 0
    });

    const partKeys = ['wig', 'head', 'upperPart', 'lowerPart'] as const;

    const getPieceSideImages = (part: string, piece: any) => {
        if (!piece) return null;
        const type = part === 'wig' ? 'hair' : part === 'upperPart' ? 'body' : part === 'lowerPart' ? 'pants' : 'head';
        return toSideWithFallback(type, piece);
    };

    const updateLegoPartImage = (part: string, piece: any) => {
        const legoRoot = legoContainerRef.current;
        if (!legoRoot || !piece) return;

        const img = legoRoot.querySelector<HTMLImageElement>(`img[data-lego-part="${part}"]`);
        if (!img) return;

        const sideImages = getPieceSideImages(part, piece);
        if (!sideImages) return;

        const side = img.dataset.legoSide === 'back' ? 'back' : 'front';
        img.src = side === 'back' ? sideImages.back : sideImages.front;
    };

    const updatePieceEntry = (part: string, piece: any) => {
        const container = piecesListRef.current?.querySelector<HTMLDivElement>(`[data-piece-entry="${part}"]`);
        if (!container) return;

        if (!piece) {
            container.style.display = 'none';
            return;
        }

        container.style.display = '';
        const img = container.querySelector<HTMLImageElement>('img[data-piece-image]');
        const nameEl = container.querySelector<HTMLElement>('[data-piece-name]');
        const idEl = container.querySelector<HTMLElement>('[data-piece-id]');

        if (img) {
            const side = legoProps.side === 'back' ? 'back' : 'front';
            const src =
                side === 'back'
                    ? piece.imageBackUrl || piece.imageFrontUrl || piece.imageUrl || ''
                    : piece.imageFrontUrl || piece.imageUrl || '';
            if (src) img.src = src;
        }
        if (nameEl) {
            nameEl.textContent = piece.name || t('devPreview.legoPiece');
        }
        if (idEl) {
            idEl.textContent = piece.elementId || piece.storePieceId || '-';
        }
    };

    const syncPiecesDom = (pieces: Record<string, any>) => {
        partKeys.forEach((part) => {
            updatePieceEntry(part, pieces[part]);
            updateLegoPartImage(part, pieces[part]);
        });
    };

    const setOverlayVisible = (ref: React.MutableRefObject<HTMLDivElement | null>, visible: boolean) => {
        const el = ref.current;
        if (!el) return;
        el.style.opacity = visible ? '1' : '0';
        el.style.transform = visible ? 'translateZ(0) scale(1)' : 'translateZ(0) scale(0.98)';
    };

    const setOverlayState = (key: keyof typeof overlayStateRef.current, visible: boolean) => {
        if (overlayStateRef.current[key] === visible) return;
        overlayStateRef.current[key] = visible;

        if (key === 'showIntro') {
            applyIntroLayout(visible);
            return;
        }

        const targetRef =
            key === 'showIntroText'
                ? introTextRef
                : key === 'showCTA'
                    ? ctaRef
                    : outroRef;
        setOverlayVisible(targetRef, visible);
    };

    const applyIntroLayout = (showIntro: boolean) => {
        const el = introImageRef.current;
        if (!el) return;
        const isSquare = aspectRatio === '1:1';

        const normalClasses = isSquare
            ? ['top-[16%]', 'left-[19%]', 'w-[39%]', 'h-[52.5%]', 'rounded']
            : ['top-[18%]', 'left-[15%]', 'w-[41.2%]', 'h-[31.2%]', 'rounded'];
        const introClasses = ['inset-0', 'w-full', 'h-full', 'z-10'];

        normalClasses.forEach((cls) => el.classList.toggle(cls, !showIntro));
        introClasses.forEach((cls) => el.classList.toggle(cls, showIntro));
    };

    const setRevealPartVisible = (part: string, visible: boolean) => {
        const legoRoot = legoContainerRef.current;
        const pieceRow = piecesListRef.current?.querySelector<HTMLDivElement>(`[data-piece-entry="${part}"]`);

        const img = legoRoot?.querySelector<HTMLImageElement>(`img[data-lego-part="${part}"]`);
        if (img) {
            img.style.opacity = visible ? '1' : '0';
            img.style.transform = visible ? 'translateY(0)' : 'translateY(100%)';
        }

        if (pieceRow) {
            pieceRow.style.opacity = visible ? '1' : '0';
            pieceRow.style.transform = visible ? 'translateX(0)' : 'translateX(200%)';
        }

        revealedPartsRef.current[part] = visible;
    };

    const resetRevealState = () => {
        partKeys.forEach((part) => setRevealPartVisible(part, true));
    };

    React.useEffect(() => {
        if (!isOpen) return;
        applyIntroLayout(overlayStateRef.current.showIntro);
        setOverlayVisible(introTextRef, overlayStateRef.current.showIntroText);
        setOverlayVisible(ctaRef, overlayStateRef.current.showCTA);
        setOverlayVisible(outroRef, overlayStateRef.current.showOutro);
        resetRevealState();
        syncPiecesDom(currentSelectedPieces);
    }, [isOpen, aspectRatio, currentSelectedPieces]);
    const randomizeLego = () => {
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

        const nextSelected = {
            ...(selectedPiecesRef.current || currentSelectedPieces),
            [selectedPart]: selectedPiece
        };
        selectedPiecesRef.current = nextSelected;
        updatePieceEntry(selectedPart, selectedPiece);
        updateLegoPartImage(selectedPart, selectedPiece);
    };

    const getCappedDimensions = (width: number, height: number, maxRes: number = 1080) => {
        if (width <= maxRes && height <= maxRes) return {width, height};
        const ratio = width / height;
        if (width > height) {
            return {width: maxRes, height: Math.round(maxRes / ratio)};
        }
        return {width: Math.round(maxRes * ratio), height: maxRes};
    };

    const handleCaptureJpg = async () => {
        const area = document.getElementById('preview-capture-area');
        if (!area) return;

        try {
            const rect = area.getBoundingClientRect();
            const {width, height} = getCappedDimensions(rect.width * 2, rect.height * 2);

            const dataUrl = await toPng(area, {
                quality: 0.95,
                backgroundColor: '#ffffff',
                skipFonts: true,
                fontEmbedCSS: '', // Evita que intente leer reglas CSS externas
                cacheBust: false,
                includeQueryParams: true,
                width: rect.width,
                height: rect.height,
                canvasWidth: width,
                canvasHeight: height,
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
        if (!area) return;

        // Reset usage counts y estados
        partUsageCounts.current = {wig: 0, head: 0, upperPart: 0, lowerPart: 0};
        pieceUsageCounts.current = {wig: {}, head: {}, upperPart: {}, lowerPart: {}};
        selectedPiecesRef.current = currentSelectedPieces;
        revealedPartsRef.current = {
            wig: false,
            head: false,
            upperPart: false,
            lowerPart: false
        };
        if (revealModeRef.current) {
            partKeys.forEach((part) => setRevealPartVisible(part, false));
        } else {
            resetRevealState();
        }
        syncPiecesDom(currentSelectedPieces);
        overlayStateRef.current = {
            showIntro: false,
            showIntroText: false,
            showCTA: false,
            showOutro: false
        };

        // Cambiar eslogan al empezar
        if (slogans.length > 0) {
            const randomSlogan = slogans[Math.floor(Math.random() * slogans.length)];
            setSelectedSlogan(randomSlogan);
        }

        // 1. Mostrar intro a pantalla completa ANTES de empezar a grabar
        setIsRecording(true);
        isRecordingRef.current = true;
        setOverlayState('showIntro', true);
        setOverlayState('showIntroText', true);
        setOverlayState('showCTA', false);
        setOverlayState('showOutro', false);
        if (recordLabelRef.current) {
            recordLabelRef.current.textContent = t('devPreview.recording', {progress: 0});
        }
        chunksRef.current = [];

        // Pequeña espera para asegurar que el DOM se actualizó y la imagen está en grande
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            // Creamos un canvas para la grabación
            const canvas = document.createElement('canvas');
            const rect = area.getBoundingClientRect();
            // Usar dimensiones reales pero limitadas a 1080p
            const {width: canvasWidth, height: canvasHeight} = getCappedDimensions(rect.width * 2, rect.height * 2);

            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');

            const videoStream = canvas.captureStream(30); // 30 FPS

            // Prefer MP4 if supported
            let mimeType = 'video/webm;codecs=vp9';
            if (MediaRecorder.isTypeSupported('video/mp4')) {
                mimeType = 'video/mp4';
            } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
                mimeType = 'video/webm;codecs=h264';
            }

            const recorder = new MediaRecorder(videoStream, {
                mimeType: mimeType
            });

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
                const blob = new Blob(chunksRef.current, {type: mimeType});
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `brickify-${personName.replace(/\s+/g, '-').toLowerCase()}-${aspectRatio.replace(':', '-')}.${extension}`;
                link.href = url;
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 100);

                // Stop all tracks in videoStream
                videoStream.getTracks().forEach(track => track.stop());

                setIsRecording(false);
                isRecordingRef.current = false;
                setOverlayState('showIntro', false);
                setOverlayState('showIntroText', false);
                setOverlayState('showCTA', false);
                setOverlayState('showOutro', false);
                resetRevealState();
                selectedPiecesRef.current = currentSelectedPieces;
                syncPiecesDom(currentSelectedPieces);
                recorderRef.current = null;
                // Detener el intervalo explícitamente al parar el grabador por cualquier motivo
                if (recordingIntervalRef.current) {
                    clearInterval(recordingIntervalRef.current);
                    recordingIntervalRef.current = null;
                }
            };

            recorderRef.current = recorder;
            recorder.start();

            let lastTimestamp = performance.now();
            let seconds = 0;
            let currentShowIntro = true;
            let currentShowIntroText = true;
            let currentShowCTA = false;
            let currentShowOutro = false;
            const frameRate = 60; // 60 FPS para mayor fluidez

            recordingIntervalRef.current = window.setInterval(async () => {
                const now = performance.now();
                const deltaTime = (now - lastTimestamp) / 1000;
                lastTimestamp = now;

                seconds += deltaTime;
                const progress = Math.min((seconds / configRef.current.totalSeconds) * 100, 100);
                if (recordLabelRef.current) {
                    recordLabelRef.current.textContent = t('devPreview.recording', {progress: Math.round(progress)});
                }

                // Intro image
                const shouldShowIntro = seconds >= configRef.current.introStart && seconds <= configRef.current.introEnd;
                if (shouldShowIntro !== currentShowIntro) {
                    currentShowIntro = shouldShowIntro;
                    setOverlayState('showIntro', shouldShowIntro);
                }

                // Intro text
                const shouldShowIntroText = seconds >= configRef.current.introTextStart && seconds <= configRef.current.introTextEnd;
                if (shouldShowIntroText !== currentShowIntroText) {
                    currentShowIntroText = shouldShowIntroText;
                    setOverlayState('showIntroText', shouldShowIntroText);
                }
                const shouldShowCTA = seconds >= configRef.current.ctaStart && seconds <= configRef.current.ctaEnd;
                if (shouldShowCTA !== currentShowCTA) {
                    currentShowCTA = shouldShowCTA;
                    setOverlayState('showCTA', shouldShowCTA);
                }

                // Outro
                const shouldShowOutro = seconds >= configRef.current.outroStart && seconds <= configRef.current.outroEnd;
                if (shouldShowOutro !== currentShowOutro) {
                    currentShowOutro = shouldShowOutro;
                    setOverlayState('showOutro', shouldShowOutro);
                }

                // Animation logic based on mode
                if (revealModeRef.current) {
                    // Reveal mode: sequential reveal of parts
                    if (seconds >= configRef.current.legoStart && seconds <= configRef.current.legoEnd) {
                        const partDuration = configRef.current.revealPartSpeed;
                        const revealOrder = ['wig', 'head', 'upperPart', 'lowerPart'];

                        revealOrder.forEach((part, index) => {
                            const partStart = configRef.current.legoStart + (index * partDuration);
                            setRevealPartVisible(part, seconds >= partStart);
                        });
                    } else if (seconds > configRef.current.legoEnd) {
                        partKeys.forEach((part) => setRevealPartVisible(part, true));
                    } else {
                        partKeys.forEach((part) => setRevealPartVisible(part, false));
                    }
                } else {
                    // Randomization mode: existing logic
                    if (seconds >= configRef.current.legoStart && seconds <= configRef.current.legoEnd && !currentShowOutro && Math.floor(seconds * frameRate) % configRef.current.legoSpeed === 0) {
                        randomizeLego();
                    }
                }

                // Capturar el estado actual del HTML al canvas
                try {
                    const tempCanvas = await toCanvas(area, {
                        width: rect.width, // Dimensiones lógicas del elemento
                        height: rect.height,
                        canvasWidth: canvasWidth, // Dimensiones reales del canvas destino
                        canvasHeight: canvasHeight,
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
                            width: rect.width + 'px',
                            height: rect.height + 'px'
                        }
                    });
                    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                    ctx.drawImage(tempCanvas, 0, 0, canvasWidth, canvasHeight);
                } catch (e) {
                    console.error('Error capturing frame:', e);
                }

                if (seconds >= configRef.current.totalSeconds) {
                    stopRecording();
                }
            }, 1000 / frameRate);

        } catch (err) {
            console.error('Error starting recording:', err);
            setIsRecording(false);
            isRecordingRef.current = false;
            setOverlayState('showIntro', false);
            setOverlayState('showIntroText', false);
            setOverlayState('showCTA', false);
            setOverlayState('showOutro', false);
            resetRevealState();
            selectedPiecesRef.current = currentSelectedPieces;
            syncPiecesDom(currentSelectedPieces);
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

    const currentLegoProps = legoProps;

    if (!isOpen || !isClientState) return null;

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

                        <div
                            className="flex flex-wrap items-center gap-x-4 gap-y-2 ml-4 p-1 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="text-[10px] uppercase font-bold text-gray-400">{t('devPreview.config.day')}:</span>
                                <input
                                    type="number"
                                    value={dayNumber}
                                    onChange={(e) => setDayNumber(parseInt(e.target.value) || 1)}
                                    className="w-10 h-6 border border-gray-200 rounded px-1 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500 text-black"
                                />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="text-[10px] uppercase font-bold text-gray-400">{t('devPreview.config.total')}:</span>
                                <input
                                    type="number"
                                    value={config.totalSeconds}
                                    onChange={(e) => setConfig(prev => ({
                                        ...prev,
                                        totalSeconds: parseFloat(e.target.value) || 1
                                    }))}
                                    className="w-12 h-6 border border-gray-200 rounded px-1 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500 text-black"
                                />
                            </div>

                            {/* Intro config */}
                            <div className="flex items-center gap-1 bg-blue-50/50 p-1 rounded">
                                <span
                                    className="text-[9px] uppercase font-bold text-blue-400">{t('devPreview.config.intro')}:</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={config.introStart}
                                    onChange={(e) => setConfig(prev => ({
                                        ...prev,
                                        introStart: parseFloat(e.target.value) || 0
                                    }))}
                                    className="w-10 h-6 border border-gray-200 rounded px-1 text-[10px] focus:outline-none text-black"
                                    title="Intro Start"
                                />
                                <span className="text-[10px] text-gray-400">-</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={config.introEnd}
                                    onChange={(e) => setConfig(prev => ({
                                        ...prev,
                                        introEnd: parseFloat(e.target.value) || 0
                                    }))}
                                    className="w-10 h-6 border border-gray-200 rounded px-1 text-[10px] focus:outline-none text-black"
                                    title="Intro End"
                                />
                            </div>

                            {/* Intro Text config */}
                            <div className="flex items-center gap-1 bg-cyan-50/50 p-1 rounded">
                                <span
                                    className="text-[9px] uppercase font-bold text-cyan-600">{t('devPreview.config.dayText')}:</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={config.introTextStart}
                                    onChange={(e) => setConfig(prev => ({
                                        ...prev,
                                        introTextStart: parseFloat(e.target.value) || 0
                                    }))}
                                    className="w-10 h-6 border border-gray-200 rounded px-1 text-[10px] focus:outline-none text-black"
                                    title="Intro Text Start"
                                />
                                <span className="text-[10px] text-gray-400">-</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={config.introTextEnd}
                                    onChange={(e) => setConfig(prev => ({
                                        ...prev,
                                        introTextEnd: parseFloat(e.target.value) || 0
                                    }))}
                                    className="w-10 h-6 border border-gray-200 rounded px-1 text-[10px] focus:outline-none text-black"
                                    title="Intro Text End"
                                />
                            </div>

                            {/* Lego config */}
                            <div className="flex items-center gap-1 bg-yellow-50/50 p-1 rounded">
                                <span
                                    className="text-[9px] uppercase font-bold text-yellow-600">{t('devPreview.config.lego')}:</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={config.legoStart}
                                    onChange={(e) => setConfig(prev => ({
                                        ...prev,
                                        legoStart: parseFloat(e.target.value) || 0
                                    }))}
                                    className="w-10 h-6 border border-gray-200 rounded px-1 text-[10px] focus:outline-none text-black"
                                    title="Lego Start"
                                />
                                <span className="text-[10px] text-gray-400">-</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={config.legoEnd}
                                    onChange={(e) => setConfig(prev => ({
                                        ...prev,
                                        legoEnd: parseFloat(e.target.value) || 0
                                    }))}
                                    className="w-10 h-6 border border-gray-200 rounded px-1 text-[10px] focus:outline-none text-black"
                                    title="Lego End"
                                />
                                <span
                                    className="text-[9px] uppercase font-bold text-gray-400 ml-1">{t('devPreview.config.speed')}:</span>
                                <input
                                    type="number"
                                    value={config.legoSpeed}
                                    onChange={(e) => setConfig(prev => ({
                                        ...prev,
                                        legoSpeed: parseInt(e.target.value) || 1
                                    }))}
                                    className="w-8 h-6 border border-gray-200 rounded px-1 text-[10px] focus:outline-none text-black"
                                    title="Lego Speed (frames)"
                                />
                            </div>

                            {/* CTA config */}
                            <div className="flex items-center gap-1 bg-green-50/50 p-1 rounded">
                                <span
                                    className="text-[9px] uppercase font-bold text-green-600">{t('devPreview.config.cta')}:</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={config.ctaStart}
                                    onChange={(e) => setConfig(prev => ({
                                        ...prev,
                                        ctaStart: parseFloat(e.target.value) || 0
                                    }))}
                                    className="w-10 h-6 border border-gray-200 rounded px-1 text-[10px] focus:outline-none text-black"
                                    title="CTA Start"
                                />
                                <span className="text-[10px] text-gray-400">-</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={config.ctaEnd}
                                    onChange={(e) => setConfig(prev => ({
                                        ...prev,
                                        ctaEnd: parseFloat(e.target.value) || 0
                                    }))}
                                    className="w-10 h-6 border border-gray-200 rounded px-1 text-[10px] focus:outline-none text-black"
                                    title="CTA End"
                                />
                            </div>

                            {/* Outro config */}
                            <div className="flex items-center gap-1 bg-purple-50/50 p-1 rounded">
                                <span
                                    className="text-[9px] uppercase font-bold text-purple-600">{t('devPreview.config.outro')}:</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={config.outroStart}
                                    onChange={(e) => setConfig(prev => ({
                                        ...prev,
                                        outroStart: parseFloat(e.target.value) || 0
                                    }))}
                                    className="w-10 h-6 border border-gray-200 rounded px-1 text-[10px] focus:outline-none text-black"
                                    title="Outro Start"
                                />
                                <span className="text-[10px] text-gray-400">-</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={config.outroEnd}
                                    onChange={(e) => setConfig(prev => ({
                                        ...prev,
                                        outroEnd: parseFloat(e.target.value) || 0
                                    }))}
                                    className="w-10 h-6 border border-gray-200 rounded px-1 text-[10px] focus:outline-none text-black"
                                    title="Outro End"
                                />
                            </div>

                            <div className="flex items-center gap-1.5 ml-2">
                                <span
                                    className="text-[10px] uppercase font-bold text-gray-400">{t('devPreview.config.mode')}:</span>
                                <input
                                    type="checkbox"
                                    checked={revealMode}
                                    onChange={(e) => setRevealMode(e.target.checked)}
                                    className="w-4 h-4 border border-gray-200 rounded focus:ring-1 focus:ring-yellow-500 accent-yellow-500"
                                />
                            </div>
                            <div className="flex items-center gap-1.5 ml-2">
                                <span
                                    className="text-[10px] uppercase font-bold text-gray-400">{t('devPreview.config.revealSpeed')}:</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={config.revealPartSpeed}
                                    onChange={(e) => setConfig(prev => ({
                                        ...prev,
                                        revealPartSpeed: parseFloat(e.target.value) || 0.1
                                    }))}
                                    className="w-10 h-6 border border-gray-200 rounded px-1 text-[10px] focus:outline-none text-black"
                                    title="Reveal Part Speed"
                                />
                            </div>
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
                                    <span ref={recordLabelRef}>
                                        {t('devPreview.recording', {progress: 0})}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4 mr-2"/>
                                    {t('devPreview.recordVideo', {s: Math.round(config.totalSeconds)})}
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
                            ref={introImageRef}
                            className={`absolute overflow-hidden transition-all duration-500 ${
                                aspectRatio === '1:1'
                                    ? 'top-[16%] left-[19%] w-[39%] h-[52.5%] rounded'
                                    : 'top-[18%] left-[15%] w-[41.2%] h-[31.2%] rounded'
                            }`}
                        >
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

                        {/* Instagram Style Overlay */}
                        <div
                            ref={introTextRef}
                            className="absolute inset-x-0 top-[10%] z-20 flex items-start justify-center p-8 pointer-events-none transition-all duration-300"
                            style={{opacity: 0, transform: 'translateZ(0) scale(0.98)'}}
                        >
                            <div className="bg-black/90 px-6 py-3 rounded-lg shadow-xl border border-white/10 mx-4">
                                <p className="text-white text-3xl md:text-4xl font-bold tracking-tight text-center leading-tight">
                                    {introText}
                                </p>
                            </div>
                        </div>

                        {/* Outro Transition */}
                        <div
                            ref={outroRef}
                            className="absolute inset-0 z-30 transition-all duration-500"
                            style={{opacity: 0, pointerEvents: 'none', transform: 'translateZ(0) scale(0.98)'}}
                        >
                            <img
                                src="/social-logo-vertical.jpg"
                                className="w-full h-full object-cover"
                                alt="Brickify"
                                crossOrigin="anonymous"
                            />
                        </div>

                        {/* CTA Overlay */}
                        <div
                            ref={ctaRef}
                            className="absolute inset-x-0 top-[18%] z-40 flex items-start justify-center p-8 pointer-events-none transition-all duration-300"
                            style={{opacity: 0, transform: 'translateZ(0) scale(0.98)'}}
                        >
                            <div className="bg-black/90 px-6 py-3 rounded-lg shadow-xl border border-white/10 mx-4">
                                <p className="text-white text-3xl md:text-4xl font-bold tracking-tight text-center leading-tight">
                                    {ctaText}
                                </p>
                            </div>
                        </div>

                        {/* Lego Character */}
                        <div
                            ref={legoContainerRef}
                            className={`absolute ${!revealMode ? 'transition-all duration-300' : ''} ${
                            aspectRatio === '1:1'
                                ? 'bottom-[-15%] right-[-5%] w-[62.66%]'
                                : 'bottom-[5%] right-[-7%] w-[72%]'
                        }`}
                        >
                            <LegoComposite
                                {...currentLegoProps}
                                className="w-full"
                                hideToggle={true}
                                crossOrigin={isRecording ? 'anonymous' : undefined}
                            />
                        </div>

                        <div
                            className={aspectRatio === '1:1' ? "absolute top-[10%] left-[5%]" : "absolute top-[13.5%] left-[50%] -translate-x-1/2"}>
                            <span className="text-[20px] font-medium tracking-wider whitespace-nowrap">
                                {selectedSlogan}
                            </span>

                        </div>

                        <div
                            className={aspectRatio === '1:1' ? 'absolute bottom-[2%] left-[3%]' : 'absolute bottom-[1%] left-[3%]'}>
                            <span className="text-sm font-medium tracking-wider leading-none">
                                https://brickify.fun
                            </span>
                        </div>

                        {/* Selected Pieces List (Only for 9:16) */}
                        {aspectRatio === '9:16' && (
                            <div
                                ref={piecesListRef}
                                className="absolute top-[52%] left-[10%] w-[45%] flex flex-col gap-2"
                            >
                                {partKeys.map((key) => {
                                    const piece = currentSelectedPieces[key];
                                    const imgSrc = currentLegoProps.side === 'back' ? piece?.imageBackUrl : piece?.imageFrontUrl;
                                    const hidden = !piece || !imgSrc;

                                    return (
                                        <div
                                            key={key}
                                            data-piece-entry={key}
                                            className="flex items-center gap-3 bg-white/40 backdrop-blur-md rounded-xl p-2 border border-white/40 shadow-sm transition-all duration-500"
                                            style={{
                                                display: hidden ? 'none' : '',
                                                transform: 'translateX(0)',
                                                opacity: 1
                                            }}
                                        >
                                            <div className="w-14 h-14 flex-shrink-0 bg-white rounded-lg p-1.5 shadow-inner">
                                                <img
                                                    data-piece-image
                                                    src={imgSrc || ''}
                                                    alt={piece?.name || key}
                                                    className="w-full h-full object-contain"
                                                    crossOrigin={isRecording ? 'anonymous' : undefined}
                                                    onError={(e) => {
                                                        const target = e.currentTarget as HTMLImageElement;
                                                        if (target.getAttribute('crossorigin') === 'anonymous') {
                                                            target.removeAttribute('crossorigin');
                                                            target.src = imgSrc || '';
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div
                                                    data-piece-name
                                                    className="text-[12px] font-bold text-gray-900 truncate leading-tight"
                                                >
                                                    {piece?.name || t('devPreview.legoPiece')}
                                                </div>
                                                <div data-piece-id className="text-[10px] font-medium text-gray-600 truncate">
                                                    {piece?.elementId || piece?.storePieceId || '-'}
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
