import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';

import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { mainConfig } from './webpack.main.config';

import { rendererConfig } from './webpack.renderer.config';
import packageJSON from './package.json';
import MakerDMG from '@electron-forge/maker-dmg';

const APP_NAME = packageJSON.name;
const APP_VERSION = packageJSON.version;
const APP_COPYRIGHT = `${APP_NAME} copyright`;

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    appBundleId: process.env.APPLE_APP_ID,
    appCopyright: APP_COPYRIGHT,
    appVersion: APP_VERSION,
    executableName: APP_NAME,
    icon: 'src/assets/icons/mac/icon.icns',
    osxSign: {
      identity: process.env.APPLE_CERT_IDENTITY,
    },
    osxNotarize: {
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({}),
    // new MakerZIP({}, ['darwin']),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    new MakerDMG({
      format: 'UDBZ',
      icon: 'src/assets/icons/mac/icon.icns',
    }),
    new MakerRpm({}),
    new MakerDeb({})
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/renderer.ts',
            name: 'main_window',
            preload: {
              js: './src/preload.ts',
            },
          },
        ],
      },
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'shendepu',
          name: 'electron-forge-publish-test'
        },
        prerelease: true
      }
    }
  ],
};

export default config;
