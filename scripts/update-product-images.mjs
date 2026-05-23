import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTS_FILE = path.join(__dirname, "../src/data/products.ts");
const IMG_DIR = path.join(__dirname, "../public/images/products");

let content = fs.readFileSync(PRODUCTS_FILE, "utf8");

// Get all downloaded slugs
const available = new Set(
  fs.readdirSync(IMG_DIR)
    .filter(f => f.endsWith(".jpg"))
    .map(f => f.replace(".jpg", ""))
);

// Replace imageUrl and images array for each product
// Pattern: find slug then update the imageUrl/images fields
let updated = 0;

content = content.replace(
  /slug: "([^"]+)",\s*\n(\s*)name: "[^"]+",\s*\n(\s*)imageUrl: "[^"]+",\s*\n(\s*)images: \["[^"]*"\],/g,
  (match, slug, sp2, sp3, sp4) => {
    if (available.has(slug)) {
      updated++;
      const imgPath = `/images/products/${slug}.jpg`;
      return `slug: "${slug}",\n${sp2}name: "${match.match(/name: "([^"]+)"/)[1]}",\n${sp3}imageUrl: "${imgPath}",\n${sp4}images: ["${imgPath}"],`;
    }
    return match;
  }
);

fs.writeFileSync(PRODUCTS_FILE, content);
console.log(`Updated ${updated} products to use local images`);
