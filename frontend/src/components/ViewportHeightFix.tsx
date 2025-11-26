"use client";

import { useEffect } from "react";

export function ViewportHeightFix() {
  useEffect(() => {
    const setAppHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
      document.documentElement.style.setProperty("--app-height", `${window.innerHeight}px`);
    };

    setAppHeight();

    let resizeTimeout: NodeJS.Timeout;
    const debouncedSetAppHeight = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(setAppHeight, 100);
    };

    window.addEventListener("resize", debouncedSetAppHeight);
    window.addEventListener("orientationchange", () => {
      setTimeout(setAppHeight, 200);
    });

    if ("visualViewport" in window && window.visualViewport) {
      window.visualViewport.addEventListener("resize", debouncedSetAppHeight);
    }

    return () => {
      window.removeEventListener("resize", debouncedSetAppHeight);
      if ("visualViewport" in window && window.visualViewport) {
        window.visualViewport.removeEventListener("resize", debouncedSetAppHeight);
      }
      clearTimeout(resizeTimeout);
    };
  }, []);

  return null;
}
