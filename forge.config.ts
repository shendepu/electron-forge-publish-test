import dotenv from 'dotenv';
import path from "path";
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

const env = process.env.NODE_ENV || 'development'; // 默认为 development 环境
console.log('environment: ', env);

if (env !== 'production') dotenv.config({ path: `.env.${env}` });

const {
  EF_PLATFORM,
  APPLE_ID,
  APPLE_ID_PASSWORD,
  APPLE_TEAM_ID,
  APPLE_APP_ID,
  APPLE_MAS_APP_CERT_IDENTITY,
  APPLE_MAS_INSTALLER_CERT_IDENTITY,
  APPLE_MAS_APP_PROVISION_PROFILE,
  APPLE_DEV_ID_CERT_IDENTITY,
  APPLE_MAC_APP_PROVISION_PROFILE,
  PUBLISH_GITHUB_AUTH_TOKEN,
} = process.env;

const APP_NAME = packageJSON.productName;
const APP_VERSION = packageJSON.version;
const APP_COPYRIGHT = `${APP_NAME} copyright`;

const isMas = EF_PLATFORM === 'mas';

console.log('Sign certificate: ', isMas ? APPLE_MAS_APP_CERT_IDENTITY : APPLE_DEV_ID_CERT_IDENTITY)

/* Important notice:

  Mac App Distribution certificate is used for signing child directories under xxx.app/, while xxx.app that
  is top level directory should be signed by Mac Installer Distribution certificate.

  for outside of Mac App Store build, Developer ID Application certificate is used to sign app.

  https://github.com/electron/electron/blob/main/docs/tutorial/mac-app-store-submission-guide.md
 */

const sortedEnv: { [key: string]: string | undefined } = Object.keys(process.env)
  .sort() // Sort keys alphabetically
  .reduce((acc: { [key: string]: string | undefined }, key: string) => {
    if (key.startsWith('APPLE_') || key.startsWith('EF_') || key.includes('GITHUB'))
      acc[key] = process.env[key];
    return acc;
  }, {});

console.log(sortedEnv);

// https://github.com/electron/osx-sign/blob/afb5d3828bc44ec1ecfd8d7768bba5a5620a068a/src/sign.ts#L91
const getEntitlements = (filePath: string, platform: string) => {
  const entitlementsFolder = path.resolve(__dirname, 'entitlements');

  let entitlementsFile: string;
  if (platform === 'darwin') {
    entitlementsFile = path.resolve(entitlementsFolder, 'darwin.plist');
    if (filePath.includes('(Plugin).app')) {
      entitlementsFile = path.resolve(entitlementsFolder, 'darwin.plugin.plist');
    } else if (filePath.includes('(GPU).app')) {
      entitlementsFile = path.resolve(entitlementsFolder, 'darwin.gpu.plist');
    } else if (filePath.includes('(Renderer).app')) {
      entitlementsFile = path.resolve(entitlementsFolder, 'darwin.renderer.plist');
    }
  } else {
    entitlementsFile = path.resolve(entitlementsFolder, 'mas.plist');

    if (filePath.includes('.app/')) {
      entitlementsFile = path.resolve(entitlementsFolder, 'mas.child.plist');
    }
  }
  return entitlementsFile;
}

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    appBundleId: APPLE_APP_ID,
    appCopyright: APP_COPYRIGHT,
    appVersion: APP_VERSION,
    executableName: APP_NAME,
    icon: 'src/assets/icons/mac/icon.icns',
    // ignore: (file: string) => {
    //   if (!file) return false;
    //   const jsonStats = false
    //   if (jsonStats) {
    //     if (file.endsWith(path.join('.webpack', 'main', 'stats.json'))) return true;
    //     if (file.endsWith(path.join('.webpack', 'renderer', 'stats.json'))) return true;
    //   }
    //   const packageSourceMaps = false
    //   if (!packageSourceMaps && /[^/\\]+\.js\.map$/.test(file)) {
    //     return true;
    //   }
    //
    //   return !(/^[/\\]\.webpack($|[/\\]).*$/.test(file) || file.startsWith('/node_modules'));
    // },
    // extendInfo: {
    //   ElectronTeamID: 'NHTCLRDA6A',
    // },
    // // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // // @ts-ignore
    // platform: EF_PLATFORM,
    osxSign: {
      identity: isMas ? APPLE_MAS_APP_CERT_IDENTITY : APPLE_DEV_ID_CERT_IDENTITY,
      identityValidation: true,
      type: "distribution",
      preAutoEntitlements: true,
      preEmbedProvisioningProfile: true,
      provisioningProfile: isMas ? APPLE_MAS_APP_PROVISION_PROFILE : APPLE_MAC_APP_PROVISION_PROFILE,
      optionsForFile: (filePath) => ({
        hardenedRuntime: true,
        entitlements:  getEntitlements(filePath, EF_PLATFORM),
      }),
    },
    osxNotarize: isMas ? undefined : {
      appleId: APPLE_ID,
      appleIdPassword: APPLE_ID_PASSWORD,
      teamId: APPLE_TEAM_ID,
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
        identity: isMas ? APPLE_MAS_INSTALLER_CERT_IDENTITY : APPLE_DEV_ID_CERT_IDENTITY,
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
      [FuseV1Options.RunAsNode]: true,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
      [FuseV1Options.GrantFileProtocolExtraPrivileges]: true,
    }),
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        authToken: PUBLISH_GITHUB_AUTH_TOKEN,
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
