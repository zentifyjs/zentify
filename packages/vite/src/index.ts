import { ZentifyViewEngine, ZentifyAdapter, Zentify, ZRequest, ZResponse } from "@zentify/core";
import * as fs from "node:fs/promises";
import { createServer, ViteDevServer } from "vite";

export interface ZentifyViteOptions {
  /**
   * The entry point for the Vite Dev Server.
   * Typically 'src/main.tsx' or 'src/main.ts'.
   */
  entry: string;
  /**
   * Determine if we should inject Vite Dev Server scripts or load from manifest.
   * Default: process.env.NODE_ENV !== 'production'
   */
  isDev?: boolean;
  /**
   * HTML shell to render. 
   * This should contain `<div id="zentify-app" data-page="..."></div>` 
   * and `<zentify-vite-scripts />` where the scripts will be injected.
   */
  htmlShell?: string;
  /**
   * Path to the Vite manifest file (for production).
   */
  manifestPath?: string;
  /**
   * If using React, inject Vite's React Refresh preamble.
   * Default: true
   */
  reactRefresh?: boolean;
}

const defaultHtmlShell = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Zentify App</title>
    <zentify-vite-scripts />
  </head>
  <body>
    <div id="zentify-app" data-page='{zentify-data}'></div>
  </body>
</html>
`;

export class ZentifyViteAdapter implements ZentifyAdapter, ZentifyViewEngine {
  name = "ZentifyViteAdapter";
  private options: ZentifyViteOptions;
  private viteDevServer?: ViteDevServer;
  
  constructor(options: ZentifyViteOptions) {
    this.options = {
      isDev: options.isDev !== undefined ? options.isDev : process.env.NODE_ENV !== "production",
      htmlShell: defaultHtmlShell,
      reactRefresh: true,
      ...options,
    };
  }

  async onInit(app: Zentify) {
    if (this.options.isDev) {
      try {
        this.viteDevServer = await createServer({
          server: { middlewareMode: true },
          appType: 'custom',
        });
        console.log("[ZentifyViteAdapter] Vite dev server initialized in middleware mode.");
      } catch (error) {
        console.error("[ZentifyViteAdapter] Failed to initialize Vite in middleware mode.", error);
      }
    }
  }

  getGlobalMiddleware() {
    return this.viteDevServer?.middlewares;
  }

  getViewEngine() {
    return this;
  }

  async render(page: string, props: Record<string, any>, req: ZRequest, res: ZResponse): Promise<void> {
    try {
      const isBridgeRequest = req.headers["x-zentify-bridge"] === "true";

      if (isBridgeRequest) {
        // Bridge Client Side Navigation: just send JSON
        res.setHeader("Content-Type", "application/json");
        res.json({ component: page, props });
        return;
      }

      // First Load: Send HTML Shell
      let html = this.options.htmlShell || defaultHtmlShell;
      
      // Inject scripts
      let scripts = "";
      if (this.options.isDev) {
        if (this.options.reactRefresh) {
          scripts += `
            <script type="module">
              import RefreshRuntime from '/@react-refresh'
              RefreshRuntime.injectIntoGlobalHook(window)
              window.$RefreshReg$ = () => {}
              window.$RefreshSig$ = () => (type) => type
              window.__vite_plugin_react_preamble_installed__ = true
            </script>
          `;
        }
        
        scripts += `
          <script type="module" src="/@vite/client"></script>
          <script type="module" src="/${this.options.entry}"></script>
        `;
      } else {
        // In production, we'd read the manifest.json and inject the hashed assets
        if (this.options.manifestPath) {
          try {
            const manifestContent = await fs.readFile(this.options.manifestPath, "utf-8");
            const manifest = JSON.parse(manifestContent);
            const entryChunk = manifest[this.options.entry];
            if (entryChunk && entryChunk.file) {
              scripts = `<script type="module" src="/${entryChunk.file}"></script>`;
              if (entryChunk.css) {
                for (const css of entryChunk.css) {
                  scripts += `\n<link rel="stylesheet" href="/${css}" />`;
                }
              }
            }
          } catch (error) {
            console.error("[ZentifyViteAdapter] Failed to read manifest.json", error);
          }
        }
      }

      html = html.replace("<zentify-vite-scripts />", scripts);
      
      // Apply Vite HTML transformations if in dev mode
      if (this.viteDevServer) {
        html = await this.viteDevServer.transformIndexHtml(req.url || '/', html);
      }
      
      // Inject initial data payload safely (escape quotes and script tags)
      const payload = JSON.stringify({ component: page, props })
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
        
      html = html.replace("'{zentify-data}'", `"${payload}"`);

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(html);
    } catch (error) {
      console.error("[ZentifyViteAdapter] Render Error:", error);
    }
  }
}
