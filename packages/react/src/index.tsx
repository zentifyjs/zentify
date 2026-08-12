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

interface PageData {
  component: string;
  props: Record<string, any>;
}

// Global state for simple router
let currentData: PageData | null = null;
let subscribers: ((data: PageData) => void)[] = [];

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

  currentData = JSON.parse(dataset) as PageData;

  const App = () => {
    const [pageData, setPageData] = useState<PageData>(currentData!);

    useEffect(() => {
      const handler = (newData: PageData) => setPageData(newData);
      subscribers.push(handler);
      
      const onPopState = (event: PopStateEvent) => {
        if (event.state && event.state.zentify) {
          setPageData(event.state.zentify);
        }
      };
      
      window.addEventListener("popstate", onPopState);

      return () => {
        subscribers = subscribers.filter((s) => s !== handler);
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

export const navigate = async (url: string) => {
  try {
    const response = await fetch(url, {
      headers: {
        "X-Zentify-Bridge": "true",
        "Accept": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      currentData = data;
      // Push state
      window.history.pushState({ zentify: data }, "", url);
      // Notify subscribers
      subscribers.forEach((s) => s(data));
    } else {
      console.error("Zentify Navigation Failed:", response.statusText);
      // Fallback to normal navigation
      window.location.href = url;
    }
  } catch (error) {
    console.error("Zentify Navigation Error:", error);
    window.location.href = url;
  }
};

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export const Link: React.FC<LinkProps> = ({ href, children, onClick, ...props }) => {
  return React.createElement(
    "a",
    {
      href,
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (onClick) onClick(e);
        navigate(href);
      },
      ...props,
    },
    children
  );
};
