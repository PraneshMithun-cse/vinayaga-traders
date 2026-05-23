import Link from "next/link";
import { getProductBySlug, PRODUCTS } from "@/data/products";
import ProductPageClient from "@/components/instamart/ProductPageClient";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return (
      <div style={{ maxWidth: 430, margin: "0 auto", padding: 32, textAlign: "center" }}>
        <p style={{ color: "#282C3F", fontWeight: 600 }}>Product not found</p>
        <Link href="/" style={{ color: "#0050FF" }}>← Back to home</Link>
      </div>
    );
  }

  return <ProductPageClient product={product} />;
}
