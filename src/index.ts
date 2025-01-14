import type { UnpluginFactory } from 'unplugin'
import type { Options } from './types'
import { createFilter } from '@rollup/pluginutils'
import { createUnplugin } from 'unplugin'
import { createMarkdown } from './core/markdown'
import { resolveOptions } from './core/options'
import fs from 'node:fs/promises'
const cssIdRE = /\.(css|postcss|sass|scss|less|stylus|styl)($|\?)/

export const unpluginFactory: UnpluginFactory<Options> = (userOptions = {}) => {
  const options = resolveOptions(userOptions)
  const markdownToVue = createMarkdown(options)

  const filter = createFilter(
    userOptions.include || /\.md$|\.md\?vue/,
    userOptions.exclude || cssIdRE,
  )

  return {
    name: 'unplugin-vue-markdown',
    enforce: 'pre',
    transformInclude(id) {
      return filter(id)
    },
    async transform(raw, id) {
      try {
        return await markdownToVue(id, raw)
      }
      catch (e: any) {
        this.error(e)
      }
    },
    vite: {
      async handleHotUpdate(ctx) {
        if (!filter(ctx.file))
          return

        const defaultRead = ctx.read
        ctx.read = async function () {
          return (await markdownToVue(ctx.file, await defaultRead())).code
        }
      },
    },
    farm: {
      priority: 103,
      load: {
        filters: {
          resolvedPaths: ['.md'],
        },
        executor: async (param) => {
          const content = await fs.readFile(param.resolvedPath, 'utf-8')
          return {
            content,
            moduleType: 'md',
          }
        },
      },
      updateModules: {
        async executor(ctx) {
          if (!filter(ctx.file))
            return

          const defaultRead = ctx.read
          ctx.read = async function () {
            return (await markdownToVue(ctx.file, await defaultRead())).code
          }
        }
      }
    }
  }
}

export default /* #__PURE__ */ createUnplugin(unpluginFactory)
