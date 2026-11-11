"use client";

import { useEffect } from "react";

export function PrintButton() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("print") === "1") {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, []);
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-primary">
      Print or save as PDF
    </button>
  );
}
