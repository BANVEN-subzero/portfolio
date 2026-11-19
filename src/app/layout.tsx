import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "BANVEN — Software Engineering Portfolio",
  description:
    "Portfolio of Nyuydze Banven Eric Junior — software engineering master's student at the College of Technology, University of Buea. Web development, AI-enabled applications, cultural heritage, e-commerce and personal finance projects.",
  keywords: [
    "Nyuydze Banven Eric Junior",
    "software engineering",
    "web development",
    "University of Buea",
    "Cameroon",
    "portfolio",
    "Python",
    "JavaScript",
    "Flask",
    "Node.js",
  ],
  authors: [{ name: "Nyuydze Banven Eric Junior" }],
  icons: {
    icon: "/mark.svg",
  },
  openGraph: {
    title: "BANVEN — Software Engineering Portfolio",
    description:
      "Real-time rendering studies in particles and fluids. Nyuydze Banven Eric Junior, software engineering, University of Buea.",
    siteName: "BANVEN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
