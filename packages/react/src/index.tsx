import React, { useState, useEffect, ReactElement } from "react";

export interface ZentifyAppConfig {
  /**
   * The function that resolves a component given a page name.
   * e.g., (name) => pages[\`./Pages/\${name}.tsx\`]
   */
  resolve: (name: string) => any;
  /**
   * The setup function responsible for mounting the React app.
   */
  setup: (options: { el: HTMLElement; App: React.ElementType; props: any }) => void;
}

import { PageData, subscribe, unsubscribe } from "./utils/navigate";

export function createZentifyApp({ resolve, setup }: ZentifyAppConfig) {
  const el = document.getElementById("zentify-app");
  if (!el) {
    console.error("Zentify: Could not find element with id 'zentify-app'.");
    return;
  }

  const dataset = el.dataset.page;
  if (!dataset) {
    console.error("Zentify: 'data-page' attribute is missing on the 'zentify-app' element.");
    return;
  }


  const App = () => {
    const [pageData, setPageData] = useState<PageData>(JSON.parse(dataset!));

    useEffect(() => {
      const handler = (newData: PageData) => setPageData(newData);
      subscribe(handler);
      
      const onPopState = (event: PopStateEvent) => {
        if (event.state && event.state.zentify) {
          setPageData(event.state.zentify);
        }
      };
      
      window.addEventListener("popstate", onPopState);

      return () => {
        unsubscribe(handler);
        window.removeEventListener("popstate", onPopState);
      };
    }, []);

    const ComponentModule = resolve(pageData.component);
    const Component = ComponentModule.default || ComponentModule;

    if (!Component) {
      return React.createElement("div", null, `Component "${pageData.component}" not found.`);
    }

    return React.createElement(Component, pageData.props);
  };

  setup({ el, App, props: {} });
}






