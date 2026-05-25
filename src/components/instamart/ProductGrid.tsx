"use client";

import { useState, useEffect } from "react";
import { Product } from "@/data/products";
import { useAdmin } from "@/context/AdminContext";
import ProductCard from "./ProductCard";
import VariantModal from "./VariantModal";

interface Props {
  products: Product[];
}

export default function ProductGrid({ products }: Props) {
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [shuffled, setShuffled] = useState<Product[]>([]);
  const { applyOverride } = useAdmin();

  useEffect(() => {
    // Fisher-Yates Shuffle
    const arr = [...products];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setShuffled(arr);
  }, [products]);

  const listToRender = shuffled.length > 0 ? shuffled : products;

  const visible = listToRender
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
