import { defineConfig, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Nasdaq and Yahoo send no CORS headers, so the dev server forwards requests
// server-side with a browser User-Agent; both reject bare clients
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

function upstream(prefix: string, target: string): ProxyOptions {
  return {
    target,
    changeOrigin: true,
    rewrite: (path) => path.replace(prefix, ""),
    headers: { "User-Agent": BROWSER_UA, Accept: "application/json" },
    configure: (proxy) => {
      // Localhost origin and browser cookies only make the upstream more likely to refuse
      proxy.on("proxyReq", (proxyReq) => {
        proxyReq.removeHeader("origin");
        proxyReq.removeHeader("referer");
        proxyReq.removeHeader("cookie");
      });
    },
  };
}

const priceProxy: Record<string, ProxyOptions> = {
  "/api/nasdaq": upstream("/api/nasdaq", "https://api.nasdaq.com"),
  "/api/yahoo": upstream("/api/yahoo", "https://query1.finance.yahoo.com"),
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: priceProxy,
  },
  // `vite preview` serves the production build with the same proxy
  preview: {
    port: 8080,
    proxy: priceProxy,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
