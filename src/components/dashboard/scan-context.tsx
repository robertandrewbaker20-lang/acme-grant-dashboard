"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface ScanContextValue {
  isScanning: boolean;
  lastScanAt: Date | null;
  lastScanSummary: string | null;
  startScan: () => void;
  finishScan: (summary: string | null) => void;
}

const ScanContext = createContext<ScanContextValue | null>(null);

export function ScanProvider({ children }: { children: ReactNode }) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanAt, setLastScanAt] = useState<Date | null>(null);
  const [lastScanSummary, setLastScanSummary] = useState<string | null>(null);

  return (
    <ScanContext.Provider
      value={{
        isScanning,
        lastScanAt,
        lastScanSummary,
        startScan: () => setIsScanning(true),
        finishScan: (summary) => {
          setIsScanning(false);
          if (summary) {
            setLastScanAt(new Date());
            setLastScanSummary(summary);
          }
        },
      }}
    >
      {children}
    </ScanContext.Provider>
  );
}

export function useScan() {
  const ctx = useContext(ScanContext);
  if (!ctx) {
    return {
      isScanning: false,
      lastScanAt: null,
      lastScanSummary: null,
      startScan: () => {},
      finishScan: () => {},
    };
  }
  return ctx;
}
