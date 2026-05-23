import { Suspense } from "react";
import SearchContent from "@/components/instamart/SearchContent";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: "rgba(2,6,12,0.45)", fontSize: 14 }}>Loading…</div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
