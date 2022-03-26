// ytarc <https://github.com/msikma/ytarc>
// © MIT license

const path = require('path')
const fs = require('fs').promises
const {getDestinationFromData} = require('../scrape/aux/youtube-music')

/**
 * Does post-processing on the log file contents and returns the processed log contents.
 */
const cleanLog = (logContent) => {
  let log = logContent
  if (!log.endsWith('\n')) {
    log = `${log}\n`
  }
  return log
}

/**
 * Returns a human readable description of the error that occurred.
 */
const getErrorDescription = (errors, hasErrors) => {
  if (!hasErrors) return null
  
  if (errors.formatNotAvailable) {
    return `Given format was not available.`
  }
  if (errors.unknownServerName || errors.unableToDownload) {
    return `Server name not known or video data unavailable. Try again later.`
  }
  if (errors.pythonTraceback) {
    return `An exception occurred while running yt-dlp.`
  }
  return `Unknown error; see log for details.`
}

/**
 * Returns the video destination.
 * 
 * If multiple destination keywords are found, the first without 'json' in it is preferred.
 * This is very hacky.
 */
const findVideoDestination = (log) => {
  const destinationPaths = log.match(/\[download\] destination: (.+?)$/gmi)
    .map(n => n.trim())
    .sort((a, b) => a.endsWith('json') ? 1 : -1)
  if (!destinationPaths.length) return null
  return destinationPaths[0].match(/\[download\] destination: (.+?)$/mi)?.[1]
}

const findDestination = async (log, type) => {
  const destinationPath = findVideoDestination(log)
  if (type === 'youtube-music') {
    const destinationObj = path.parse(destinationPath)
    const jsonPath = path.join(destinationObj.dir, `${destinationObj.name}.info.json`)
    const json = JSON.parse(await fs.readFile(jsonPath, 'utf8'))
    const destinationFromData = getDestinationFromData(json)
    return [destinationFromData, false]
  }
  else {
    const mergePath = log.match(/\[Merger\] Merging formats into "(.+?)"$/mi)?.[1].trim()
    const filePath = mergePath || destinationPath
    return [path.parse(filePath).name, true]
  }
}

/**
 * Verifies whether the download completed successfully by checking the log.
 * 
 * This also returns the actual filename chosen by yt-dlp.
 */
const checkDownloadLog = async (logContent, type) => {
  // Determine the final destination.
  const log = cleanLog(logContent)
  const lines = log.toLowerCase().split('\n')
  const [filebase, hasPrimaryOutputFile] = await findDestination(log, type)

  // Check for a number of common errors.
  const unableToDownload = lines.find(l => l.includes('unable to download video data'))
  const unknownServerName = lines.find(l => l.includes('nodename nor servname provided, or not known'))
  const formatNotAvailable = lines.find(l => l.includes('requested format is not available'))
  const pythonTraceback = lines.find(l => l.includes('traceback (most recent call last)'))

  const errors = {
    unknownServerName,
    unableToDownload,
    formatNotAvailable,
    pythonTraceback
  }

  const hasErrors = Object.values(errors).includes(true)

  return {
    isComplete: !!lines.find(l => l.startsWith('[download] 100%')),
    logContent: log,
    hasErrors,
    hasPrimaryOutputFile,
    errorDescription: getErrorDescription(errors, hasErrors),
    errors,
    filebase
  }
}

module.exports = {
  checkDownloadLog
}
