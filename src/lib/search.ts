import Fuse from "fuse.js";
import { PRODUCTS, Product } from "@/data/products";

// English aliases → Tamil product name fragments (for cross-language search)
const ALIASES: Record<string, string[]> = {
  "toor dal": ["thuvaram parupu", "toor"],
  "toor": ["thuvaram parupu"],
  "tuvar": ["thuvaram parupu"],
  "arhar": ["thuvaram parupu"],
  "moong dal": ["paasi parupu"],
  "moong": ["paasi parupu"],
  "green gram": ["paasi parupu"],
  "chana dal": ["kadalai parupu"],
  "bengal gram": ["kadalai parupu"],
  "chana": ["kadalai parupu"],
  "masoor dal": ["mysore parupu"],
  "masoor": ["mysore parupu"],
  "red lentil": ["mysore parupu"],
  "urad dal": ["vada parupu", "ulundhu"],
  "urad": ["vada parupu", "ulundhu"],
  "black gram": ["vada parupu"],
  "turmeric": ["manjal"],
  "haldi": ["manjal"],
  "chilli powder": ["milakai thool"],
  "chili powder": ["milakai thool"],
  "red chilli": ["milakai thool", "vara milagai"],
  "coriander powder": ["malli thool"],
  "dhania": ["malli thool"],
  "pepper": ["milagu"],
  "black pepper": ["milagu"],
  "cumin": ["jeera", "jeeragam"],
  "jeera": ["jeera powder", "jeeragam"],
  "fennel": ["sombu"],
  "anise": ["sombu", "annachi poo"],
  "star anise": ["annachi poo"],
  "clove": ["kirambu"],
  "cardamom": ["elakkai"],
  "cinnamon": ["pattai"],
  "bay leaf": ["brinji ilai"],
  "fenugreek": ["venthiyam"],
  "mustard": ["kadugu"],
  "sesame": ["ellu"],
  "sesame seeds": ["ellu"],
  "vathal": ["vathal", "dry chips"],
  "thool": ["thool", "masala"],
  "kuzhambu thool": ["kuzhambu thool", "kulambu thool"],
  "gingelly": ["gingelly oil"],
  "groundnut": ["groundnut oil", "kadalai"],
  "peanut": ["kadalai"],
  "coconut oil": ["coconut oil"],
  "besan": ["kadalai mavu"],
  "gram flour": ["kadalai mavu"],
  "rice flour": ["arisi mavu"],
  "corn flour": ["corn flour"],
  "maida": ["maida mavu"],
  "wheat": ["godumai"],
  "pickle": ["pickle"],
  "achar": ["pickle"],
  "chips": ["chips", "vathal"],
  "papad": ["papad"],
  "soya": ["soya"],
  "soybean": ["soya"],
  "asafoetida": ["perungayam"],
  "hing": ["perungayam"],
  "semiya": ["semiya"],
  "vermicelli": ["semiya"],
  "sago": ["javarisi"],
  "tapioca": ["javarisi"],
  "kidney bean": ["mochai"],
  "white bean": ["vella mochai"],
  "red bean": ["sivapu mochai"],
  "cowpea": ["thatta pairu"],
  "chickpea": ["konda kadalai"],
  "garbanzo": ["konda kadalai"],
  "sundal": ["sundal"],
  "sambar": ["sambar"],
  "rasam": ["rasam"],
  "garam masala": ["garam masala"],
  "curry masala": ["curry masala", "kulambu thool"],
  "fish curry": ["fish curry masala"],
  "chicken masala": ["chicken masala"],
  "mutton masala": ["mutton masala"],
  "lemon pickle": ["lemon pickle"],
  "mango pickle": ["mango pickle"],
  "garlic pickle": ["garlic pickle"],
  "ginger pickle": ["ginger pickle"],
  "oil": ["oil"],
  "fortune": ["fortune oil"],
  "gold winner": ["gold winner oil"],
};

// Expand query with aliases — returns array of search terms to try
function expandQuery(q: string): string[] {
  const lower = q.toLowerCase().trim();
  const expanded = [lower];
  for (const [alias, targets] of Object.entries(ALIASES)) {
    if (lower.includes(alias) || alias.includes(lower)) {
      expanded.push(...targets);
    }
  }
  return [...new Set(expanded)];
}

// Augment each product with searchable text (name + category + aliases)
type SearchDoc = Product & { _searchText: string };

const DOCS: SearchDoc[] = PRODUCTS.map((p) => {
  // Find all aliases that point to this product
  const matchingAliases: string[] = [];
  const nameLower = p.name.toLowerCase();
  for (const [alias, targets] of Object.entries(ALIASES)) {
    if (targets.some((t) => nameLower.includes(t) || t.includes(nameLower.split(" ")[0]))) {
      matchingAliases.push(alias);
    }
  }
  return {
    ...p,
    _searchText: [p.name, p.categoryName, ...matchingAliases].join(" "),
  };
});

const fuse = new Fuse(DOCS, {
  keys: [
    { name: "_searchText", weight: 2 },
    { name: "name", weight: 1.5 },
    { name: "categoryName", weight: 0.5 },
  ],
  threshold: 0.45,       // 0 = exact, 1 = match anything — 0.45 allows ~2 typos
  distance: 200,
  includeScore: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
  useExtendedSearch: false,
});

export function fuzzySearch(query: string): Product[] {
  if (!query.trim()) return [];
  const terms = expandQuery(query);
  const seen = new Set<string>();
  const results: Product[] = [];

  for (const term of terms) {
    const hits = fuse.search(term);
    for (const hit of hits) {
      if (!seen.has(hit.item.id)) {
        seen.add(hit.item.id);
        results.push(hit.item);
      }
    }
  }

  return results;
}
