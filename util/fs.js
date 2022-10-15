// ytarc <https://github.com/msikma/ytarc>
// © MIT license

const path = require('path')
const fs = require('fs').promises
const constants = require('fs')
const mv = require('mv')
const filenamify = require('filenamify')
const {wrapInArray} = require('./data')

/**
 * Cleans a string so that it can be used as a filename.
 */
const sanitizeFilename = fn => {
  // One exception: replace colon followed by whitespace with " - ".
  const colonToDash = fn.replace(/([^\s]):(\s)/g, '$1 -$2')
  // Run the rest through filenamify() and replace invalid characters with underscores.
  return filenamify(colonToDash, {replacement: '_'})
}

/**
 * Moves a file or directory from one place to the other.
 */
const moveFile = (src, dst) => new Promise((resolve, reject) => {
  mv(src, dst, {mkdirp: true}, function(err) {
    if (err) {
      return reject(err)
    }
    return resolve()
  });
})

/**
 * Moves a file or directory from one place to the other with fallback if the target already exists.
 * 
 * If the target already exists, we will add "2", then "3", etc. at the end of the target filename.
 */
const moveFileFallback = (src, dst) => new Promise(async (resolve, reject) => {
  let n = 1
  let freeDst = dst
  while (true) {
    const dstPath = path.parse(dst)
    if (await fileExists(freeDst)) {
      if (n > 100) {
        break
      }
      n += 1
      freeDst = `${dstPath.dir}/${dstPath.name} ${n}${dstPath.ext}`
      continue
    }
    break
  }
  mv(src, freeDst, {mkdirp: true}, function(err) {
    if (err) {
      return reject(err)
    }
    return resolve(freeDst)
  });
})

/**
 * Ensures that a given list of paths all exist.
 */
const ensureDir = async paths => {
  // Ensure we don't check paths multiple times.
  const dirs = [...new Set(wrapInArray(paths))]
  return Promise.all(dirs.map(dir => fs.mkdir(dir, {recursive: true})))
}

/**
 * Checks whether a certain access level applies to a given file path.
 * 
 * This checks whether a file is readable, writable or visible and returns a boolean.
 */
const fileAccessCheck = async (filepath, access) => {
  try {
    return await fs.access(filepath, access) == null
  }
  catch (err) {
    // If the file does not exist or we don't have permission for a given access level, return false.
    if (err.code === 'ENOENT' || err.code === 'EACCES') {
      return false
    }
    // Otherwise, something unexpected went wrong that the caller should know about.
    throw err
  }
}

/** Checks whether a file or path exists. */
const fileExists = filepath => fileAccessCheck(filepath, constants.F_OK)
/** Checks whether a file or path is writable. */
const fileIsWritable = filepath => fileAccessCheck(filepath, constants.W_OK)
/** Checks whether a file or path is readable. */
const fileIsReadable = filepath => fileAccessCheck(filepath, constants.R_OK)

module.exports = {
  ensureDir,
  sanitizeFilename,
  moveFile,
  moveFileFallback,
  fileAccessCheck,
  fileExists,
  fileIsWritable,
  fileIsReadable
}
