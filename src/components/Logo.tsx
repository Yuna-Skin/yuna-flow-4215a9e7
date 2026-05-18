import { optimizeCloudinary } from "@/lib/cloudinary";

const LOGO_URL =
  "https://res.cloudinary.com/dqsuj0pjy/image/upload/v1779080514/FastBurn_3_z6feak.png";

interface LogoProps {
  size?: number;
  className?: string;
  alt?: string;
  priority?: boolean;
}

export function Logo({ size = 72, className, alt = "Yuna Skin", priority = false }: LogoProps) {
  const src = optimizeCloudinary(LOGO_URL, { width: size * 2, crop: "fit" }) ?? LOGO_URL;
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      className={className}
      style={{ width: size, height: "auto" }}
    />
  );
}

export const LOGO_IMAGE_URL = LOGO_URL;
