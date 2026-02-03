export type ReferencePersonEntry = {
    type?: string;
    name?: string;
    people?: ReferencePersonEntry[];
};

type SvgModel = {
    generate: (width: number, height: number, options?: {
        offsetX?: number;
        offsetY?: number;
        preserveAspect?: boolean
    }) => Array<{ x: number; y: number; t: number }>;
};

type EngraveOptions = {
    perRow?: number;
    rowsPerFile?: number;
    gapX?: number;
    gapY?: number;
    svgUrls?: string[];
    curveSamples?: number;
    textFontSize?: number;
    textScale?: number;
    groupLineGap?: number;
    groupSecondLayer?: number | null;
    textCharWidthFactor?: number;
    textYShiftFactor?: number;
    mirrorSvgX?: boolean;
    backNames?: string;
    backDate?: string;
    backTextYOffset?: number;
};

function cloneJson<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
}

function collectGroupNames(group: ReferencePersonEntry): string[] {
    if (!group || !Array.isArray(group.people)) return [];
    return group.people
        .map((person) => (person && typeof person.name === 'string' ? person.name.trim() : ''))
        .filter((name) => name.length > 0);
}

function normalizeReferencePeople(entries: ReferencePersonEntry[]): Array<ReferencePersonEntry & {
    groupNames?: string[]
}> {
    if (!Array.isArray(entries)) return [];
    const out: Array<ReferencePersonEntry & { groupNames?: string[] }> = [];
    for (const entry of entries) {
        if (!entry) continue;
        if (entry.type === 'group') {
            const names = collectGroupNames(entry);
            out.push({type: 'group', name: entry.name || '', groupNames: names});
            continue;
        }
        out.push(entry);
    }
    return out;
}

function computeBounds(items: any[]) {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const item of items) {
        if (!item) continue;
        const x = typeof item.x === 'number' ? item.x : 0;
        const y = typeof item.y === 'number' ? item.y : 0;
        const w = typeof item.width === 'number' ? item.width : 0;
        const h = typeof item.height === 'number' ? item.height : 0;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
    }

    if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
        return {width: 0, height: 0};
    }

    return {width: maxX - minX, height: maxY - minY};
}

function applyOffset(item: any, offsetX: number, offsetY: number) {
    if (typeof item.x === 'number') item.x += offsetX;
    if (typeof item.y === 'number') item.y += offsetY;
}

function isSvgMarkup(value: string) {
    return typeof value === 'string' && value.includes('<svg');
}

async function loadSvgSource(source: string) {
    if (!source) throw new Error('SVG source is required');
    if (isSvgMarkup(source)) return source;
    const res = await fetch(source);
    if (!res.ok) {
        throw new Error(`Failed to fetch SVG: ${res.status} ${res.statusText}`);
    }
    return await res.text();
}

function extractPathData(svgText: string) {
    const out: string[] = [];
    const regex = /<path[^>]*\sd=["']([^"']+)["'][^>]*>/gi;
    let match = regex.exec(svgText);
    while (match) {
        out.push(match[1]);
        match = regex.exec(svgText);
    }
    if (out.length === 0) {
        throw new Error('No <path d="..."> found in SVG');
    }
    return out;
}

function tokenizePathData(d: string) {
    return d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?/g) || [];
}

function cubicAt(p0: number, p1: number, p2: number, p3: number, t: number) {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;
    return (mt2 * mt * p0) + (3 * mt2 * t * p1) + (3 * mt * t2 * p2) + (t2 * t * p3);
}

function quadAt(p0: number, p1: number, p2: number, t: number) {
    const mt = 1 - t;
    return (mt * mt * p0) + (2 * mt * t * p1) + (t * t * p2);
}

function parsePathToPoints(d: string, options: { curveSamples?: number } = {}) {
    const tokens = tokenizePathData(d);
    const points: Array<{ x: number; y: number; t: number }> = [];
    const curveSamples = Number.isInteger(options.curveSamples) && options.curveSamples > 0 ? options.curveSamples : 24;

    let i = 0;
    let cmd: string | null = null;
    let currX = 0;
    let currY = 0;
    let startX = 0;
    let startY = 0;
    let lastCmd: string | null = null;
    let lastControlX: number | null = null;
    let lastControlY: number | null = null;
    let lastQuadX: number | null = null;
    let lastQuadY: number | null = null;

    function readNumber() {
        if (i >= tokens.length) throw new Error('Unexpected end of path data');
        return parseFloat(tokens[i++]);
    }

    function addMove(x: number, y: number) {
        points.push({x, y, t: 0});
    }

    function addLine(x: number, y: number) {
        points.push({x, y, t: 1});
    }

    function addCubic(p1x: number, p1y: number, p2x: number, p2y: number, x: number, y: number) {
        for (let step = 1; step <= curveSamples; step++) {
            const t = step / curveSamples;
            const px = cubicAt(currX, p1x, p2x, x, t);
            const py = cubicAt(currY, p1y, p2y, y, t);
            points.push({x: px, y: py, t: 1});
        }
    }

    function addQuad(p1x: number, p1y: number, x: number, y: number) {
        for (let step = 1; step <= curveSamples; step++) {
            const t = step / curveSamples;
            const px = quadAt(currX, p1x, x, t);
            const py = quadAt(currY, p1y, y, t);
            points.push({x: px, y: py, t: 1});
        }
    }

    while (i < tokens.length) {
        const token = tokens[i];
        if (/[a-zA-Z]/.test(token)) {
            cmd = token;
            i++;
        } else if (!cmd) {
            throw new Error('Path data missing command');
        }

        switch (cmd) {
            case 'M':
            case 'm': {
                const isRel = cmd === 'm';
                const x = readNumber();
                const y = readNumber();
                currX = isRel ? currX + x : x;
                currY = isRel ? currY + y : y;
                startX = currX;
                startY = currY;
                addMove(currX, currY);
                lastControlX = null;
                lastControlY = null;
                lastQuadX = null;
                lastQuadY = null;
                while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i])) {
                    const lx = readNumber();
                    const ly = readNumber();
                    currX = isRel ? currX + lx : lx;
                    currY = isRel ? currY + ly : ly;
                    addLine(currX, currY);
                    lastControlX = null;
                    lastControlY = null;
                    lastQuadX = null;
                    lastQuadY = null;
                }
                lastCmd = cmd;
                break;
            }
            case 'L':
            case 'l': {
                const isRel = cmd === 'l';
                while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i])) {
                    const x = readNumber();
                    const y = readNumber();
                    currX = isRel ? currX + x : x;
                    currY = isRel ? currY + y : y;
                    addLine(currX, currY);
                }
                lastControlX = null;
                lastControlY = null;
                lastQuadX = null;
                lastQuadY = null;
                lastCmd = cmd;
                break;
            }
            case 'H':
            case 'h': {
                const isRel = cmd === 'h';
                while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i])) {
                    const x = readNumber();
                    currX = isRel ? currX + x : x;
                    addLine(currX, currY);
                }
                lastControlX = null;
                lastControlY = null;
                lastQuadX = null;
                lastQuadY = null;
                lastCmd = cmd;
                break;
            }
            case 'V':
            case 'v': {
                const isRel = cmd === 'v';
                while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i])) {
                    const y = readNumber();
                    currY = isRel ? currY + y : y;
                    addLine(currX, currY);
                }
                lastControlX = null;
                lastControlY = null;
                lastQuadX = null;
                lastQuadY = null;
                lastCmd = cmd;
                break;
            }
            case 'C':
            case 'c': {
                const isRel = cmd === 'c';
                while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i])) {
                    const x1 = readNumber();
                    const y1 = readNumber();
                    const x2 = readNumber();
                    const y2 = readNumber();
                    const x = readNumber();
                    const y = readNumber();
                    const p1x = isRel ? currX + x1 : x1;
                    const p1y = isRel ? currY + y1 : y1;
                    const p2x = isRel ? currX + x2 : x2;
                    const p2y = isRel ? currY + y2 : y2;
                    const ex = isRel ? currX + x : x;
                    const ey = isRel ? currY + y : y;
                    addCubic(p1x, p1y, p2x, p2y, ex, ey);
                    currX = ex;
                    currY = ey;
                    lastControlX = p2x;
                    lastControlY = p2y;
                    lastQuadX = null;
                    lastQuadY = null;
                }
                lastCmd = cmd;
                break;
            }
            case 'S':
            case 's': {
                const isRel = cmd === 's';
                while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i])) {
                    const x2 = readNumber();
                    const y2 = readNumber();
                    const x = readNumber();
                    const y = readNumber();
                    let p1x = currX;
                    let p1y = currY;
                    if (lastCmd && (lastCmd === 'C' || lastCmd === 'c' || lastCmd === 'S' || lastCmd === 's')) {
                        if (typeof lastControlX === 'number' && typeof lastControlY === 'number') {
                            p1x = currX + (currX - lastControlX);
                            p1y = currY + (currY - lastControlY);
                        }
                    }
                    const p2x = isRel ? currX + x2 : x2;
                    const p2y = isRel ? currY + y2 : y2;
                    const ex = isRel ? currX + x : x;
                    const ey = isRel ? currY + y : y;
                    addCubic(p1x, p1y, p2x, p2y, ex, ey);
                    currX = ex;
                    currY = ey;
                    lastControlX = p2x;
                    lastControlY = p2y;
                    lastQuadX = null;
                    lastQuadY = null;
                }
                lastCmd = cmd;
                break;
            }
            case 'Q':
            case 'q': {
                const isRel = cmd === 'q';
                while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i])) {
                    const x1 = readNumber();
                    const y1 = readNumber();
                    const x = readNumber();
                    const y = readNumber();
                    const p1x = isRel ? currX + x1 : x1;
                    const p1y = isRel ? currY + y1 : y1;
                    const ex = isRel ? currX + x : x;
                    const ey = isRel ? currY + y : y;
                    addQuad(p1x, p1y, ex, ey);
                    currX = ex;
                    currY = ey;
                    lastQuadX = p1x;
                    lastQuadY = p1y;
                    lastControlX = null;
                    lastControlY = null;
                }
                lastCmd = cmd;
                break;
            }
            case 'T':
            case 't': {
                const isRel = cmd === 't';
                while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i])) {
                    const x = readNumber();
                    const y = readNumber();
                    let p1x = currX;
                    let p1y = currY;
                    if (lastCmd && (lastCmd === 'Q' || lastCmd === 'q' || lastCmd === 'T' || lastCmd === 't')) {
                        if (typeof lastQuadX === 'number' && typeof lastQuadY === 'number') {
                            p1x = currX + (currX - lastQuadX);
                            p1y = currY + (currY - lastQuadY);
                        }
                    }
                    const ex = isRel ? currX + x : x;
                    const ey = isRel ? currY + y : y;
                    addQuad(p1x, p1y, ex, ey);
                    currX = ex;
                    currY = ey;
                    lastQuadX = p1x;
                    lastQuadY = p1y;
                    lastControlX = null;
                    lastControlY = null;
                }
                lastCmd = cmd;
                break;
            }
            case 'A':
            case 'a': {
                const isRel = cmd === 'a';
                while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i])) {
                    readNumber();
                    readNumber();
                    readNumber();
                    readNumber();
                    readNumber();
                    const x = readNumber();
                    const y = readNumber();
                    currX = isRel ? currX + x : x;
                    currY = isRel ? currY + y : y;
                    addLine(currX, currY);
                    lastControlX = null;
                    lastControlY = null;
                    lastQuadX = null;
                    lastQuadY = null;
                }
                lastCmd = cmd;
                break;
            }
            case 'Z':
            case 'z':
                currX = startX;
                currY = startY;
                addLine(currX, currY);
                lastControlX = null;
                lastControlY = null;
                lastQuadX = null;
                lastQuadY = null;
                lastCmd = cmd;
                break;
            default:
                throw new Error(`Unsupported path command: ${cmd}`);
        }
    }

    return points;
}

function createSvgModel(points: Array<{ x: number; y: number; t: number }>): SvgModel {
    if (!Array.isArray(points) || points.length === 0) {
        throw new Error('SVG path points required');
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    }
    const width = (maxX - minX) || 1;
    const height = (maxY - minY) || 1;

    function generate(targetWidth: number, targetHeight: number, options: {
        offsetX?: number;
        offsetY?: number;
        preserveAspect?: boolean
    } = {}) {
        if (typeof targetWidth !== 'number' || typeof targetHeight !== 'number') {
            throw new Error('targetWidth and targetHeight must be numbers');
        }
        const {offsetX = 0, offsetY = 0, preserveAspect = true} = options;
        let scaleX = targetWidth / width;
        let scaleY = targetHeight / height;
        if (preserveAspect) {
            const scale = Math.min(scaleX, scaleY);
            scaleX = scale;
            scaleY = scale;
        }
        const usedW = width * scaleX;
        const usedH = height * scaleY;
        const translateX = offsetX + (targetWidth - usedW) / 2;
        const translateY = offsetY + (targetHeight - usedH) / 2;

        return points.map((p) => ({
            x: (p.x - minX) * scaleX + translateX,
            y: (p.y - minY) * scaleY + translateY,
            t: p.t
        }));
    }

    return {generate};
}

function getTextWidth(text: string, font: string) {
    const canvas = (getTextWidth as any).canvas || ((getTextWidth as any).canvas = document.createElement('canvas'));
    const context = canvas.getContext('2d');
    if (!context) return 0;
    context.font = font;
    const metrics = context.measureText(text);
    const px = metrics.width;
    const mmPerPx = 25.4 / 72;
    return px * mmPerPx;
}

function getTextHeight(text: string, font: string) {
    const canvas = (getTextHeight as any).canvas || ((getTextHeight as any).canvas = document.createElement('canvas'));
    const context = canvas.getContext('2d');
    if (!context) return 0;
    context.font = font;
    const metrics = context.measureText(text);
    const px = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    const mmPerPx = 25.4 / 72;
    return px * mmPerPx;
}


function estimateTextWidth(text: string, fontSize: number, factor: number) {
    if (typeof text !== 'string' || text.length === 0) return 0;
    const family = 'Yu Gothic UI';
    return getTextWidth(text, `${fontSize}px "${family}"`);
}

function estimateTextHeight(text: string, fontSize: number, factor: number) {
    if (typeof text !== 'string' || text.length === 0) return 0;
    const family = 'Yu Gothic UI';
    return getTextHeight(text, `${fontSize}px "${family}"`);
}

function positionSingleLineText(item: any, box: {
    x: number;
    y: number;
    width: number;
    height: number
}, fontSize: number, factor: number) {
    if (!item || !box) return;
    const centerX = box.x + (box.width / 2);
    const centerY = box.y + (box.height / 2);
    const textWidth = estimateTextWidth(item.text || '', fontSize, factor);
    const textHeight = estimateTextHeight(item.text || '', fontSize, factor);
    const baselineOffset = 0;
    if (textWidth > 0) {
        item.width = textWidth;
    }
    if (textHeight > 0) {
        item.height = textHeight;
    }
    item.x = centerX - (textWidth / 2);
    item.y = centerY + baselineOffset + 5 - textHeight;
}

function positionGroupLines(firstItem: any, secondItem: any, box: {
    x: number;
    y: number;
    width: number;
    height: number
}, fontSize: number, factor: number, lineGap: number) {
    if (!firstItem || !secondItem || !box) return;
    const centerX = box.x + (box.width / 2);
    const centerY = box.y + (box.height / 2);
    const gap = typeof lineGap === 'number' ? lineGap : (fontSize * 0.6);
    const baselineOffset = 0;
    const lineSpacing = gap;
    const firstWidth = estimateTextWidth(firstItem.text || '', fontSize, factor);
    const secondWidth = estimateTextWidth(secondItem.text || '', fontSize, factor);
    const firstHeight = estimateTextHeight(firstItem.text || '', fontSize, factor);
    const secondHeight = estimateTextHeight(secondItem.text || '', fontSize, factor);
    if (firstWidth > 0) {
        firstItem.width = firstWidth;
    }
    if (secondWidth > 0) {
        secondItem.width = secondWidth;
    }
    firstItem.x = centerX - (firstWidth / 2);
    secondItem.x = centerX - (secondWidth / 2);
    firstItem.y = centerY + baselineOffset + 5 - firstHeight;
    secondItem.y = firstItem.y - lineSpacing + 5 - secondHeight;

}

function computePathBounds(pathArray: Array<{ x: number; y: number }>) {
    if (!Array.isArray(pathArray) || pathArray.length === 0) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of pathArray) {
        if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') continue;
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    }
    if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;
    return {x: minX, y: minY, width: maxX - minX, height: maxY - minY};
}

function getTextBoxForPerson(baseItems: any[], svgModels: SvgModel[], refIndex: number, offsetX: number, offsetY: number) {
    const refItem = cloneJson(baseItems[refIndex] || baseItems[0]);
    applyOffset(refItem, offsetX, offsetY);
    const svgModel = svgModels[refIndex];
    if (svgModel && typeof refItem.width === 'number' && typeof refItem.height === 'number') {
        const pathArray = svgModel.generate(refItem.width, refItem.height, {
            offsetX: refItem.x || 0,
            offsetY: refItem.y || 0,
            preserveAspect: true
        });
        const bounds = computePathBounds(pathArray);
        if (bounds) return bounds;
    }
    return {
        x: typeof refItem.x === 'number' ? refItem.x : 0,
        y: typeof refItem.y === 'number' ? refItem.y : 0,
        width: typeof refItem.width === 'number' ? refItem.width : 0,
        height: typeof refItem.height === 'number' ? refItem.height : 0
    };
}

export async function buildEngraveFile(referencePeople: ReferencePersonEntry[], referenceJson: any, options: EngraveOptions = {}) {
    if (!referenceJson || typeof referenceJson !== 'object') {
        throw new Error('buildEngraveFile requires a reference JSON object');
    }
    if (!Array.isArray(referenceJson.items) || referenceJson.items.length < 3) {
        throw new Error('referenceJson.items must include at least 3 template items');
    }
    if (!Array.isArray(referenceJson.layers)) {
        throw new Error('referenceJson.layers must be an array');
    }

    const baseItems = referenceJson.items.slice(0, 3);
    const people = normalizeReferencePeople(referencePeople);
    const perRow = Number.isInteger(options.perRow) && options.perRow > 0 ? options.perRow : 1;
    const gapX = typeof options.gapX === 'number' ? options.gapX : 10;
    const gapY = typeof options.gapY === 'number' ? options.gapY : 10;
    const bounds = computeBounds(baseItems);
    const textFontSize = typeof options.textFontSize === 'number' ? options.textFontSize : 21;
    const textScale = typeof options.textScale === 'number' ? options.textScale : 0.6;
    const groupLineGap = typeof options.groupLineGap === 'number' ? options.groupLineGap : (textFontSize * 0.3);
    const groupSecondLayer = typeof options.groupSecondLayer === 'number' ? options.groupSecondLayer : null;
    const textCharWidthFactor = typeof options.textCharWidthFactor === 'number' ? options.textCharWidthFactor : 0.166;
    const textTemplate = baseItems.find((item) => typeof item?.text === 'string');
    const textBaseHeight = 0;
    const svgUrls = Array.isArray(options.svgUrls) ? options.svgUrls : [];
    const svgModels: SvgModel[] = await Promise.all(svgUrls.map(async (source) => {
        const svgText = await loadSvgSource(source);
        const pathData = extractPathData(svgText);
        const points: Array<{ x: number; y: number; t: number }> = [];
        for (const d of pathData) {
            points.push(...parsePathToPoints(d, {curveSamples: options.curveSamples}));
        }
        return createSvgModel(points);
    }));
    const refItemIndex = Math.max(0, baseItems.findIndex((item) => typeof item.text !== 'string'));

    const items: any[] = [];
    for (let i = 0; i < people.length; i++) {
        const person = people[i];
        const row = Math.floor(i / perRow);
        const col = i % perRow;
        const offsetX = col * (bounds.width + gapX);
        const offsetY = row * (bounds.height + gapY);
        const isGroup = person && person.type === 'group' && Array.isArray((person as any).groupNames) && (person as any).groupNames.length >= 2;
        const textBox = getTextBoxForPerson(baseItems, svgModels, refItemIndex, offsetX, offsetY);

        for (let j = 0; j < baseItems.length; j++) {
            const templateItem = baseItems[j];
            const item = cloneJson(templateItem);
            item.id = (crypto?.randomUUID?.() || `${Math.random()}`).replace(/-/g, '');

            if (typeof item.text === 'string') {
                if (isGroup) {
                    const groupNames = (person as any).groupNames;
                    const firstText = `${groupNames[0]} &`;
                    const secondText = groupNames.slice(1).join(' & ');

                    item.width = 0;
                    item.height = textBaseHeight;
                    item.text = firstText;
                    if (typeof item.lastText === 'string') item.lastText = firstText;
                    if (typeof item.fontSize === 'number') item.fontSize = textFontSize;
                    if (typeof item.lastFontSize === 'number') item.lastFontSize = textFontSize;
                    if (typeof item.initFontSize === 'number') item.initFontSize = textFontSize;

                    const secondItem = cloneJson(templateItem);
                    secondItem.id = (crypto?.randomUUID?.() || `${Math.random()}`).replace(/-/g, '');
                    if (groupSecondLayer != null) {
                        secondItem.layer = groupSecondLayer;
                    }
                    secondItem.width = 0;
                    secondItem.height = textBaseHeight;
                    secondItem.text = secondText;
                    if (typeof secondItem.lastText === 'string') secondItem.lastText = secondText;
                    if (typeof secondItem.fontSize === 'number') secondItem.fontSize = textFontSize;
                    if (typeof secondItem.lastFontSize === 'number') secondItem.lastFontSize = textFontSize;
                    if (typeof secondItem.initFontSize === 'number') secondItem.initFontSize = textFontSize;

                    positionGroupLines(item, secondItem, textBox, textFontSize, textCharWidthFactor, groupLineGap);
                    items.push(item, secondItem);
                    continue;
                }

                const name = person && typeof person.name === 'string' ? person.name : '';
                item.width = 0;
                item.height = textBaseHeight;
                item.text = name;
                if (typeof item.lastText === 'string') item.lastText = name;
                if (typeof item.fontSize === 'number') item.fontSize = textFontSize;
                if (typeof item.lastFontSize === 'number') item.lastFontSize = textFontSize;
                if (typeof item.initFontSize === 'number') item.initFontSize = textFontSize;
            }

            applyOffset(item, offsetX, offsetY);
            if (typeof item.text === 'string') {
                positionSingleLineText(item, textBox, textFontSize, textCharWidthFactor);
            }
            if (svgModels[j] && typeof item.width === 'number' && typeof item.height === 'number') {
                item.pathArray = svgModels[j].generate(item.width, item.height, {
                    offsetX: item.x || 0,
                    offsetY: item.y || 0,
                    preserveAspect: true
                });
            }
            items.push(item);
        }
    }

    const result = cloneJson(referenceJson);
    result.layers = cloneJson(referenceJson.layers);
    result.items = items;
    console.log(result);
    return result;
}

export async function buildEngraveFiles(referencePeople: ReferencePersonEntry[], referenceJson: any, options: EngraveOptions = {}) {
    const perRow = Number.isInteger(options.perRow) && options.perRow > 0 ? options.perRow : 1;
    const rowsPerFile = Number.isInteger(options.rowsPerFile) && options.rowsPerFile > 0 ? options.rowsPerFile : 1;
    const pageSize = perRow * rowsPerFile;
    const out: any[] = [];
    for (let i = 0; i < referencePeople.length; i += pageSize) {
        const chunk = referencePeople.slice(i, i + pageSize);
        const file = await buildEngraveFile(chunk, referenceJson, options);
        out.push(file);
    }
    return out;
}

export async function buildEngraveBackFiles(referencePeople: ReferencePersonEntry[], referenceJson: any, options: EngraveOptions = {}) {
    const perRow = Number.isInteger(options.perRow) && options.perRow > 0 ? options.perRow : 1;
    const rowsPerFile = Number.isInteger(options.rowsPerFile) && options.rowsPerFile > 0 ? options.rowsPerFile : 1;
    const pageSize = perRow * rowsPerFile;
    const people = normalizeReferencePeople(referencePeople);
    const baseItems = referenceJson.items.slice(0, 3);
    const bounds = computeBounds(baseItems);
    const nameFontSize = 14;
    const dateFontSize = 10;
    const groupLineGap = typeof options.groupLineGap === 'number' ? options.groupLineGap : (nameFontSize * 0.3);
    const textCharWidthFactor = typeof options.textCharWidthFactor === 'number' ? options.textCharWidthFactor : 0.166;
    const textYShiftFactor = typeof options.textYShiftFactor === 'number' ? options.textYShiftFactor : 0.02;
    const backTextYOffset = typeof options.backTextYOffset === 'number' ? options.backTextYOffset : 0;
    const names = options.backNames || '';
    const date = options.backDate || '';
    const svgUrls = Array.isArray(options.svgUrls) ? options.svgUrls : [];
    const svgModels: SvgModel[] = await Promise.all(svgUrls.map(async (source) => {
        const svgText = await loadSvgSource(source);
        const pathData = extractPathData(svgText);
        const points: Array<{ x: number; y: number; t: number }> = [];
        for (const d of pathData) {
            points.push(...parsePathToPoints(d, {curveSamples: options.curveSamples}));
        }
        return createSvgModel(points);
    }));
    const refItemIndex = Math.max(0, baseItems.findIndex((item) => typeof item.text !== 'string'));
    const textTemplate = baseItems.find((item) => typeof item?.text === 'string');

    const out: any[] = [];
    for (let i = 0; i < people.length; i += pageSize) {
        const chunk = people.slice(i, i + pageSize);
        const items: any[] = [];

        for (let idx = 0; idx < chunk.length; idx++) {
            const row = Math.floor(idx / perRow);
            const col = idx % perRow;
            const offsetX = col * (bounds.width + (options.gapX ?? 10));
            const offsetY = row * (bounds.height + (options.gapY ?? 10));
            const textBox = getTextBoxForPerson(baseItems, svgModels, refItemIndex, offsetX, offsetY);

            for (let j = 0; j < baseItems.length; j++) {
                const templateItem = baseItems[j];
                if (typeof templateItem.text === 'string') continue;
                if (templateItem.layer === 17) continue;
                const item = cloneJson(templateItem);
                item.id = (crypto?.randomUUID?.() || `${Math.random()}`).replace(/-/g, '');
                applyOffset(item, offsetX, offsetY);
                if (svgModels[j] && typeof item.width === 'number' && typeof item.height === 'number') {
                    item.pathArray = svgModels[j].generate(item.width, item.height, {
                        offsetX: item.x || 0,
                        offsetY: item.y || 0,
                        preserveAspect: true,
                        mirrorX: true
                    });
                }
                items.push(item);
            }

            if (textTemplate) {
                const textItem = cloneJson(textTemplate);
                const secondItem = cloneJson(textTemplate);
                textItem.id = (crypto?.randomUUID?.() || `${Math.random()}`).replace(/-/g, '');
                secondItem.id = (crypto?.randomUUID?.() || `${Math.random()}`).replace(/-/g, '');
                textItem.text = names;
                secondItem.text = date;
                if (typeof textItem.fontSize === 'number') textItem.fontSize = nameFontSize;
                if (typeof textItem.lastFontSize === 'number') textItem.lastFontSize = nameFontSize;
                if (typeof textItem.initFontSize === 'number') textItem.initFontSize = nameFontSize;
                if (typeof secondItem.fontSize === 'number') secondItem.fontSize = dateFontSize;
                if (typeof secondItem.lastFontSize === 'number') secondItem.lastFontSize = dateFontSize;
                if (typeof secondItem.initFontSize === 'number') secondItem.initFontSize = dateFontSize;
                textItem.width = 0;
                textItem.height = 0;
                secondItem.width = 0;
                secondItem.height = 0;
                positionGroupLines(textItem, secondItem, textBox, nameFontSize, textCharWidthFactor, groupLineGap, textYShiftFactor, 'below');
                textItem.y -= backTextYOffset;
                secondItem.y -= backTextYOffset;
                items.push(textItem, secondItem);
            }
        }

        const result = cloneJson(referenceJson);
        result.layers = cloneJson(referenceJson.layers).filter((layer: any) => layer.layerId !== 17);
        result.items = items;
        out.push(result);
    }

    return out;
}
