interface LogoProps {
  size?: number;
  className?: string;
  alt?: string;
  priority?: boolean;
}

export function Logo({ size = 32, className, alt = "YunaSkin" }: LogoProps) {
  return (
    <span
      className={`inline-block leading-none ${className || ""}`}
      style={{ fontFamily: "'Instrument Serif', serif", fontSize: size }}
      aria-label={alt}
    >
      Yuna
      <em style={{ fontStyle: "italic" }}>Skin</em>
    </span>
  );
}

export const LOGO_IMAGE_URL =
  "https://res.cloudinary.com/dqsuj0pjy/image/upload/v1779080514/FastBurn_3_z6feak.png";
