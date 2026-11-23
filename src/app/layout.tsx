import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Banven — Software Engineering Portfolio",
  description:
    "Nyuydze Banven Eric Junior — software engineering master's student at the College of Technology, University of Buea, based in Yaoundé, Cameroon. Projects, qualifications, ambition, and contact: WhatsApp, email, GitHub, phone, and CV download.",
  keywords: [
    "Nyuydze Banven Eric Junior",
    "Banven",
    "software engineering",
    "web development",
    "University of Buea",
    "College of Technology",
    "Cameroon",
    "Yaoundé",
    "portfolio",
    "Python",
    "JavaScript",
    "Java",
    "C++",
    "Flask",
    "Node.js",
    "AR e-commerce",
    "AI integration",
    "cultural heritage",
    "personal finance",
  ],
  authors: [{ name: "Nyuydze Banven Eric Junior" }],
  icons: {
    icon: "/mark.svg",
  },
  openGraph: {
    title: "Banven — Software Engineering Portfolio",
    description:
      "Nyuydze Banven Eric Junior. Software engineering, University of Buea. Projects (CULTIA, MEDISCAN AI, TRYONS, U-TRUST), qualifications, ambition, and contact.",
    siteName: "Banven",
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
      <head>
        <script
          type="importmap"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              imports: {
                three: "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
                "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/",
              },
            }),
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
