/**
 * Logo WKW réutilisable
 * Sans filtre — affiche le logo avec ses vraies couleurs
 */
const LOGO_URL = "/logo-wkw.png";

export default function Logo({ size = 40, className = "", alt = "WKW Automotive", invert = false }) {
  return (
    <img
      src={LOGO_URL}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{
        objectFit: "contain",
        display: "block",
        filter: invert ? "brightness(0) invert(1)" : "none",
      }}
      onError={(e) => {
        // Fallback si le logo ne charge pas
        e.target.onerror = null;
        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='20' font-weight='bold'%3EW%3C/text%3E%3C/svg%3E";
      }}
    />
  );
}

export { LOGO_URL };
