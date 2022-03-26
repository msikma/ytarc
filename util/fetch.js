// ytarc <https://github.com/msikma/ytarc>
// © MIT license

const util = require('util')
const fs = require('fs')
const path = require('path')
const mime = require('mime-types')
const streamPipeline = util.promisify(require('stream').pipeline)
const fetch = require('node-fetch')

const stdArguments = {
  'credentials': 'include',
  'headers': {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:98.0) Gecko/20100101 Firefox/98.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-GPC': '1',
    'Alt-Used': 'music.youtube.com',
    'Cache-Control': 'max-age=0'
  },
  'method': 'GET',
  'mode': 'cors'
}

/**
 * Runs fetch with some standard arguments as though it's a browser.
 */
const fetchAsBrowser = (url, args = {}) => {
  return fetch(url, {...stdArguments, ...args})
}

/**
 * Returns the path that we'll save the downloaded file to.
 * 
 * If the user requested that we add a file extension based on the MIME type, we'll do so here.
 */
const addMimeExtension = (res, destPath, opts = {}) => {
  if (!opts.addExtension) return destPath
  const type = res.headers.get('Content-Type')
  const ext = mime.extension(type)
  const parsed = path.parse(destPath)

  // Destination path base - either with or without the originally provided extension.
  const destBase = opts.replaceExtension
    ? path.join(parsed.dir, parsed.name)
    : destPath
    
  return `${destBase}.${ext}`
}

/**
 * Uses fetch to download a file to a destination as though it's a browser.
 */
const downloadAsBrowser = async (url, destPath, args = {}, opts = {replaceExtension: true}) => {
  const res = await fetch(url, {...stdArguments, ...args})
  if (!res.ok) {
    throw new Error(`unexpected response ${response.statusText}`)
  }

  const dest = addMimeExtension(res, destPath, opts)
  await streamPipeline(res.body, fs.createWriteStream(dest))
}

module.exports = {
  stdArguments,
  downloadAsBrowser,
  fetchAsBrowser
}
