import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    target: 'es2022',
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['demo.pdf', 'specialized.json', 'phrases.json'],
      manifest: {
        name: '典读鸡 · Web 版',
        short_name: '典读鸡',
        description: '浏览器内点读翻译：PDF/TXT/DOCX 点词即查',
        lang: 'zh-CN',
        theme_color: '#2f6fed',
        background_color: '#f6f7f9',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // The dictionary chunks are large; precache them so the app works
        // fully offline after the first visit.
        globPatterns: ['**/*.{js,css,html,png,json,gz,pdf}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
});
