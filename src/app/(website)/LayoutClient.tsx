"use client";

import { useFullScreen } from "@/context/FullScreenContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isFullScreen } = useFullScreen();

  return (
    <>
      {!isFullScreen && <Header />}
      {!isFullScreen && <div className="h-16 md:h-[72px]" />}
      <main className="min-h-screen">{children}</main>
      {!isFullScreen && <Footer />}
    </>
  );
}
