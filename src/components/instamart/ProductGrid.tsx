"use client";

import { useState } from "react";
import { Product } from "@/data/products";
import { useAdmin } from "@/context/AdminContext";
import ProductCard from "./ProductCard";
import VariantModal from "./VariantModal";

interface Props {
  products: Product[];
}

export default function ProductGrid({ products }: Props) {
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const { applyOverride } = useAdmin();

  const visible = products
    .map(applyOverride)
    .filter((p) => !p.disabled);

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1px",
          backgroundColor: "#F0F0F0",
        }}
      >
        {visible.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            layout="grid"
            onAdd={setActiveProduct}
          />
        ))}
      </div>
      <VariantModal product={activeProduct} onClose={() => setActiveProduct(null)} />
    </>
  );
}
