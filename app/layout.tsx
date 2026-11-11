import type { Metadata, Viewport } from "next";
import "./globals.css";

const title = "Moana — The Ocean Is Calling";
const description =
  "A fan-made interactive tribute to Moana: turn the hero with your mouse or finger, then explore the journey, gallery and characters.";
const shareImage = {
  url: "/moana/ezgif-frame-091.jpg",
  width: 1280,
  height: 720,
  alt: "Young Moana sitting on the shore at sunset beside a baby sea turtle",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://moana-graphic-editing.vercel.app"),
  title,
  description,
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Moana",
    title,
    description,
    images: [shareImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [shareImage],
  },
};

export const viewport: Viewport = {
  themeColor: "#020e1a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
