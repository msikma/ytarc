// asl_scrape <https://github.com/msikma/asl_scrape>
// © MIT license

const fs = require('fs').promises
const path = require('path')
const chalk = require('chalk')
const fg = require('fast-glob')
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
 * Runs yt-dlp on a given URL and moves all output files into a separate directory.
 */
const runArchiver = async (url, cwd) => {
  const cmd = getDownloadCommand(url, cwd)
  const res = await exec(cmd, 'utf8', {logged: true})
  const logMeta = checkDownloadLog(res.stdall)
  const base = logMeta.filebase

  if (logMeta.hasErrors) {
    console.error(`ytarc: error: ${logMeta.errorDescription}`)
  }
  else if (res.code !== 0) {
    console.error(`ytarc: error: yt-dlp exited abnormally.`)
  }
  if (logMeta.hasErrors || res.code !== 0) {
    //await fs.unlink(`${cwd}/archive.log`)
    console.log('unlink files here')
  }

  const info = JSON.parse(await fs.readFile(`${cwd}/${base}.info.json`, 'utf8'))
  const thumbExt = getThumbnailExtension(info)

  await fs.mkdir(`${cwd}/${base}`, {recursive: true})
  await fs.writeFile(`${cwd}/${base}/log.txt`, logMeta.logContent, 'utf8')
  await fs.writeFile(`${cwd}/${base}/info.json`, JSON.stringify(info, null, 2), 'utf8')
  await fs.rename(`${cwd}/${base}.mp4`, `${cwd}/${base}/${base}.mp4`)
  await fs.rename(`${cwd}/${base}${thumbExt}`, `${cwd}/${base}/thumb${thumbExt}`)
  await fs.unlink(`${cwd}/${base}.info.json`)
  await fs.unlink(`${cwd}/${base}.description`)
  
  return true
}

module.exports = {
  runArchiver
}