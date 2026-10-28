// Generates PWA / Apple icons from an inline SVG mark (Forest Green + Warm Ivory, §44.2).
// Run: npm run icons
import sharp from "sharp"
import { writeFile } from "node:fs/promises"

const leaf = (scale) => `
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <path d="M356 150c-118 0-196 66-196 168 0 22 4 40 10 54 18-58 62-108 128-138-52 36-88 86-104 150 14 6 30 8 48 8 102 0 160-92 114-242z" fill="#FAF8F2"/>
  </g>`

const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#244C3A"/>${leaf(1)}</svg>`
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#244C3A"/>${leaf(0.78)}</svg>`
const square = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#244C3A"/>${leaf(0.9)}</svg>`

const out = [
  [rounded, 192, "public/icons/icon-192.png"],
  [rounded, 512, "public/icons/icon-512.png"],
  [maskable, 512, "public/icons/maskable-512.png"],
  [square, 180, "src/app/apple-icon.png"],
]
for (const [svg, size, file] of out) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(file)
}
await writeFile("src/app/icon.svg", rounded)
console.log("icons written")
