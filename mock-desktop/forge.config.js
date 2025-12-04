const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true,
    asarUnpack: [
      // unpack server so it can be spawned at runtime
      'server/**'
    ],
    icon: path.resolve(__dirname, 'assets', 'icon') // base name (icon.ico, icon.icns)
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'mock_desktop',
        authors: 'Ashutosh Mishra',
        description: 'Mock Desktop — an API mocking & testing desktop app',
        setupIcon: path.resolve(__dirname, 'assets', 'icon.ico'),
        noMsi: true
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32']
    },
    {
      name: '@electron-forge/maker-deb',
      config: {}
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {}
    }
  ],
  plugins: [
    { name: '@electron-forge/plugin-auto-unpack-natives' },
    new FusesPlugin({
      version: 1,
      // fuse options...
    })
  ]
};
