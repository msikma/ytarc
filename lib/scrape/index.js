// ytarc <https://github.com/msikma/ytarc>
// © MIT license

const tempy = require('tempy')
const rmfr = require('rmfr')
const fs = require('fs').promises
const path = require('path')
const chalk = require('chalk')
const fg = require('fast-glob')
const {ScrapeError} = require('./error')
const {fileExists} = require('../../util')
const {exec} = require('../../util/exec')
const {getDownloadCommand} = require('../commands')
const {checkDownloadLog} = require('../log')

/**
 * Returns the extension of the preferred thumbnail.
 */
const getThumbnailExtension = info => {
  const sorted = info.thumbnails.sort((a, b) => b.preference - a.preference)
  return path.parse(sorted[0].url).ext
}

/**
 * Moves a file into the target basedir if it exists.
 */
const moveToBase = async (from, to, fn) => {
  const fromPath = `${from}/${fn}`
  const toPath = `${to}/${fn}`
  if (await fileExists(fromPath)) {
    await fs.rename(fromPath, toPath)
  }
}

/**
 * Extracts arguments relevant for the downloader.
 */
const extractDownloadArgs = args => {
  return {
    dateFirst: args.dateFirst ?? false
  }
}

/**
 * Optionally unlinks a file.
 */
const optionalUnlink = async fn => {
  try {
    await fs.unlink(fn)
  }
  catch {}
}

/**
 * Runs the actual archiving commands.
 * 
 * Returns the directory the files were placed in.
 */
const performArchivingTask = async (cmd, cwd) => {
  const res = await exec(cmd, 'utf8', {logged: true})
  const logMeta = checkDownloadLog(res.stdall)
  const base = logMeta.filebase

  if (logMeta.hasErrors) {
    throw new ScrapeError({reason: `ytarc: error: ${logMeta.errorDescription}`, base})
  }
  else if (res.code !== 0) {
    throw new ScrapeError({reason: `ytarc: error: yt-dlp exited abnormally.`, base})
  }

  const info = JSON.parse(await fs.readFile(`${cwd}/${base}.info.json`, 'utf8'))
  const thumbExt = getThumbnailExtension(info)

  await fs.mkdir(`${cwd}/${base}`, {recursive: true})
  await fs.writeFile(`${cwd}/${base}/log.txt`, logMeta.logContent, 'utf8')
  await fs.writeFile(`${cwd}/${base}/info.json`, JSON.stringify(info, null, 2), 'utf8')
  await fs.rename(`${cwd}/${base}.mp4`, `${cwd}/${base}/${base}.mp4`)
  await fs.rename(`${cwd}/${base}${thumbExt}`, `${cwd}/${base}/thumb${thumbExt}`)
  await moveToBase(`${cwd}`, `${cwd}/${base}`, `live_chat.json`)
  await moveToBase(`${cwd}`, `${cwd}/${base}`, `rechat.json`)
  await fs.unlink(`${cwd}/${base}.info.json`)
  await optionalUnlink(`${cwd}/${base}.description`)
  
  return base
}

/**
 * Runs yt-dlp on a given URL and moves all output files into a separate directory.
 */
const runArchiver = async (url, args, cwd) => {
  const tmpDir = tempy.directory()
  try {
    process.chdir(tmpDir)
    console.log(`[ytarc] Using temp directory: ${tmpDir}`)
    const cmd = getDownloadCommand(url, extractDownloadArgs(args), tmpDir)
    const archiveDir = await performArchivingTask(cmd, tmpDir)
    await fs.rename(`${tmpDir}/${archiveDir}`, `${cwd}/${archiveDir}`)
    await rmfr(`${tmpDir}`)
    process.chdir(cwd)
    return true
  }
  catch (err) {
    await rmfr(`${tmpDir}`)
    process.chdir(cwd)
    return false
  }
}

module.exports = {
  runArchiver
}
