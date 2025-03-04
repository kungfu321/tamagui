// see core/static

if (process.env.TAMAGUI_COMPILE_PROCESS !== 1) {
  process.env.TAMAGUI_COMPILE_PROCESS = 1
}
process.env.IS_STATIC = 'is_static'
try {
  const all = {
    ...require('../dist/static'),
    aliasPlugin: require('./esbuildAliasPlugin'),
  }
  process.env.IS_STATIC = undefined
  Object.assign(exports, all)
} catch (err) {
  console.log('Error loading @tamagui/core-node', err)
}
