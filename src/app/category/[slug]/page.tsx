import { getProductsByCategory, CATEGORY_SLUGS } from "@/data/products";
import CategoryContent from "@/components/instamart/CategoryContent";

const CATEGORY_TITLES: Record<string, string> = {
  "spice-powders": "Spice Powders",
  "pickle": "Pickle",
  "dry-chips": "Dry Chips & Vathal",
  "spices": "Spices",
  "flour": "Flour & Rava",
  "pulses": "Pulses & Dal",
  "masala-bulk": "Masala (Bulk)",
  "seeds": "Seeds & Samiya",
  "oil": "Oil",
  "soya": "Soya",
  "millets": "Millets",
  "sugar": "Sugar & Jaggery",
};

export function generateStaticParams() {
  return CATEGORY_SLUGS.map((slug) => ({ slug }));
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const products = getProductsByCategory(slug);
  const title = CATEGORY_TITLES[slug] ?? slug;

  return <CategoryContent products={products} title={title} />;
}
