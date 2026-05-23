import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTS_FILE = path.join(__dirname, "../src/data/products.ts");
const IMG_DIR = path.join(__dirname, "../public/images/products");

// Slugs extracted from Excel — now have .png files
const EXCEL_SLUGS = [
  "bat-chips", "wheel-chips", "onion-chips",
  "milagu", "marati-moku", "annachi-poo", "kirambu", "sukku",
  "ellaka", "munthri", "thirachai", "kasakasa", "karunjeeragam", "ommam",
  "vella-ellu", "karupu-ellu", "jeeragam", "soombu", "karupu-thirachai",
  "birayani-illai", "kalpasi", "kasuri-methi", "pattai", "jathi-pathri",
  "kadalai-mavu", "corn-flour-mavu", "arsi-mavu", "koola-mavu", "maida-mavu",
  "kothumai-mavu", "ragi-mavu", "rava", "kothumai-rava",
  "vella-avul", "red-avul", "getti-avul",
  "thuvaram-parupu", "paasi-parupu", "kadalai-parupu", "mysoor-parupu",
  "vada-parupu", "avarai-parupu", "karupu-ulunthu", "udacha-ulunthu",
  "urutu-ulunthu", "pottukallai", "mulu-pottukalai", "pacha-nilakadalai",
];

let content = fs.readFileSync(PRODUCTS_FILE, "utf8");
let updated = 0;

for (const slug of EXCEL_SLUGS) {
  const pngPath = `/images/products/${slug}.png`;
  const jpgPath = `/images/products/${slug}.jpg`;
  // Replace both imageUrl and images array
  const before = content;
  content = content
    .replaceAll(`imageUrl: "${jpgPath}"`, `imageUrl: "${pngPath}"`)
    .replaceAll(`images: ["${jpgPath}"]`, `images: ["${pngPath}"]`);
  if (content !== before) {
    updated++;
    process.stdout.write(`✓ ${slug}\n`);
  } else {
    // Might already be .png or have different path
    process.stdout.write(`- ${slug} (no change)\n`);
  }
}

fs.writeFileSync(PRODUCTS_FILE, content);
console.log(`\nUpdated ${updated} products to use Excel PNG images`);
