import React, {useCallback, useMemo, useState} from 'react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import imageCompression from 'browser-image-compression';
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Button, Slider, Label} from '@/components/ui';
import {useTranslation} from 'react-i18next';

type Area = { x: number; y: number; width: number; height: number };

export interface ImageCropperDialogProps {
  open: boolean;
  src: string | null; // object URL or data URL
  aspect?: number; // width/height
  onClose: () => void;
  onConfirm: (file: File, previewUrl: string) => void;
  /** Optional: maximum dimension for the output (longest side) */
  maxSize?: number; // e.g. 1600
}

async function getCroppedBlob(src: string, areaPixels: Area): Promise<Blob> {
  const image: HTMLImageElement = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    // Handle CORS for object URLs is fine; for remote images need crossOrigin
    img.src = src;
  });

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(areaPixels.width));
  canvas.height = Math.max(1, Math.floor(areaPixels.height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(
    image,
    areaPixels.x,
    areaPixels.y,
    areaPixels.width,
    areaPixels.height,
    0,
    0,
    canvas.width,
    canvas.height
  );
  return await new Promise((resolve) => canvas.toBlob(b => resolve(b as Blob), 'image/jpeg', 0.92));
}

export const ImageCropperDialog: React.FC<ImageCropperDialogProps> = ({open, src, aspect = 3/4, onClose, onConfirm, maxSize = 1600}) => {
  const { t } = useTranslation();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const handleCropComplete = useCallback((_croppedArea: Area, croppedAreaPx: Area) => {
    setCroppedAreaPixels(croppedAreaPx);
  }, []);

  const zoomValue = useMemo(() => [zoom], [zoom]);

  const handleApply = useCallback(async () => {
    if (!src || !croppedAreaPixels) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(src, croppedAreaPixels);
      // Downscale/compress
      const fileFromBlob = new File([blob], 'crop.jpg', { type: 'image/jpeg' });
      const compressed = await imageCompression(fileFromBlob, {
        maxSizeMB: 1.5,
        maxWidthOrHeight: maxSize,
        useWebWorker: true,
        initialQuality: 0.85,
      });
      const previewUrl = URL.createObjectURL(compressed);
      onConfirm(compressed, previewUrl);
    } finally {
      setBusy(false);
    }
  }, [src, croppedAreaPixels, maxSize, onConfirm]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent id="tour-image-cropper-dialog" className="max-w-[92vw] md:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('cropper.title', 'Adjust your photo')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="relative w-full h-[60vh] max-h-[520px] bg-black/70 rounded-md overflow-hidden">
            {src ? (
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
                restrictPosition
                cropShape="rect"
                objectFit="contain"
              />
            ) : null}
          </div>
          <div className="px-2">
            <Label className="text-xs text-muted-foreground block mb-1">{t('cropper.zoom', 'Zoom')}</Label>
            <Slider min={1} max={3} step={0.01} value={zoomValue} onValueChange={(v) => setZoom(v[0])} />
            <p className="text-[12px] text-muted-foreground mt-2">
              {t('cropper.help', 'Use the pinch gesture (mobile) or mouse wheel to zoom. Drag to reframe. Portrait crop is enforced.')}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>{t('cropper.cancel', 'Cancel')}</Button>
          <Button onClick={handleApply} isLoading={busy}>{t('cropper.apply', 'Apply')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropperDialog;
