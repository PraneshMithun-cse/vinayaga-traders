import Image from "next/image";

export default function AppBanner() {
  return (
    <div
      style={{
        backgroundColor: "#F0F0F5",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        marginTop: 8,
      }}
    >
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "rgba(2, 6, 12, 0.92)",
            lineHeight: 1.35,
            margin: "0 0 14px 0",
          }}
        >
          For better experience, download the Vinayaga Traders app now
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a href="#" style={{ display: "block" }}>
            <Image
              src="https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_100/portal/m/play_store.png"
              alt="Get it on Google Play"
              width={108}
              height={34}
              unoptimized
              style={{ objectFit: "contain" }}
            />
          </a>
          <a href="#" style={{ display: "block" }}>
            <Image
              src="https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_100/portal/m/app_store.png"
              alt="Download on the App Store"
              width={108}
              height={34}
              unoptimized
              style={{ objectFit: "contain" }}
            />
          </a>
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>
        <Image
          src="https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_600/Dweb/half%20mockup%201.png"
          alt="Vinayaga Traders App"
          width={100}
          height={130}
          unoptimized
          style={{ objectFit: "contain" }}
        />
      </div>
    </div>
  );
}
