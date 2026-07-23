"use client";

import * as React from "react";

export function ThemeToggle() {
  React.useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.removeItem("theme");
  }, []);

  return null;
}
