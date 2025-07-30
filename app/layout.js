import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Apple Intelligence Rewrite Animation",
  description: "Recreation of the text rewriting animation featured in Apple Intelligence, built using Next.js and Framer Motion.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
