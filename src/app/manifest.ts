import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "YT Stream — คีย์ไลฟ์ YouTube",
    short_name: "YT Stream",
    description: "สร้างและจัดการ stream key สำหรับไลฟ์ YouTube จากมือถือ",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#0b0d12",
    theme_color: "#0b0d12",
    lang: "th",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
