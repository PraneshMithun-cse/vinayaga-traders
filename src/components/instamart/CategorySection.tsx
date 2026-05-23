import Image from "next/image";

export type Category = {
  name: string;
  imageUrl: string;
};

type CategorySectionProps = {
  title: string;
  categories: Category[];
};

function CategoryCard({ category }: { category: Category }) {
  return (
    <div
      style={{
        width: "22%",
        maxWidth: 88,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "1",
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: "#F5F5F5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          src={category.imageUrl}
          alt={category.name}
          width={88}
          height={88}
          style={{ objectFit: "contain", width: "100%", height: "100%" }}
          unoptimized
        />
      </div>
      <p
        style={{
          marginTop: 6,
          fontSize: 11,
          fontWeight: 600,
          color: "rgba(2, 6, 12, 0.75)",
          textAlign: "center",
          lineHeight: 1.3,
          wordBreak: "break-word",
          width: "100%",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as const,
          overflow: "hidden",
        }}
      >
        {category.name}
      </p>
    </div>
  );
}

export default function CategorySection({ title, categories }: CategorySectionProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p
        style={{
          fontSize: 12,
          fontWeight: 400,
          color: "rgba(2, 6, 12, 0.6)",
          padding: "0 16px",
          marginBottom: 12,
          letterSpacing: 0.1,
        }}
      >
        {title}
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: "12px 4%",
          padding: "0 16px",
        }}
      >
        {categories.map((cat) => (
          <CategoryCard key={cat.name} category={cat} />
        ))}
      </div>
    </div>
  );
}
