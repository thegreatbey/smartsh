import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  sourcemap: true,
  clean: true,
  dts: true,
  splitting: false,
  minify: process.env.NO_SWC ? false : true,
})
