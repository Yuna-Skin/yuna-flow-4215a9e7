import { useEffect, useRef, useState, type VideoHTMLAttributes } from "react";

type Props = VideoHTMLAttributes<HTMLVideoElement> & {
  src: string;
  rootMargin?: string;
};

/**
 * Vídeo que só começa a baixar (src + metadata) quando entra perto do viewport.
 * Reduz uso de dados/CPU em telas onde o vídeo está abaixo da dobra.
 */
export function LazyVideo({ src, rootMargin = "200px", ...rest }: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, visible]);

  return <video ref={ref} src={visible ? src : undefined} {...rest} />;
}
