import { writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exploreDirectory } from '../misc/fs-helpers.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const ROOT_PATH = join(__dirname, '../../../');
const INDEX_PATH = join(ROOT_PATH, 'index.ts');
const SRC_PATH = join(ROOT_PATH, 'src');

const FILE_NAME_REGEXP = new RegExp('^(.*(?<!(?:test|spec|private)))\\.ts$');

function generateIndexFile(
  {
    dry = true,
  },
) {
  const paths = [];

  return exploreDirectory(SRC_PATH, (subPath, entry) => {
    if (entry.isFile()) {
      const relativePath = relative(ROOT_PATH, subPath);

      FILE_NAME_REGEXP.lastIndex = 0;
      const match = FILE_NAME_REGEXP.exec(relativePath);
      if (match !== null) {
        paths.push(match[1]);
      }
    }
  })
    .then(() => {
      if (dry) {
        console.log(paths.join('\n'));
      } else {
        return writeFile(
          INDEX_PATH,
          paths
            .map((path) => {
              return `export * from './${path}';`;
            })
            .join('\n'),
        );
      }
    });
}

const dry = process.argv.includes('--dry');

generateIndexFile({ dry })
  .catch((error) => {
    console.error(error);
  });
