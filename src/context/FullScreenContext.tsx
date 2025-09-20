// context/FullScreenContext.tsx
"use client";
import { createContext, useContext, useState } from "react";

type FullScreenContextType = {
  isFullScreen: boolean;
  setIsFullScreen: (val: boolean) => void;
};

const FullScreenContext = createContext<FullScreenContextType | null>(null);

export function FullScreenProvider({ children }: { children: React.ReactNode }) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  return (
    <FullScreenContext.Provider value={{ isFullScreen, setIsFullScreen }}>
      {children}
    </FullScreenContext.Provider>
  );
}

export function useFullScreen() {
  const ctx = useContext(FullScreenContext);
  if (!ctx) throw new Error("useFullScreen must be used inside FullScreenProvider");
  return ctx;
}
