import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT = join(process.cwd(), "public", "icons");

const DEEP = "#0C0A09";
const GOLD = "#CA8A04";
const CREAM = "#FAFAF9";

function svgIcon(size: number, opts: { rounded?: boolean } = {}): string {
  const radius = opts.rounded ? Math.round(size * 0.22) : 0;
  const fontPlay = "Georgia, 'Times New Roman', serif";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1C1917"/>
      <stop offset="100%" stop-color="${DEEP}"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E0A917"/>
      <stop offset="100%" stop-color="${GOLD}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${(radius * 512) / size}" fill="url(#bg)"/>
  <rect x="40" y="40" width="432" height="432" rx="${Math.max(0, (radius * 512) / size - 28)}" fill="none" stroke="${GOLD}" stroke-opacity="0.35" stroke-width="2"/>
  <text x="256" y="200" text-anchor="middle" font-family="${fontPlay}" font-size="56" font-weight="700" fill="${GOLD}" letter-spacing="8">EST. 1876</text>
  <line x1="190" y1="232" x2="322" y2="232" stroke="${GOLD}" stroke-width="3"/>
  <text x="256" y="340" text-anchor="middle" font-family="${fontPlay}" font-size="180" font-weight="700" fill="url(#gold)" letter-spacing="-4">B&amp;O</text>
  <text x="256" y="404" text-anchor="middle" font-family="${fontPlay}" font-size="34" font-style="italic" fill="${CREAM}" fill-opacity="0.7" letter-spacing="6">BOURBON</text>
  <text x="256" y="448" text-anchor="middle" font-family="${fontPlay}" font-size="26" fill="${GOLD}" letter-spacing="6">OAK LOVER</text>
</svg>`;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const svgMaster = svgIcon(512);
  await writeFile(join(OUT, "icon.svg"), svgMaster);

  const tasks: Array<Promise<unknown>> = [];

  // Standard PWA icons (square)
  for (const size of [192, 384, 512]) {
    tasks.push(
      sharp(Buffer.from(svgMaster))
        .resize(size, size)
        .png({ compressionLevel: 9 })
        .toFile(join(OUT, `icon-${size}.png`))
    );
  }

  // Maskable (full-bleed safe — rounded by OS)
  tasks.push(
    sharp(Buffer.from(svgMaster))
      .resize(512, 512)
      .png({ compressionLevel: 9 })
      .toFile(join(OUT, "icon-maskable-512.png"))
  );

  // Apple touch icon (180x180, no transparency)
  tasks.push(
    sharp(Buffer.from(svgMaster))
      .resize(180, 180)
      .png({ compressionLevel: 9 })
      .toFile(join(OUT, "apple-touch-icon.png"))
  );

  // Favicon (32x32)
  tasks.push(
    sharp(Buffer.from(svgMaster))
      .resize(32, 32)
      .png({ compressionLevel: 9 })
      .toFile(join(OUT, "favicon-32.png"))
  );

  await Promise.all(tasks);
  console.log("[generate-icons] ✓ wrote", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
