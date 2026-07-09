import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Glint",
    short_name: "Glint",
    description:
      "Your car is cleaned while you work. Eco-friendly, water-efficient washing at office parks and estates.",
    start_url: "/",
    display: "standalone",
    background_color: "#0C0C0C",
    theme_color: "#0C0C0C",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
