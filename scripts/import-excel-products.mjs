import XLSX from "xlsx";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXCEL = "/Users/pranesh/Downloads/Copy of vinayaga traders all products edit (1).xlsx";
const IMG_DIR = path.join(__dirname, "../public/images/products");
const OUT_FILE = path.join(__dirname, "../src/data/products.ts");

// ── Slug helpers ─────────────────────────────────────────────────────────────
function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/\(([^)]+)\)/g, "-$1") // (small) → -small
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Price/weight parsers ──────────────────────────────────────────────────────
function parseWeight(w) {
  w = w.toString().trim();
  // Normalize litres
  w = w.replace(/1\/2\s*lit(?:e(?:re?)?)?/gi, "500ml");
  w = w.replace(/(\d+)\s*lit(?:e(?:re?)?)?/gi, (_, n) => n === "1" ? "1L" : `${n}L`);
  // Normalize gram variants
  w = w.replace(/(\d+)\s*gr(?:am?)?s?/gi, "$1g");
  w = w.replace(/(\d+)\s*kg/gi, "$1kg");
  return w.trim();
}

function parseVariants(qtyCell, priceCell) {
  const qtyRaw = (qtyCell || "").toString().trim();
  const priceRaw = (priceCell || "").toString().trim();

  // Split on / (with optional spaces)
  const weights = qtyRaw.split(/\s*\/\s*/).map(parseWeight).filter(Boolean);
  // Parse prices: "19Rs/35rs" or "20 rs" or "195rs"
  const priceStrs = priceRaw.split(/\s*\/\s*/);
  const prices = priceStrs.map(p => {
    const m = p.match(/[\d.]+/);
    return m ? Math.round(parseFloat(m[0])) : null;
  }).filter(n => n !== null);

  const variants = [];
  const count = Math.max(weights.length, prices.length);
  for (let i = 0; i < count; i++) {
    const weight = weights[i] || weights[weights.length - 1] || "1 piece";
    const price = prices[i] ?? prices[prices.length - 1] ?? 0;
    variants.push({ weight, price });
  }
  return variants.length ? variants : [{ weight: "1 piece", price: 0 }];
}

// ── Category slug + name map ──────────────────────────────────────────────────
const CATEGORY_MAP = {
  "spice-powders": { name: "Spice Powders", slug: "spice-powders" },
  "pickel": { name: "Pickles", slug: "pickles" },
  "pickles": { name: "Pickles", slug: "pickles" },
  "dry chips": { name: "Dry Chips", slug: "dry-chips" },
  "spices": { name: "Whole Spices", slug: "whole-spices" },
  "flour": { name: "Flours", slug: "flours" },
  "pulses": { name: "Pulses & Dals", slug: "pulses" },
  "masala": { name: "Bulk Masalas", slug: "bulk-masalas" },
  "seeds": { name: "Seeds", slug: "seeds" },
  "oil": { name: "Oils", slug: "oils" },
  "soya": { name: "Soya Products", slug: "soya" },
  "millets": { name: "Millets", slug: "millets" },
  "sugar": { name: "Sugar & Jaggery", slug: "sugar" },
};

// ── Image assignments (slug → existing downloaded file or new Unsplash ID) ───
const IMAGE_OVERRIDES = {
  // Millets
  "ragi": "photo-1574323347407-f5e1ad6d020b",
  "kammu": "photo-1574323347407-f5e1ad6d020b",
  "solam": "photo-1574323347407-f5e1ad6d020b",
  "kuthirai-vale": "photo-1574323347407-f5e1ad6d020b",
  "samai": "photo-1574323347407-f5e1ad6d020b",
  "thinai": "photo-1574323347407-f5e1ad6d020b",
  "varagu": "photo-1574323347407-f5e1ad6d020b",
  // Sugar & Jaggery
  "sugar": "photo-1558618666-fcd25c85cd64",
  "nattu-sagarai": "photo-1558618666-fcd25c85cd64",
  "panam-kalkanndu": "photo-1558618666-fcd25c85cd64",
  "vellam": "photo-1558618666-fcd25c85cd64",
  "aachu-vellam": "photo-1558618666-fcd25c85cd64",
};

// Slug remaps (Excel name → existing downloaded slug)
const SLUG_REMAP = {
  "nattu-khozhli": "nattu-kozhi-masala",
  "colour-khodal": "colour-kodal",
  "medium-khodal": "medium-kodal",
  "small-khodal": "small-kodal",
  "bend-pastha": "bend-pasta",
  "muruku-pastha": "muruku-pasta",
  "sangu-pastha": "sangu-pasta",
  "aapalam-small": "aapalam-small",
  "aapalam-big": "aapalam-big",
  "marati-moku": "marati-mokku",
  "ellaka": "elakkai",
  "munthri": "munthiri",
  "karunjeeragam": "karuseragam",
  "jeeragam": "seragam",
  "birayani-illai": "biryani-leaf",
  "kalpasi": "kal-pasi",
  "kasuri-methi": "kasthuri-methi",
  "arsi-mavu": "arisi-mavu",
  "corn-flour-mavu": "corn-flour",
  "pottukallai": "pottukadalai",
  "mulu-pottukalai": "mulu-pottukadalai",
  "mysoor-parupu": "mysore-parupu",
  "milga-thool": "milaga-thool-bulk",
  "kari-masala": "kari-masala-bulk",
  "kulambu-thool": "kulambu-thool-bulk",
  "vella-mouchai": "vella-mochai",
  "sivapu-mouchai": "sivapu-mochai",
  "puundu": "poondu",
  "payasa-jawarsi": "payasa-javarisi",
  "mavu-jawarsi": "mavu-javarisi",
  "payasa-samiya": "payasa-semiya",
  "vella-samiya": "vella-semiya",
  "ragi-samiya": "ragi-semiya",
  "lemon-samiya": "lemon-semiya",
  "thagali-samiya": "tomato-semiya",
  "kammu-samiya": "kambu-semiya",
  "bs-perugayam": "bs-perungayam",
  "lg-perugayam": "lg-perungayam",
  "tt-perugayam": "tt-perungayam",
  "katti-perugayam": "katti-perungayam",
  "gold-winnur-oil": "gold-winner-oil",
  "grounut-oil": "groundnut-oil",
  "ginngly-oil": "gingelly-oil",
  "rice-brand-oil": "rice-bran-oil",
  "ittaly-soya": "idly-soya",
  "thalippu-vadagam": "thallipu-vadagam",
  "aapalam-small": "aapalam-small",
  "aapalam-big": "aapalam-big",
  "manjal-thool-bulk": "manjal-thool-bulk",
};

// For bulk masalas, remap display slug to bulk slug
const BULK_MASALA_REMAP = {
  "manjal-thool": "manjal-thool-bulk",
  "malli-thool": "malli-thool-bulk",
  "sambar-thool": "sambar-thool-bulk",
};

// ── Download helper ───────────────────────────────────────────────────────────
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode)) {
        file.close(); fs.unlink(dest, () => {});
        return resolve(downloadFile(res.headers.location, dest));
      }
      if (res.statusCode !== 200) {
        file.close(); fs.unlink(dest, () => {});
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
      file.on("error", (e) => { fs.unlink(dest, () => {}); reject(e); });
    });
    req.on("error", (e) => { fs.unlink(dest, () => {}); reject(e); });
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

// ── Parse Excel ───────────────────────────────────────────────────────────────
const wb = XLSX.readFile(EXCEL);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

let currentCategory = { name: "Spice Powders", slug: "spice-powders" };
const products = [];
let idCounter = 1;

for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  if (!row || row.every(c => c === undefined || c === null || c === "")) continue;

  const col0 = (row[0] || "").toString().trim();
  const col1 = (row[1] || "").toString().trim();
  const col2 = (row[2] || "").toString().trim();

  // Category header row: col0 is null/empty, col1 is category name
  if (!col0 && col1) {
    const catKey = col1.toLowerCase().trim();
    currentCategory = CATEGORY_MAP[catKey] || { name: col1, slug: toSlug(col1) };
    continue;
  }

  if (!col0) continue;

  const name = col0.replace(/\s+/g, " ").trim();
  // Capitalize first letter of each word
  const displayName = name.replace(/\b\w/g, c => c.toUpperCase());

  let slug = toSlug(name);

  // Remap for bulk masala category
  if (currentCategory.slug === "bulk-masalas" && BULK_MASALA_REMAP[slug]) {
    slug = BULK_MASALA_REMAP[slug];
  }

  const variants = parseVariants(col1, col2);
  const variantObjs = variants.map((v, vi) => ({
    id: `${slug}-v${vi + 1}`,
    weight: v.weight,
    mrp: v.price,
    price: v.price,
    discountPercent: 0,
  }));

  products.push({
    id: `p${idCounter++}`,
    slug,
    name: displayName,
    categorySlug: currentCategory.slug,
    categoryName: currentCategory.name,
    variants: variantObjs,
  });
}

console.log(`Parsed ${products.length} products`);

// ── Resolve images ────────────────────────────────────────────────────────────
async function resolveImage(slug) {
  // 1. Direct file exists
  const direct = path.join(IMG_DIR, `${slug}.jpg`);
  if (fs.existsSync(direct)) return `/images/products/${slug}.jpg`;

  // 2. Remap to another slug's file
  const remapped = SLUG_REMAP[slug];
  if (remapped) {
    const remappedFile = path.join(IMG_DIR, `${remapped}.jpg`);
    if (fs.existsSync(remappedFile)) {
      // Copy to new slug name
      fs.copyFileSync(remappedFile, direct);
      return `/images/products/${slug}.jpg`;
    }
  }

  // 3. Download new image
  if (IMAGE_OVERRIDES[slug]) {
    const url = `https://images.unsplash.com/${IMAGE_OVERRIDES[slug]}?w=400&h=400&fit=crop&q=80`;
    try {
      await downloadFile(url, direct);
      console.log(`  Downloaded: ${slug}`);
      return `/images/products/${slug}.jpg`;
    } catch (e) {
      console.log(`  Failed download ${slug}: ${e.message}`);
    }
  }

  // 4. Fallback: use spice powder image
  const fallback = path.join(IMG_DIR, "manjal-thool.jpg");
  if (fs.existsSync(fallback)) {
    fs.copyFileSync(fallback, direct);
    console.log(`  Fallback image for: ${slug}`);
    return `/images/products/${slug}.jpg`;
  }

  return `/images/products/manjal-thool.jpg`;
}

// ── Build products.ts ─────────────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(IMG_DIR, { recursive: true });

  // Resolve all images
  for (const p of products) {
    p.imageUrl = await resolveImage(p.slug);
  }

  // Generate TypeScript
  const variantType = `export type Variant = {
  id: string;
  weight: string;
  mrp: number;
  price: number;
  discountPercent: number;
  perUnit?: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl: string;
  images: string[];
  categorySlug: string;
  categoryName: string;
  deliveryMins: number;
  badge?: string;
  variants: Variant[];
};
`;

  const productLines = products.map(p => {
    const varLines = p.variants.map(v =>
      `      { id: "${v.id}", weight: "${v.weight}", mrp: ${v.mrp}, price: ${v.price}, discountPercent: ${v.discountPercent} }`
    ).join(",\n");
    return `  {
    id: "${p.id}",
    slug: "${p.slug}",
    name: "${p.name}",
    imageUrl: "${p.imageUrl}",
    images: ["${p.imageUrl}"],
    categorySlug: "${p.categorySlug}",
    categoryName: "${p.categoryName}",
    deliveryMins: 17,
    variants: [
${varLines}
    ],
  }`;
  }).join(",\n");

  const output = `${variantType}
export const PRODUCTS: Product[] = [
${productLines},
];
`;

  fs.writeFileSync(OUT_FILE, output);
  console.log(`\nWrote ${products.length} products to src/data/products.ts`);

  // Print unresolved slugs for review
  const missing = products.filter(p => p.imageUrl.includes("manjal-thool") && p.slug !== "manjal-thool");
  if (missing.length) {
    console.log("\nFallback image used for:");
    missing.forEach(p => console.log(`  ${p.slug}`));
  }
}

main().catch(console.error);
