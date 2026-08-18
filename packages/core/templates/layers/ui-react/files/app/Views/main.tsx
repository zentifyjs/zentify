import { createZentifyApp } from "@zentify/react";
import { createRoot } from "react-dom/client";

// Resolve using Vite Glob Import
const pages = (import.meta as any).glob("./Pages/**/*.tsx", { eager: true });

createZentifyApp({
  resolve: (name) => pages[`./Pages/${name}.tsx`],
  setup({ el, App, props }) {
    const root = createRoot(el);
    root.render(<App {...props} />);
  },
});