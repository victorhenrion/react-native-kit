const { getDefaultConfig } = require('expo/metro-config')
const { mergeConfig } = require('metro-config')
const { resolve } = require('path')

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
const config = {
    resolver: {
        nodeModulesPaths: [resolve(__dirname, 'node_modules')],
        unstable_enablePackageExports: true,
    },
    server: {
        unstable_serverRoot: __dirname,
    },
}

module.exports = mergeConfig(getDefaultConfig(__dirname), config)
