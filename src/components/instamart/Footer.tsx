import Image from "next/image";

const COMPANY_LINKS = ["About Us", "Our Story", "Quality Promise", "Bulk Orders", "Wholesale"];
const LEGAL_LINKS = ["Terms & Conditions", "Privacy Policy", "Refund Policy"];
const CONTACT_LINKS = ["Help & Support", "WhatsApp Us", "Visit Our Store"];

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "#02060C", color: "rgba(255,255,255,0.7)" }}>
      <div style={{ padding: "32px 16px 24px" }}>
        {/* Vinayaga Traders logo */}
        <div style={{ marginBottom: 28 }}>
          <Image
            src="/vinayaga-logo.png"
            alt="Vinayaga Traders"
            width={56}
            height={56}
            style={{ objectFit: "contain", borderRadius: 8 }}
          />
        </div>

        {/* Two-column grid on mobile */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px 16px",
            marginBottom: 28,
          }}
        >
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: "white", margin: "0 0 12px" }}>Company</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {COMPANY_LINKS.map((l) => (
                <li key={l} style={{ marginBottom: 8 }}>
                  <a href="#" style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>{l}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: "white", margin: "0 0 12px" }}>Legal</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {LEGAL_LINKS.map((l) => (
                <li key={l} style={{ marginBottom: 8 }}>
                  <a href="#" style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>{l}</a>
                </li>
              ))}
            </ul>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: "white", margin: "20px 0 12px" }}>Contact us</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {CONTACT_LINKS.map((l) => (
                <li key={l} style={{ marginBottom: 8 }}>
                  <a href="#" style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>{l}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          padding: "14px 16px 28px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>&copy; 2026 Vinayaga Traders</span>
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { src: "Dweb/facebook.png", alt: "Facebook" },
            { src: "Dweb/Pinterest.png", alt: "Pinterest" },
            { src: "Dweb/Instagram.png", alt: "Instagram" },
            { src: "Dweb/Twitter.png", alt: "Twitter" },
          ].map(({ src, alt }) => (
            <a key={alt} href="#" style={{ display: "block" }}>
              <Image
                src={`https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_48/${src}`}
                alt={alt}
                width={20}
                height={20}
                unoptimized
              />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
