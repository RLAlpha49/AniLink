/**
 * Build-time generator for the provider/section-branded social cards.
 *
 * Run: `npx tsx scripts/generate-social-cards.ts` (or `npm run docs:social-cards`).
 *
 * Writes one 1200x630 PNG per route context that `transformHead` in
 * `docs-src/.vitepress/config.mts` selects an image for: AniList,
 * MyAnimeList, and the operation reference. The default `social-card.png` is
 * a designed asset and is intentionally left alone. `transformHead` picks
 * the file per route context, so each share preview is branded for the
 * surface it links to.
 *
 * Cards are encoded with Node's built-in zlib alone — no image dependencies.
 * Every pixel comes from fixed brand colors and pure arithmetic, and the
 * package logo is rasterized from its vector source (`docs-src/public/
 * logo.svg`) at the exact target size with anti-aliasing, so the same script
 * always produces the same bytes; files are rewritten only when their
 * content changes so rebuilds do not churn git.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { deflateSync } from "node:zlib";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const OUT_DIR = join(ROOT, "docs-src", "public");

const WIDTH = 1200;
const HEIGHT = 630;

/** Card background, matching the site theme color (#0b1220). */
const BG_TOP: Rgb = [11, 18, 32];
const BG_BOTTOM: Rgb = [19, 28, 46];

/**
 * Diagonal geometry in `x + y` space: the brand fill starts at SPLIT (with a
 * soft edge) and the accent stripe runs just before it, both spanning the
 * card from the top edge to the left edge.
 */
const SPLIT = 1150;
const STRIPE_START = 1085;
const STRIPE_END = 1105;

/**
 * Logo placement: the package mark is rasterized from `docs-src/public/
 * logo.svg` at the exact target size and composited onto the dark gradient,
 * left of the brand diagonal. The region it occupies (x+y below the stripe)
 * stays clear of the diagonal fill on every card.
 */
const LOGO_FILE = "logo.svg";
const LOGO_SIZE = 320;
const LOGO_X = 110;
const LOGO_Y = Math.round((HEIGHT - LOGO_SIZE) / 2);

/** RGB triple, 0-255 per channel. */
type Rgb = [number, number, number];

/** One branded card: output file plus its brand colors. */
interface CardSpec {
    /** Output file name under `docs-src/public/`. */
    file: string;
    /** Brand fill for the diagonal region. */
    primary: Rgb;
    /** Accent stripe color. */
    secondary: Rgb;
}

const CARDS: CardSpec[] = [
    {
        file: "social-card-anilist.png",
        primary: [2, 169, 255], // AniList blue #02a9ff
        secondary: [255, 103, 64], // AniList pink #ff6740
    },
    {
        file: "social-card-mal.png",
        primary: [46, 81, 162], // MyAnimeList blue #2e51a2
        secondary: [122, 165, 224], // lighter MyAnimeList blue #7aa5e0
    },
    {
        file: "social-card-operations.png",
        primary: [139, 92, 246], // operations purple #8b5cf6
        secondary: [196, 181, 253], // light purple #c4b5fd
    },
];

/** CRC-32 (PNG chunk checksums), table-driven as in the PNG specification. */
const CRC_TABLE: Uint32Array = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? (0xedb88320 ^ (c >>> 1)) >>> 0 : c >>> 1;
        }
        table[n] = c;
    }
    return table;
})();

function crc32(data: Buffer): number {
    let c = 0xffffffff;
    for (const byte of data) {
        c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
}

/** One PNG chunk: length, type, data, CRC. */
function pngChunk(type: string, data: Buffer): Buffer {
    const chunk = Buffer.alloc(12 + data.length);
    chunk.writeUInt32BE(data.length, 0);
    chunk.write(type, 4, "ascii");
    data.copy(chunk, 8);
    chunk.writeUInt32BE(crc32(chunk.subarray(4, 8 + data.length)), 8 + data.length);
    return chunk;
}

/**
 * Encode raw scanlines (one filter byte 0 plus WIDTH*3 RGB bytes per row) as
 * a PNG. Fixed deflate options keep the output byte-stable.
 *
 * @returns The complete PNG file contents.
 */
function encodePng(width: number, height: number, scanlines: Buffer): Buffer {
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 2; // color type: truecolor RGB
    ihdr[10] = 0; // compression: deflate
    ihdr[11] = 0; // filter: adaptive
    ihdr[12] = 0; // interlace: none
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        pngChunk("IHDR", ihdr),
        pngChunk("IDAT", deflateSync(scanlines, { level: 9 })),
        pngChunk("IEND", Buffer.alloc(0)),
    ]);
}

function lerp(from: number, to: number, t: number): number {
    return Math.round(from + (to - from) * t);
}

/** Blend `fg` over `bg` by `t` (0-1). */
function mix(bg: Rgb, fg: Rgb, t: number): Rgb {
    return [lerp(bg[0], fg[0], t), lerp(bg[1], fg[1], t), lerp(bg[2], fg[2], t)];
}

/** Uniform `factor` brightness scaling. */
function shade(color: Rgb, factor: number): Rgb {
    return [
        Math.round(color[0] * factor),
        Math.round(color[1] * factor),
        Math.round(color[2] * factor),
    ];
}

/** 0 below edge0, 1 above edge1, smooth in between — soft card edges. */
function smoothstep(value: number, edge0: number, edge1: number): number {
    const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

/** An RGBA image: dimensions plus 4 bytes per pixel. */
interface RgbaImage {
    width: number;
    height: number;
    pixels: Buffer;
}

/** One point in the logo's viewBox coordinate space. */
type Point = [number, number];

/** Cubic-flattening steps per Bézier segment; 32 is smooth at card scale. */
const FLATTEN_STEPS = 32;

/** Supersampling grid per axis for path (polygon) coverage. */
const PATH_SS = 4;

/** The logo geometry parsed from `docs-src/public/logo.svg`. */
interface LogoSvg {
    /** Square viewBox side (the logo is drawn in a 64x64 space). */
    viewBox: number;
    /** Background tile: centered square rounded rectangle with its fill. */
    tile: { cx: number; cy: number; half: number; rx: number; fill: Rgb };
    /** The circle behind the mark. */
    circle: { cx: number; cy: number; r: number; fill: Rgb };
    /** Filled paths in draw order, flattened to polygons with their fills. */
    paths: { polygon: Point[]; bbox: [number, number, number, number]; fill: Rgb }[];
}

/** Read one `name="value"` attribute from an SVG tag as a number. */
function svgAttr(tag: string, name: string, fallback?: number): number {
    const match = tag.match(new RegExp(`\\b${name}="([^"]+)"`));
    if (match === null) {
        if (fallback === undefined) {
            throw new Error(`${LOGO_FILE}: missing ${name} attribute`);
        }
        return fallback;
    }
    return Number(match[1]);
}

/** Read one `fill="#rrggbb"` attribute from an SVG tag as an RGB triple. */
function svgFill(tag: string): Rgb {
    const match = tag.match(/\bfill="#([0-9a-fA-F]{6})"/);
    if (match === null) {
        throw new Error(`${LOGO_FILE}: missing fill="#rrggbb" attribute`);
    }
    return [
        parseInt(match[1].slice(0, 2), 16),
        parseInt(match[1].slice(2, 4), 16),
        parseInt(match[1].slice(4, 6), 16),
    ];
}

/**
 * Parse the package logo SVG. The logo uses a fixed grammar — a square
 * viewBox, one rounded-rect tile, one circle, and filled paths with M/C/Z
 * commands — so this parser covers exactly that and throws on anything
 * else, keeping `logo.svg` the single source of truth for the cards.
 *
 * @throws When the file deviates from the grammar the logo uses.
 * @returns The logo geometry with paths flattened to polygons.
 */
function parseLogoSvg(svg: string): LogoSvg {
    const viewBox = svg.match(
        /viewBox="(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)"/
    );
    if (viewBox === null) throw new Error(`${LOGO_FILE}: missing viewBox`);
    if (Number(viewBox[3]) !== Number(viewBox[4])) {
        throw new Error(`${LOGO_FILE}: only a square viewBox is supported`);
    }
    const rectTag = svg.match(/<rect\b[^>]*>/)?.[0];
    const circleTag = svg.match(/<circle\b[^>]*>/)?.[0];
    if (rectTag === undefined || circleTag === undefined) {
        throw new Error(`${LOGO_FILE}: expected one rect and one circle`);
    }
    const tileWidth = svgAttr(rectTag, "width");
    const tileHeight = svgAttr(rectTag, "height");
    if (tileWidth !== tileHeight) {
        throw new Error(`${LOGO_FILE}: only a square tile is supported`);
    }
    const tile = {
        cx: svgAttr(rectTag, "x", 0) + tileWidth / 2,
        cy: svgAttr(rectTag, "y", 0) + tileHeight / 2,
        half: tileWidth / 2,
        rx: svgAttr(rectTag, "rx"),
        fill: svgFill(rectTag),
    };
    const circle = {
        cx: svgAttr(circleTag, "cx"),
        cy: svgAttr(circleTag, "cy"),
        r: svgAttr(circleTag, "r"),
        fill: svgFill(circleTag),
    };
    const paths: LogoSvg["paths"] = [];
    const pathRe = /<path\b[^>]*>/g;
    let match: RegExpExecArray | null;
    while ((match = pathRe.exec(svg)) !== null) {
        const tag = match[0];
        const d = tag.match(/\bd="([^"]+)"/);
        if (d === null) throw new Error(`${LOGO_FILE}: path without d attribute`);
        const polygon = parsePathData(d[1]);
        paths.push({ polygon, bbox: polygonBbox(polygon), fill: svgFill(tag) });
    }
    if (paths.length === 0) throw new Error(`${LOGO_FILE}: no path elements`);
    return { viewBox: Number(viewBox[3]), tile, circle, paths };
}

/**
 * Parse one path's `d` attribute (M, C, Z commands only) and flatten the
 * cubic curves into a polygon.
 *
 * @throws On any command the logo grammar does not use.
 * @returns The flattened polygon in viewBox coordinates.
 */
function parsePathData(d: string): Point[] {
    const tokens = d.match(/[MCZ]|-?\d+(?:\.\d+)?/g) ?? [];
    const polygon: Point[] = [];
    let current: Point = [0, 0];
    let i = 0;
    while (i < tokens.length) {
        const token = tokens[i];
        if (token === "M") {
            current = [Number(tokens[i + 1]), Number(tokens[i + 2])];
            if (polygon.length === 0) polygon.push(current);
            i += 3;
        } else if (token === "C") {
            const c1: Point = [Number(tokens[i + 1]), Number(tokens[i + 2])];
            const c2: Point = [Number(tokens[i + 3]), Number(tokens[i + 4])];
            const to: Point = [Number(tokens[i + 5]), Number(tokens[i + 6])];
            flattenCubic(current, c1, c2, to, polygon);
            current = to;
            i += 7;
        } else if (token === "Z") {
            i += 1;
        } else {
            throw new Error(`${LOGO_FILE}: unsupported path command "${token}"`);
        }
    }
    return polygon;
}

/** Flatten one cubic Bézier onto `out` in fixed steps (endpoint included). */
function flattenCubic(from: Point, c1: Point, c2: Point, to: Point, out: Point[]): void {
    for (let step = 1; step <= FLATTEN_STEPS; step++) {
        const t = step / FLATTEN_STEPS;
        const mt = 1 - t;
        const a = mt * mt * mt;
        const b = 3 * mt * mt * t;
        const c = 3 * mt * t * t;
        const d = t * t * t;
        out.push([
            a * from[0] + b * c1[0] + c * c2[0] + d * to[0],
            a * from[1] + b * c1[1] + c * c2[1] + d * to[1],
        ]);
    }
}

/** Even-odd point-in-polygon test (ray casting). */
function pointInPolygon(polygon: Point[], x: number, y: number): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}

/** Bounding box of a polygon: [minX, minY, maxX, maxY]. */
function polygonBbox(polygon: Point[]): [number, number, number, number] {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [x, y] of polygon) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }
    return [minX, minY, maxX, maxY];
}

/** Clamp to the 0-1 range. */
function clamp01(value: number): number {
    return Math.min(1, Math.max(0, value));
}

/** Coverage of one pixel (corner in viewBox units) by a flattened path. */
function polygonCoverage(
    polygon: Point[],
    cornerX: number,
    cornerY: number,
    pixel: number
): number {
    let hits = 0;
    for (let sy = 0; sy < PATH_SS; sy++) {
        const y = cornerY + ((sy + 0.5) / PATH_SS) * pixel;
        for (let sx = 0; sx < PATH_SS; sx++) {
            if (pointInPolygon(polygon, cornerX + ((sx + 0.5) / PATH_SS) * pixel, y)) hits++;
        }
    }
    return hits / (PATH_SS * PATH_SS);
}

/**
 * Rasterize the package logo at `size`x`size`, anti-aliased: analytic
 * signed-distance coverage for the rounded tile and circle, supersampled
 * coverage for the Bézier paths. Rendering the vector source at the exact
 * target size keeps the mark crisp at any card scale — no upscaling.
 *
 * @returns The rendered RGBA logo.
 */
function renderLogo(size: number): RgbaImage {
    const logo = parseLogoSvg(readFileSync(join(OUT_DIR, LOGO_FILE), "utf-8"));
    const scale = size / logo.viewBox; // pixels per viewBox unit
    const pixel = 1 / scale; // viewBox units per pixel
    const pixels = Buffer.alloc(size * size * 4);
    for (let y = 0; y < size; y++) {
        const cornerY = y * pixel;
        for (let x = 0; x < size; x++) {
            const cornerX = x * pixel;
            const cx = cornerX + pixel / 2;
            const cy = cornerY + pixel / 2;
            // Rounded-tile signed distance (negative inside the tile).
            const qx = Math.abs(cx - logo.tile.cx) - (logo.tile.half - logo.tile.rx);
            const qy = Math.abs(cy - logo.tile.cy) - (logo.tile.half - logo.tile.rx);
            const tileD =
                Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
                Math.min(Math.max(qx, qy), 0) -
                logo.tile.rx;
            // Circle signed distance (negative inside the circle).
            const circleD = Math.hypot(cx - logo.circle.cx, cy - logo.circle.cy) - logo.circle.r;
            // Source-over composite in SVG draw order: tile, circle, paths.
            let r = 0;
            let g = 0;
            let b = 0;
            let a = 0;
            const over = (color: Rgb, coverage: number): void => {
                if (coverage <= 0) return;
                const outA = coverage + a * (1 - coverage);
                r = (color[0] * coverage + r * a * (1 - coverage)) / outA;
                g = (color[1] * coverage + g * a * (1 - coverage)) / outA;
                b = (color[2] * coverage + b * a * (1 - coverage)) / outA;
                a = outA;
            };
            over(logo.tile.fill, clamp01(0.5 - tileD * scale));
            over(logo.circle.fill, clamp01(0.5 - circleD * scale));
            for (const path of logo.paths) {
                const [minX, minY, maxX, maxY] = path.bbox;
                if (
                    cx < minX - pixel ||
                    cx > maxX + pixel ||
                    cy < minY - pixel ||
                    cy > maxY + pixel
                ) {
                    continue; // pixel lies outside the path's bounding box
                }
                over(path.fill, polygonCoverage(path.polygon, cornerX, cornerY, pixel));
            }
            const d = (y * size + x) * 4;
            pixels[d] = Math.round(r);
            pixels[d + 1] = Math.round(g);
            pixels[d + 2] = Math.round(b);
            pixels[d + 3] = Math.round(a * 255);
        }
    }
    return { width: size, height: size, pixels };
}

/**
 * Alpha-composite the rasterized logo onto the card scanlines
 * (source-over), writing RGB back into the scanline buffer in place.
 */
function compositeLogo(scanlines: Buffer, logo: RgbaImage): void {
    const stride = 1 + WIDTH * 3;
    for (let y = 0; y < logo.height; y++) {
        const cy = LOGO_Y + y;
        if (cy < 0 || cy >= HEIGHT) continue;
        const rowStart = cy * stride + 1;
        for (let x = 0; x < logo.width; x++) {
            const cx = LOGO_X + x;
            if (cx < 0 || cx >= WIDTH) continue;
            const s = (y * logo.width + x) * 4;
            const alpha = logo.pixels[s + 3] / 255;
            if (alpha <= 0) continue;
            const d = rowStart + cx * 3;
            for (let c = 0; c < 3; c++) {
                scanlines[d + c] = Math.round(
                    logo.pixels[s + c] * alpha + scanlines[d + c] * (1 - alpha)
                );
            }
        }
    }
}

/**
 * Render one card: a dark vertical gradient, a diagonal brand fill on the
 * upper right, a parallel accent stripe, and the package logo composited
 * onto the dark gradient on the left.
 *
 * @returns The complete PNG file contents.
 */
function renderCard(spec: CardSpec, logo: RgbaImage): Buffer {
    const scanlines = Buffer.alloc(HEIGHT * (1 + WIDTH * 3));
    const brandBottom = shade(spec.primary, 0.72);
    let offset = 0;
    for (let y = 0; y < HEIGHT; y++) {
        scanlines[offset++] = 0; // filter type: None
        const rowT = y / (HEIGHT - 1);
        for (let x = 0; x < WIDTH; x++) {
            const diagonal = x + y;
            let color = mix(BG_TOP, BG_BOTTOM, rowT);
            const fill = smoothstep(diagonal, SPLIT, SPLIT + 4);
            if (fill > 0) {
                color = mix(color, mix(spec.primary, brandBottom, rowT), fill);
            }
            const stripe =
                smoothstep(diagonal, STRIPE_START, STRIPE_START + 2) *
                (1 - smoothstep(diagonal, STRIPE_END - 2, STRIPE_END));
            if (stripe > 0) {
                color = mix(color, spec.secondary, stripe);
            }
            scanlines[offset++] = color[0];
            scanlines[offset++] = color[1];
            scanlines[offset++] = color[2];
        }
    }
    compositeLogo(scanlines, logo);
    return encodePng(WIDTH, HEIGHT, scanlines);
}

/**
 * Generate every branded card, rewriting only files whose bytes changed.
 *
 * @returns The files that were (re)written.
 */
export function generateSocialCards(): string[] {
    const written: string[] = [];
    const logo = renderLogo(LOGO_SIZE);
    for (const spec of CARDS) {
        const target = join(OUT_DIR, spec.file);
        const png = renderCard(spec, logo);
        let current: Buffer | undefined;
        try {
            current = readFileSync(target);
        } catch {
            // First run: the card does not exist yet.
        }
        if (current === undefined || !current.equals(png)) {
            writeFileSync(target, png);
            written.push(target);
        }
    }
    return written;
}

// CLI entry: `npx tsx scripts/generate-social-cards.ts`
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
    const written = generateSocialCards();
    if (written.length === 0) {
        console.log("Social cards already up to date in docs-src/public/");
    } else {
        for (const file of written) console.log(`Wrote ${file}`);
    }
}
