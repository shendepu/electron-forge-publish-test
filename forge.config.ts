import dotenv from 'dotenv';
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
console.log('NODE_ENV', process.env.NODE_ENV);

const env = process.env.NODE_ENV || 'development'; // 默认为 development 环境
if (env !== 'production') dotenv.config({ path: `.env.${env}` });

const APP_NAME = packageJSON.name;
const APP_VERSION = packageJSON.version;
const APP_COPYRIGHT = `${APP_NAME} copyright`;

const isMas = process.env.EF_PLATFORM === 'mas';
// const isDarwin = process.env.EF_PLATFORM === 'darwin';


/* Important notice:

  Mac App Distribution certificate is used for signing child directories under xxx.app/, while xxx.app that
  is top level directory should be signed by Mac Installer Distribution certificate.

  for outside of Mac App Store build, Developer ID Application certificate is used to sign app.

  https://github.com/electron/electron/blob/main/docs/tutorial/mac-app-store-submission-guide.md
 */
const osxSignIdentity = isMas ? process.env.APPLE_MAS_APP_CERT_IDENTITY : process.env.APPLE_DEV_ID_CERT_IDENTITY;
const osxSignProvisionProfile = isMas ? process.env.APPLE_MAS_APP_PROVISION_PROFILE : undefined

const sortedEnv: { [key: string]: string | undefined } = Object.keys(process.env)
  .sort() // Sort keys alphabetically
  .reduce((acc: { [key: string]: string | undefined }, key: string) => {
    if (key.startsWith('APPLE_') || key.startsWith('EF_') || key.includes('GITHUB'))
      acc[key] = process.env[key];
    return acc;
  }, {});

console.log(sortedEnv);

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    appBundleId: process.env.APPLE_APP_ID,
    appCopyright: APP_COPYRIGHT,
    appVersion: APP_VERSION,
    executableName: APP_NAME,
    icon: 'src/assets/icons/mac/icon.icns',
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    platform: process.env.EF_PLATFORM,
    osxSign: {
      identity:  osxSignIdentity,
      optionsForFile: (filePath) => ({
        hardenedRuntime: true,
        "signature-flags": "deep",
      }),
      provisioningProfile: osxSignProvisionProfile,
    },
    osxNotarize: isMas ? undefined : {
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      iconUrl: __dirname + '/src/assets/icons/win/icon.ico',
      setupIcon: __dirname + '/src/assets/icons/win/icon.ico',
      version: APP_VERSION,
    }),
    new MakerZIP({}, ["win32"]),
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      config: {
        icon: 'src/assets/icons/mac/icon.icns',
        format: 'UDBZ'
      }
    },
    {
      name: '@electron-forge/maker-pkg',
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      platforms: ['mas'],
      config: {
        icon: 'src/assets/icon',
        name: `${APP_NAME}-${APP_VERSION}-universal-mas`,
        identity: process.env.APPLE_MAS_INSTALLER_CERT_IDENTITY,
      }
    },
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
        authToken: process.env.PUBLISH_GITHUB_AUTH_TOKEN,
        repository: {
          owner: 'shendepu',
          name: 'electron-forge-simple-app',
        },
        prerelease: true
      }
    }
  ],
};

export default config;
