import { useState } from 'react';
import { dialog, app } from '@electron/remote';
import { createRoot } from 'react-dom/client';
import os from 'os';
import path from 'path';
import childProcess from 'child_process';
export const isDev = process.env.NODE_ENV !== 'production';
export const appPath = app.getAppPath();
export const DEFAULT_VIDEO_EXT = [
  '3gp',
  'mp4',
  'webm',
  'mov',
  'rmvb',
  'rm',
  'avi',
  'flv',
  'mpg',
  'mkv',
  'hevc',
  'm4v',
  'wmv',
  'ts',
];

console.log('is dev: ', isDev);

const prefix = isDev
  ? `${appPath}/ffmpeg/${os.platform()}`
  : path.resolve(appPath, '../');

console.log('prefix: ', prefix);
const ffprobeBin = `${prefix}/ffprobe`;

export type metaOut = {
  format: {
    duration: string;
    size: string;
    bit_rate: string;
  };
};

export const getMetaData = (
  filePath: string,
): Promise<{ duration: number; size: number; bitRate: number }> => {
  return new Promise((resolve, reject) => {
    filePath = filePath.replace(/"/g, '\\"');
    const cmd = `${ffprobeBin} -v error -show_entries format=duration,size,bit_rate  -of json "${filePath}"`;
    childProcess.exec(cmd, (e, stdout, stderr) => {
      const errorInfo = `FileParse Error! filePath: ${filePath}`;
      if (e) {
        reject(errorInfo + `, error: ${e}`);
      }
      try {
        const out: metaOut = JSON.parse(stdout);
        resolve({
          duration: Number(out.format.duration),
          size: Number(out.format.size),
          bitRate: Number(out.format.bit_rate),
        });
      } catch (e) {
        reject(errorInfo + `, parse error: ${stdout}`);
      }
    });
  });
};

const App = () => {
  const [dialogResult, setDialogResult] = useState<any>();
  const [fileMeta, setFileMeta] = useState<any>();

  const onButtonClick = async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'openFile', 'multiSelections'],
      filters: [
        {
          name: 'Media Files',
          extensions: DEFAULT_VIDEO_EXT,
        },
      ],
    });

    console.log('dialog result: ', result);
    console.log('result.filePaths: ', result.filePaths);
    console.log('result.bookmarks: ', result.bookmarks);

    setDialogResult({
      filePaths: result.filePaths,
      bookmarks: result.bookmarks,
    });

    result.filePaths.map(async filePath => {
      console.log(`\n------------ process file ${filePath} --------------`);
      try {
        const fileMeta = await getMetaData(filePath);
        console.log('file meta: ', fileMeta);
        setFileMeta(fileMeta);
      } catch (error) {
        console.error(error);
      }
    });
  };

  return (
    <div>
      <h2>Simple App</h2>

      <button onClick={onButtonClick}>Test</button>

      {dialogResult && (
        <div>
          <div style={{ marginBottom: 20 }}>
            ================== dialogResult ===================
          </div>
          <div style={{ marginBottom: 10 }}>
            filePaths: {JSON.stringify(dialogResult.filePaths)}
          </div>
          <div style={{ marginBottom: 10 }}>
            bookmarks:{' '}
            {typeof dialogResult.bookmarks !== 'undefined'
              ? JSON.stringify(dialogResult.bookmarks)
              : 'undefined'}
          </div>
        </div>
      )}

      {fileMeta && (
        <div>
          <div style={{ marginBottom: 20 }}>
            ================ meta data =================
          </div>
          <div style={{ marginBottom: 10 }}>
            fileMeta:{' '}
            {typeof fileMeta !== undefined
              ? JSON.stringify(fileMeta)
              : 'undefined'}
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
