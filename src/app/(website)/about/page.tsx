// app/about/page.tsx
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Users,
  FileText,
  Clock,
  ShieldCheck,
  Globe,
  Users2,
  Sun,
  Moon,
} from "lucide-react";
import Banner from "../../sections/Banner";
import Mission from "../../sections/Mission";
import Value from "../../sections/Values";

export default function AboutPage() {
  // theme state: 'light' | 'dark'
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <main className="min-h-screen bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100">
      {/* Theme toggle (top-right) */}
   

      {/* Hero Section */}
      <Banner
        title="About"
        title2="Us"
        description="Empowering A-Level Computer Science students with comprehensive resources, expert guidance, and cutting-edge tools to excel in their academic journey."
      />

      {/* Mission + Stats Section */}
      <Mission />

      {/* Values Section */}
      <Value />

      {/* CTA Section */}

    </main>
  );
}
