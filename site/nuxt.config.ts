const SITE_TITLE = 'CNT 4419 Study Hub'
const SITE_DESCRIPTION =
  'An interactive study tool for CNT 4419 Secure Software Development — AI-powered chat, quizzes, flashcards, and annotated lecture notes.'
const SITE_URL = 'https://trevorflahardy.github.io/cnt_4419_class_notes/'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',

  colorMode: {
    preference: 'light',
    fallback: 'light',
    classSuffix: '',
  },

  modules: ['@nuxt/ui'],

  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      title: SITE_TITLE,
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: SITE_DESCRIPTION },
        { name: 'theme-color', content: '#059669' },

        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: SITE_TITLE },
        { property: 'og:description', content: SITE_DESCRIPTION },
        { property: 'og:url', content: SITE_URL },
        { property: 'og:site_name', content: SITE_TITLE },
        { property: 'og:locale', content: 'en_US' },

        // Twitter / Discord card
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: SITE_TITLE },
        { name: 'twitter:description', content: SITE_DESCRIPTION },
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
