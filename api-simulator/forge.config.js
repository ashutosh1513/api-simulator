const path = require('path');
const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    // Copy the server folder to the resources directory
    extraResource: [
      path.resolve(__dirname, 'server')
    ],
    icon: path.resolve(__dirname, 'assets', 'icon') // no extension
  },

  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: "api_simulator",
        authors: "Ashutosh Mishra",
        description: "API Simulator Desktop App",
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
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {}
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true
    })
  ]
};
