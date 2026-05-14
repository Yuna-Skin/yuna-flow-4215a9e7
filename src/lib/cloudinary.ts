// Cloudinary URL transform helper.
// Inserts delivery params (format auto, quality auto, width, crop) right after /upload/.
// Pass-through for non-Cloudinary URLs.

const CLOUDINARY_MARKER = "/image/upload/";

type Opts = {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "limit";
  dpr?: "auto" | number;
};

export function optimizeCloudinary(url: string | null | undefined, opts: Opts = {}): string | null {
  if (!url) return null;
  const idx = url.indexOf(CLOUDINARY_MARKER);
  if (idx === -1) return url;

  const { width, height, crop = "fill", dpr = "auto" } = opts;
  const parts = ["f_auto", "q_auto"];
  if (typeof dpr === "number") parts.push(`dpr_${dpr}`);
  else parts.push("dpr_auto");
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if (width || height) parts.push(`c_${crop}`);

  const transform = parts.join(",");
  const before = url.slice(0, idx + CLOUDINARY_MARKER.length);
  const after = url.slice(idx + CLOUDINARY_MARKER.length);
  // Avoid double-applying if URL already has a transform segment.
  if (/^[a-z]_[^/]+(,[a-z]_[^/]+)*\//i.test(after)) return url;
  return `${before}${transform}/${after}`;
}
