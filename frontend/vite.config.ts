import fs from "node:fs"
import { resolve } from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const onnxDistDir = resolve(
  __dirname,
  "node_modules/.pnpm/onnxruntime-web@1.26.0/node_modules/onnxruntime-web/dist"
)

const vadAssetsPlugin = {
  name: "vad-assets",
  configureServer(server: import("vite").ViteDevServer) {
    server.middlewares.use((request, response, next) => {
      response.setHeader("Cross-Origin-Opener-Policy", "same-origin")
      response.setHeader("Cross-Origin-Embedder-Policy", "require-corp")

      // Intercept onnxruntime .mjs loader requests before Vite's module pipeline.
      // Files in /public cannot be imported as ES modules by Vite, so we serve
      // them directly from node_modules here, bypassing that restriction.
      const url = request.url ?? ""
      const match = url.match(/^\/(ort-wasm-simd-threaded[^?]*\.mjs)(\?.*)?$/)
      if (match) {
        const filePath = resolve(onnxDistDir, match[1])
        if (fs.existsSync(filePath)) {
          response.setHeader("Content-Type", "application/javascript; charset=utf-8")
          fs.createReadStream(filePath).pipe(response)
          return
        }
      }

      next()
    })
  }
}

export default defineConfig({
  plugins: [react(), vadAssetsPlugin],
  resolve: {
    alias: { "@": resolve(__dirname, "./src") }
  },
  server: { port: 5173 }
})
