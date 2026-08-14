import { createZentifyApp } from "@zentify/react";
import { createRoot } from "react-dom/client";
import "./global.css";

// Resolve using Vite Glob Import
const pages = (import.meta as any).glob("./Pages/**/*.tsx", { eager: true });

createZentifyApp({
  resolve: (name) => pages[`./Pages/${name}.tsx`],
});
