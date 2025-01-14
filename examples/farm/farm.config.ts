import { promises as fs } from 'node:fs'
import { defineConfig } from '@farmfe/core'
import prism from 'markdown-it-prism'
import Markdown from 'unplugin-vue-markdown/farm'
import Vue from 'unplugin-vue/farm'
// import Inspect from 'vite-plugin-inspect'
// import Pages from 'vite-plugin-pages'

export default defineConfig({
  plugins: [
    Markdown({
      markdownItOptions: {

      },
      headEnabled: true,
      markdownItUses: [
        prism,
      ],
    }),
    Vue({
      include: [/\.vue$/, /\.md$/],
    }),

    base(),

  ],
  compilation: {
    progress: false,
    persistentCache: false,
  }
})

function base() {
  return {
    name: 'farm-load-vue-module-type',
    priority: -100,
    load: {
      filters: {
        resolvedPaths: ['.vue'],
      },
      executor: async (param) => {
        const content = await fs.readFile(param.resolvedPath, 'utf-8')

        return {
          content,
          moduleType: 'js',
        }
      },
    },
  }
}
