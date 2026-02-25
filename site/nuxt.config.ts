// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',

  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
  },

  modules: ['@nuxt/ui'],

  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      title: 'CNT 4419 Study Hub',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'An interactive study tool for CNT 4419 Secure Software Development — AI-powered chat, quizzes, and annotated lecture notes.',
        },
        { name: 'theme-color', content: '#059669' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  devtools: { enabled: true },

  future: {
    compatibilityVersion: 4,
  },

  ssr: false,

  nitro: {
    preset: 'github_pages',
  },

  vite: {
    optimizeDeps: {
      exclude: ['@huggingface/transformers', '@mlc-ai/web-llm'],
    },
    worker: {
      format: 'es',
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('@huggingface/transformers')) return 'transformers'
            if (id.includes('@mlc-ai/web-llm')) return 'web-llm'
            if (id.includes('vue-pdf-embed') || id.includes('pdfjs-dist')) return 'pdf'
          },
        },
      },
    },
  },
})
