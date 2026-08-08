/**
 * Helper to fetch a resource bypassing browser cache and load it as a HTMLImageElement.
 */
async function loadImage(src: string): Promise<HTMLImageElement> {
    // Fetch forcing cache bypass to avoid browser caching collision (which causes CORS block)
    const res = await fetch(src, { cache: 'reload' });
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = blobUrl;
        img.onload = () => {
            resolve(img);
        };
        img.onerror = (e) => reject(e);
    });
}

export async function generateCompositeImage(
    images: {
        wig?: string;
        head?: string;
        upperPart?: string;
        lowerPart?: string;
    },
    width = 600
): Promise<string> {
    const height = Math.round(width * 1.67);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context');

    // Fill background with a nice premium slate gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#f8fafc'); // slate-50
    grad.addColorStop(1, '#e2e8f0'); // slate-200
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Elegant circular overlay in background
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)'; // slate-300/40
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 20, width * 0.35, 0, Math.PI * 2);
    ctx.stroke();

    // Original CSS absolute positioning percentages translated into layouts
    const layout = {
        wig: { widthPct: 62, heightPct: 124, leftPct: 19, topPct: -19 },
        head: { widthPct: 29, heightPct: 29, leftPct: 35.5, topPct: 13.7 },
        upperPart: { widthPct: 70, heightPct: 70, leftPct: 15, topPct: 10 },
        lowerPart: { widthPct: 58, heightPct: 58, leftPct: 21.2, topPct: 35.5 },
    };



    // Draw order in ascending z-index: legs -> body -> head -> hair
    const drawOrder: { key: keyof typeof layout; url?: string }[] = [
        { key: 'lowerPart', url: images.lowerPart },
        { key: 'upperPart', url: images.upperPart },
        { key: 'head', url: images.head },
        { key: 'wig', url: images.wig }
    ];

    for (const part of drawOrder) {
        if (!part.url) continue;
        try {
            const img = await loadImage(part.url);
            const pos = layout[part.key];
            const w = width * (pos.widthPct / 100);
            const h = height * (pos.heightPct / 100);
            const x = width * (pos.leftPct / 100);
            const y = height * (pos.topPct / 100);

            // Emulate CSS object-fit: contain
            const imgRatio = img.width / img.height;
            const targetRatio = w / h;

            let drawWidth = w;
            let drawHeight = h;
            let drawX = x;
            let drawY = y;

            if (imgRatio > targetRatio) {
                // Image is wider than the target box: fit to width, center vertically
                drawHeight = w / imgRatio;
                drawY = y + (h - drawHeight) / 2;
            } else {
                // Image is taller than the target box: fit to height, center horizontally
                drawWidth = h * imgRatio;
                drawX = x + (w - drawWidth) / 2;
            }

            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        } catch (e) {
            console.error(`[imageComposer] Error drawing part ${part.key}:`, e);
        }
    }

    // Add Brickify branding logo at the bottom for virality!
    try {
        const logoImg = await loadImage('/logo.svg');
        const logoHeight = 22; // matching header height scale
        const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
        const logoX = (width - logoWidth) / 2;
        const logoY = height - 62;
        ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

        // Add small URL text below the logo using the web's Fredoka font
        ctx.fillStyle = '#94a3b8'; // slate-400 (subtle)
        ctx.font = '500 12px Fredoka, "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('https://brickify.fun', width / 2, height - 20);
    } catch (logoErr) {
        console.error('[imageComposer] Failed to draw logo, falling back to text:', logoErr);
        ctx.fillStyle = '#64748b'; // slate-500
        ctx.font = 'bold 16px Fredoka, "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BRICKIFY.FUN', width / 2, height - 30);
    }

    return canvas.toDataURL('image/png');
}

/**
 * Genera una imagen comparativa en formato horizontal de doble ancho (1200x1002)
 * con la foto original del usuario a la izquierda y el LEGO resultante a la derecha.
 * Incluye un fondo/marco de marca de agua estilizado en el pie central.
 */
export async function generateComparisonImage(
    userPhotoUrl: string,
    images: {
        wig?: string;
        head?: string;
        upperPart?: string;
        lowerPart?: string;
    },
    singleWidth = 600
): Promise<string> {
    const width = singleWidth * 2;
    const height = Math.round(singleWidth * 1.67);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context');

    // 1. Dibujar lado izquierdo: foto original del usuario con object-fit: cover
    ctx.fillStyle = '#f1f5f9'; // fondo slate-100 para la foto original
    ctx.fillRect(0, 0, singleWidth, height);
    try {
        const userImg = await loadImage(userPhotoUrl);
        const imgRatio = userImg.width / userImg.height;
        const targetRatio = singleWidth / height;
        
        let drawWidth = singleWidth;
        let drawHeight = height;
        let drawX = 0;
        let drawY = 0;

        if (imgRatio > targetRatio) {
            // La imagen es más ancha: escalar por alto y recortar los laterales
            drawWidth = height * imgRatio;
            drawX = (singleWidth - drawWidth) / 2;
        } else {
            // La imagen es más alta: escalar por ancho y recortar arriba/abajo
            drawHeight = singleWidth / imgRatio;
            drawY = (height - drawHeight) / 2;
        }
        ctx.drawImage(userImg, drawX, drawY, drawWidth, drawHeight);
    } catch (e) {
        console.error('[imageComposer] Error drawing user photo on comparison:', e);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(0, 0, singleWidth, height);
    }

    // 2. Dibujar lado derecho: la minifigura de LEGO (idéntico al generador individual pero desplazado en X)
    const grad = ctx.createLinearGradient(singleWidth, 0, singleWidth, height);
    grad.addColorStop(0, '#f8fafc'); // slate-50
    grad.addColorStop(1, '#e2e8f0'); // slate-200
    ctx.fillStyle = grad;
    ctx.fillRect(singleWidth, 0, singleWidth, height);

    // Círculo decorativo en el lado derecho
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(singleWidth + singleWidth / 2, height / 2 - 20, singleWidth * 0.35, 0, Math.PI * 2);
    ctx.stroke();

    const layout = {
        wig: { widthPct: 62, heightPct: 124, leftPct: 19, topPct: -19 },
        head: { widthPct: 29, heightPct: 29, leftPct: 35.5, topPct: 13.7 },
        upperPart: { widthPct: 70, heightPct: 70, leftPct: 15, topPct: 10 },
        lowerPart: { widthPct: 58, heightPct: 58, leftPct: 21.2, topPct: 35.5 },
    };

    const drawOrder: { key: keyof typeof layout; url?: string }[] = [
        { key: 'lowerPart', url: images.lowerPart },
        { key: 'upperPart', url: images.upperPart },
        { key: 'head', url: images.head },
        { key: 'wig', url: images.wig }
    ];

    for (const part of drawOrder) {
        if (!part.url) continue;
        try {
            const img = await loadImage(part.url);
            const pos = layout[part.key];
            const w = singleWidth * (pos.widthPct / 100);
            const h = height * (pos.heightPct / 100);
            const x = singleWidth + singleWidth * (pos.leftPct / 100);
            const y = height * (pos.topPct / 100);

            // Emulación de object-fit: contain
            const imgRatio = img.width / img.height;
            const targetRatio = w / h;

            let drawWidth = w;
            let drawHeight = h;
            let drawX = x;
            let drawY = y;

            if (imgRatio > targetRatio) {
                drawHeight = w / imgRatio;
                drawY = y + (h - drawHeight) / 2;
            } else {
                drawWidth = h * imgRatio;
                drawX = x + (w - drawWidth) / 2;
            }

            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        } catch (e) {
            console.error(`[imageComposer] Error drawing LEGO part ${part.key} on comparison:`, e);
        }
    }

    // 3. Dibujar separador central (línea blanca elegante)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(singleWidth, 0);
    ctx.lineTo(singleWidth, height);
    ctx.stroke();

    // 4. Marca de agua flotante en el centro inferior (con un pill blanco translúcido)
    try {
        const logoImg = await loadImage('/logo.svg');
        const logoHeight = 24;
        const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
        const logoX = (width - logoWidth) / 2;
        const logoY = height - 66;

        // Dibujar un pill/tarjeta blanca redondeada translúcida detrás de la marca de agua
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.05)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
        
        ctx.beginPath();
        // Caja de 240px de ancho y 62px de alto centrada
        ctx.roundRect((width - 240) / 2, height - 76, 240, 62, 16);
        ctx.fill();
        
        // Resetear sombras para dibujar logo y texto limpios
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

        ctx.fillStyle = '#64748b'; // slate-500
        ctx.font = '500 12px Fredoka, "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('https://brickify.fun', width / 2, height - 24);
    } catch (logoErr) {
        console.error('[imageComposer] Failed to draw comparison brand logo:', logoErr);
    }

    return canvas.toDataURL('image/png');
}
