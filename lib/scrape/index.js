// ytarc <https://github.com/msikma/ytarc>
// © MIT license

const tempy = require('tempy')
const rmfr = require('rmfr')
const fs = require('fs').promises
const path = require('path')
const cloneDeep = require('lodash.clonedeep')
const fg = require('fast-glob')
const {ScrapeError} = require('./error')
const {fileExists, moveFile, moveFileFallback} = require('../../util')
const {exec} = require('../../util/exec')
const {getDownloadCommand} = require('../commands')
const {checkDownloadLog} = require('../log')
const auxTasks = require('./aux')

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
    await moveFile(fromPath, toPath)
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
const performArchivingTask = async (cmd, type, cwd) => {
  const res = await exec(cmd, 'utf8', {logged: true})
  const logMeta = await checkDownloadLog(res.stdall, type)
  const base = logMeta.filebase

  if (logMeta.hasErrors) {
    throw new ScrapeError({reason: `ytarc: error: ${logMeta.errorDescription}`, base})
  }
  else if (res.code !== 0) {
    throw new ScrapeError({reason: `ytarc: error: yt-dlp exited abnormally.`, base})
  }

  await fs.mkdir(`${cwd}/${base}`, {recursive: true})

  if (logMeta.hasPrimaryOutputFile) {
    const info = JSON.parse(await fs.readFile(`${cwd}/${base}.info.json`, 'utf8'))
    const thumbExt = getThumbnailExtension(info)

    await fs.writeFile(`${cwd}/${base}/info.json`, JSON.stringify(info, null, 2), 'utf8')
    await moveFile(`${cwd}/${base}${thumbExt}`, `${cwd}/${base}/thumb${thumbExt}`)
  }

  await fs.writeFile(`${cwd}/${base}/log.txt`, logMeta.logContent, 'utf8')
  for (const file of await fg(`${cwd}/*.mp4`)) {
    await moveFile(`${file}`, `${cwd}/${base}/${logMeta.hasPrimaryOutputFile ? base : path.basename(file)}.mp4`)
  }
  await moveToBase(`${cwd}`, `${cwd}/${base}`, `live_chat.json`)
  await moveToBase(`${cwd}`, `${cwd}/${base}`, `rechat.json`)
  await optionalUnlink(`${cwd}/${base}.info.json`)
  await optionalUnlink(`${cwd}/${base}.description`)

  if (!logMeta.hasPrimaryOutputFile) {
    await fs.mkdir(`${cwd}/${base}/Metadata`, {recursive: true})
    for (const file of await fg(`${cwd}/*.json`)) {
      await moveFile(`${file}`, `${cwd}/${base}/Metadata/${path.basename(file)}`)
    }
    for (const file of await fg(`${cwd}/${base}/log.txt`)) {
      await moveFile(`${file}`, `${cwd}/${base}/Metadata/log.txt`)
    }
    for (const file of await fg(['opus', 'mp3', 'wav', 'm4a', 'ogg', '3gp', 'webm', 'mp4'].map(ext => `${cwd}/*.${ext}`))) {
      await moveFile(`${file}`, `${cwd}/${base}/${path.basename(file)}`)
    }
  }
  
  return base
}

const performAuxTasks = async (url, type, tmpDir) => {
  if (!Object.keys(auxTasks).includes(type)) {
    return true
  }
  console.log(`[ytarc] Performing auxiliary tasks for type: ${type}`)

  const res = await auxTasks[type].runAuxTasks(url, tmpDir)
  return res
}

/** Returns arguments ytarc was invoked with minus unneeded ones. */
const getDebugArgs = args => {
  const argsCloned = cloneDeep(args)
  delete argsCloned.URL
  return argsCloned
}

/**
 * Runs yt-dlp on a given URL and moves all output files into a separate directory.
 */
const runArchiver = async (url, args, cwd) => {
  console.log(`[ytarc] Archiving URL: ${url} ${JSON.stringify(getDebugArgs(args))}`)
  const tmpDir = tempy.directory()
  try {
    process.chdir(tmpDir)
    console.log(`[ytarc] Using temp directory: ${tmpDir}`)
    const [cmd, type] = getDownloadCommand(url, extractDownloadArgs(args), tmpDir)
    const archiveDir = await performArchivingTask(cmd, type, tmpDir)
    await performAuxTasks(url, type, `${tmpDir}/${archiveDir}`)
    const dst = await moveFileFallback(`${tmpDir}/${archiveDir}`, `${cwd}/${archiveDir}`)
    console.log(`[ytarc] Moved from "${tmpDir}" to "${dst}"`)
    if (!args.keepTmp) {
      console.log(`[ytarc] Deleting temp directory`)
      await rmfr(`${tmpDir}`)
    }
    else {
      console.log(`[ytarc] Keeping temp directory`)
    }
    process.chdir(cwd)
    return {success: true, url, tmpDir, destDir: `${cwd}/${archiveDir}`, err: null}
  }
  catch (err) {
    if (!args.keepTmp) {
      await rmfr(`${tmpDir}`)
    }
    else {
      console.log(`[ytarc] Error occurred, but keeping temp directory`)
    }
    process.chdir(cwd)
    return {success: false, url, err}
  }
}

module.exports = {
  runArchiver
}
