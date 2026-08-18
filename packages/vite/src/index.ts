import { ZentifyViewEngine, ZentifyAdapter, Zentify, ZRequest, ZResponse, Logger, ConfigService } from "@zentify/core";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as url from "node:url";
import type { ViteDevServer } from "vite";
export interface ZentifyViteOptions {
  /**
   * The entry point for the Vite Dev Server.
   * Typically 'src/main.tsx' or 'src/main.ts'.
   */
  entry: string;
  /**
   * Rendering mode: Client-Side Rendering or Server-Side Rendering
   * Default: 'csr'
   */
  mode?: "csr" | "ssr";
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
  /**
   * Extra `define` values merged into Vite (applied on top of FRONTEND_* envs).
   */
  define?: Record<string, string>;
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
  private logger: Logger = new Logger({context: "ViteAdapter"})
  
  constructor(options: ZentifyViteOptions) {
    this.options = {
      mode: options.mode || "csr",
      isDev: options.isDev !== undefined ? options.isDev : process.env.NODE_ENV !== "production",
      htmlShell: defaultHtmlShell,
      reactRefresh: true,
      manifestPath: "./dist/public/.vite/manifest.json",
      ...options,
    };

  }

  async onInit(app: Zentify) {
    if (this.options.isDev) {
      try {
        const { createServer } = await import("vite");
        this.viteDevServer = await createServer({
          server: { middlewareMode: true },
          appType: 'custom',
          envPrefix: ["VITE_", "FRONTEND_"],
          ssr: { noExternal: ["@zentify/react"] },
          define: {
            ...this.options.define,
            ...ConfigService.getFrontendEnvs(),
            __ZENTIFY_FRONTEND_ENV__: JSON.stringify(ConfigService.getFrontendEnvMap()),
          },
        });
        this.logger.info("Vite dev server initialized in middleware mode.");
      } catch (error) {
        this.logger.error("Failed to initialize Vite in middleware mode.", error);
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
            this.logger.error("Failed to read manifest.json", error);
          }
        }
      }

      html = html.replace("<zentify-vite-scripts />", scripts);
      
      // Apply Vite HTML transformations if in dev mode
      if (this.viteDevServer) {
        html = await this.viteDevServer.transformIndexHtml(req.url || '/', html);
      }
      
      let appHtml = "";
      if (this.options.mode === "ssr") {
        try {
          if (this.viteDevServer) {
            await this.viteDevServer.ssrLoadModule("/" + this.options.entry);
          } else {
            // Load production server bundle using manifest to handle hashed filenames
            const serverManifestPath = path.resolve(process.cwd(), "dist/server/.vite/manifest.json");
            const manifestContent = await fs.readFile(serverManifestPath, "utf-8");
            const manifest = JSON.parse(manifestContent);
            const entryChunk = manifest[this.options.entry];
            
            if (!entryChunk || !entryChunk.file) {
              throw new Error(`Could not find SSR entry '${this.options.entry}' in server manifest`);
            }
            
            const serverBundlePath = path.resolve(process.cwd(), "dist/server", entryChunk.file);
            const fileUrl = url.pathToFileURL(serverBundlePath).href;
            await import(fileUrl);
          }
          
          const ssr = (globalThis as any).__ZENTIFY_SSR__;
          if (ssr && ssr.render) {
            appHtml = await ssr.render({ component: page, props });
          }
        } catch (error) {
          this.logger.error("SSR Error:", error);
        }
      }
      
      // Inject appHtml into the shell
      html = html.replace(
        /<div id="zentify-app"([^>]*)><\/div>/, 
        `<div id="zentify-app"$1>${appHtml}</div>`
      );

      
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
      this.logger.error("Render Error:", error);
    }
  }
}
