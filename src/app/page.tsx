import Image from "next/image";
import Link from "next/link";
import Header from "@/components/instamart/Header";
import Footer from "@/components/instamart/Footer";
import ProductGrid from "@/components/instamart/ProductGrid";
import { PRODUCTS } from "@/data/products";

const CATEGORIES = [
  { name: "Spice Powders",    slug: "spice-powders", imageUrl: "/images/products/manjal-thool.png" },
  { name: "Pickle",           slug: "pickle",        imageUrl: "/images/products/lemon-pickle.png" },
  { name: "Dry Chips",        slug: "dry-chips",     imageUrl: "/images/products/bat-chips.png" },
  { name: "Spices",           slug: "spices",        imageUrl: "/images/products/milagu.png" },
  { name: "Flour & Rava",     slug: "flour",         imageUrl: "/images/products/kadalai-mavu.png" },
  { name: "Pulses & Dal",     slug: "pulses",        imageUrl: "/images/products/thuvaram-parupu.png" },
  { name: "Masala (Bulk)",    slug: "masala-bulk",   imageUrl: "/images/products/manjal-thool-homemade.png" },
  { name: "Seeds & Samiya",   slug: "seeds",         imageUrl: "/images/products/vella-mochai.png" },
  { name: "Oil",              slug: "oil",           imageUrl: "/images/products/coconut-oil.png" },
  { name: "Soya",             slug: "soya",          imageUrl: "/images/products/soya-big.png" },
  { name: "Millets",          slug: "millets",       imageUrl: "/images/products/ragi.png" },
  { name: "Sugar & Jaggery",  slug: "sugar",         imageUrl: "/images/products/sugar.png" },
];

export default function Home() {
  return (
    <div
      style={{
        maxWidth: 430,
        margin: "0 auto",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#F8F8F8",
      }}
    >
      <Header />

      <main style={{ flex: 1 }}>
        {/* ── Category Section ── */}
        <section style={{ backgroundColor: "white", padding: "20px 0 24px" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#282C3F", margin: "0 16px 14px" }}>
            Shop by Category
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              padding: "0 12px",
              gap: "12px 8px",
            }}
          >
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center" }}
              >
                <div
                  style={{
                    borderRadius: 16,
                    width: "100%",
                    aspectRatio: "1",
                    marginBottom: 6,
                    overflow: "hidden",
                    position: "relative",
                    backgroundColor: "#F8F8F8",
                  }}
                >
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 430px) 25vw, 100px"
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#3F424E",
                    textAlign: "center",
                    lineHeight: 1.25,
                  }}
                >
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Divider ── */}
        <div style={{ height: 8, backgroundColor: "#F0F0F0" }} />

        {/* ── Products Section ── */}
        <section style={{ backgroundColor: "white", paddingBottom: 8 }}>
          <div
            style={{
              padding: "18px 16px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#282C3F", margin: 0 }}>
              Our Products
            </h2>
            <span style={{ fontSize: 13, color: "#0050FF", fontWeight: 600 }}>
              See all
            </span>
          </div>

          <div style={{ height: 1, backgroundColor: "#F0F0F0", margin: "0 16px 4px" }} />

          <ProductGrid products={PRODUCTS} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
