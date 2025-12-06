/**
 * Mock for fs-extra using memfs
 *
 * This mock is used across all tests to provide a consistent
 * in-memory file system using memfs.
 */

const { vol, fs: memfsInstance } = require('memfs');
const { promisify } = require('util');

module.exports = {
  ...memfsInstance,
  readFile: promisify(memfsInstance.readFile),
  writeFile: promisify(memfsInstance.writeFile),
  readdir: promisify(memfsInstance.readdir),
  stat: promisify(memfsInstance.stat),
  mkdir: promisify(memfsInstance.mkdir),
  unlink: promisify(memfsInstance.unlink),
  readJson: async (filePath) => {
    const content = await promisify(memfsInstance.readFile)(filePath, 'utf8');
    return JSON.parse(content);
  },
  writeJson: async (filePath, obj) => {
    const content = JSON.stringify(obj, null, 2);
    return await promisify(memfsInstance.writeFile)(filePath, content, 'utf8');
  },
  pathExists: async (filePath) => {
    try {
      await promisify(memfsInstance.stat)(filePath);
      return true;
    } catch {
      return false;
    }
  },
  ensureDir: async (dirPath) => {
    return await promisify(memfsInstance.mkdir)(dirPath, { recursive: true });
  },
  remove: async (filePath) => {
    return await promisify(memfsInstance.unlink)(filePath);
  }
};
