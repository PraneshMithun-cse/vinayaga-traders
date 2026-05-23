const fs = require('fs');

const rawData = JSON.parse(fs.readFileSync('extracted_products.json', 'utf8'));
const outPath = 'src/data/products.ts';

const CATEGORY_MAP = {
  "Spice Powders": "spice-powders",
  "Pickel": "pickel",
  "Dry Chips": "dry-chips",
  "Spices": "spices",
  "Flour": "flour",
  "Pulses": "pulses",
  "Masala": "masala",
  "Seeds": "seeds",
  "Oil": "oil",
  "Soya": "soya",
  "Millets": "millets",
  "Sugar": "sugar"
};

let currentCategoryName = 'Spice Powders';
let products = [];
let idCounter = 1;

const CATEGORY_FALLBACK_IMAGES = {
  "Spice Powders": "/images/products/prod_15.jpeg",
  "Pickel": "/images/products/prod_22.png",
  "Dry Chips": "/images/products/prod_29.png",
  "Spices": "/images/products/prod_54.png",
  "Flour": "/images/products/prod_77.png",
  "Pulses": "/images/products/prod_90.png",
  "Masala": "/images/products/prod_104.png",
  "Seeds": "/images/products/prod_111.png",
  "Oil": "/images/products/prod_139.png",
  "Soya": "/images/products/prod_148.png",
  "Millets": "/images/products/prod_153.png",
  "Sugar": "/images/products/prod_162.png"
};

for (const row of rawData) {
  const vals = row.values.filter(v => v !== '#VALUE!');
  
  if (vals.length === 1 && !row.image) {
    currentCategoryName = vals[0].trim().toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    // Edge case if casing was weird
    if (currentCategoryName === 'Dry chips') currentCategoryName = 'Dry Chips';
    if (currentCategoryName === 'Spice powders') currentCategoryName = 'Spice Powders';
    continue;
  }
  
  if (vals.length >= 2) { // Allow items with 2 or 3 columns
    const name = vals[0].trim();
    let weightParts = [];
    let priceParts = [];
    
    // Check if it has 3 columns (Name, Weight, Price)
    if (vals.length >= 3) {
      weightParts = vals[1].split('/').map(w => w.trim());
      priceParts = vals[2].split('/').map(p => p.trim());
    } else {
      // Missing weight or price, let's assume default
      weightParts = ["100g"];
      priceParts = [vals[1].trim()];
    }
    
    // Match variants
    let variants = [];
    for (let i = 0; i < Math.max(weightParts.length, priceParts.length); i++) {
      let weightStr = weightParts[i] || weightParts[0] || "100g";
      let priceStr = priceParts[i] || priceParts[0] || "0Rs";
      
      let price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
      let mrp = Math.floor(price * 1.2);
      
      variants.push({
        id: `v${i+1}`,
        weight: weightStr.replace(/gram/gi, 'g').replace(/ /g, ''),
        price: price,
        mrp: mrp,
        discountPercent: Math.round(((mrp - price) / mrp) * 100) || 0,
        inStock: true
      });
    }
    
    let imageUrl = row.image || CATEGORY_FALLBACK_IMAGES[currentCategoryName] || '/images/products/prod_15.jpeg';
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    // Ensure unique slug
    let finalSlug = slug;
    let count = 1;
    while(products.some(p => p.slug === finalSlug)) {
        finalSlug = `${slug}-${count++}`;
    }

    products.push({
      id: `prod_${idCounter++}`,
      slug: finalSlug,
      name: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      categorySlug: CATEGORY_MAP[currentCategoryName] || "misc",
      categoryName: currentCategoryName,
      description: `Premium quality ${name}. Made with pure ingredients and traditional methods.`,
      imageUrl: imageUrl,
      images: [imageUrl],
      rating: 4.8,
      reviews: Math.floor(Math.random() * 200) + 50,
      deliveryMins: 17,
      variants: variants
    });
  }
}

let tsContent = `export type Variant = {
  id: string;
  weight: string;
  price: number;
  mrp: number;
  discountPercent: number;
  inStock?: boolean;
  perUnit?: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  description?: string;
  imageUrl: string;
  images: string[];
  rating?: number;
  reviews?: number;
  deliveryMins: number;
  badge?: string;
  variants: Variant[];
};

export const PRODUCTS: Product[] = ${JSON.stringify(products, null, 2).replace(/"([^"]+)":/g, '$1:')};

export const CATEGORY_SLUGS = Array.from(new Set(PRODUCTS.map(p => p.categorySlug)));

export function getProductsByCategory(slug: string): Product[] {
  return PRODUCTS.filter(p => p.categorySlug === slug);
}

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
`;

fs.writeFileSync(outPath, tsContent);
console.log(`Generated ${products.length} products in ${outPath}`);
