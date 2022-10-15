// ytarc <https://github.com/msikma/ytarc>
// © MIT license

const path = require('path')
const cheerio = require('cheerio')
const {fetchAsBrowser, downloadAsBrowser} = require('../../../util/fetch')
const {findTagByContent, extractScriptResult} = require('../../../util/html')
const {sanitizeFilename} = require('../../../util/fs')

/**
 * Generates a target destination from a given .info.json object.
 */
const getDestinationFromData = data => {
  return sanitizeFilename(`${data.creator} - ${data.album} (${data.release_year}) [${data.playlist_id}]`)
}

/**
 * Retrieves the contents of the 'initialData' variable.
 */
const getInitialData = (scriptContent) => {
  // Little hack to ensure we can grab the result of 'initialData'.
  const initScriptContent = scriptContent.replace('const initialData', 'var initialData')
  const initData = extractScriptResult(initScriptContent, {window: {}, initialData: null, ytcfg: {set: () => {}}})

  // Parse JSON inside the result data.
  const newInitData = initData.sandbox.initialData.map(item => {
    const data = JSON.parse(item.data)
    return {
      ...item,
      data
    }
  })
  return newInitData
}

/**
 * Returns the URL to the album art with the width/height changed to a new value.
 * 
 * Takes an album thumbnail object from the page initialData.
 */
const getLargeAlbumArt = (albumThumbnail, newWidth, newHeight, newQuality = 90) => {
  const {url, width, height} = albumThumbnail
  return url.replace(new RegExp(`=w${width}-h${height}-l([0-9]+)-`), `=w${newWidth}-h${newHeight}-l${newQuality}-`)
}

/**
 * Scrapes data from the Youtube Music page.
 */
const scrapeData = $ => {
  const initScript = findTagByContent($, 'script', 'initialData')
  const data = getInitialData($(initScript).text())
  const headerNode = data.find(n => n.path === '/browse').data.header.musicDetailHeaderRenderer
  const albumThumbnails = headerNode.thumbnail.croppedSquareThumbnailRenderer.thumbnail.thumbnails
    .sort((a, b) => (a.width * a.height) > (b.width * b.height) ? -1 : 1)
  const albumArtLarge = getLargeAlbumArt(albumThumbnails[0], 5000, 5000, 100)
  const albumArtSmall = getLargeAlbumArt(albumThumbnails[0], 500, 500, 90)
  return {
    albumArtLarge,
    albumArtSmall
  }
}

const runAuxTasks = async (url, tmpDir) => {
  const res = await fetchAsBrowser(url)
  const html = await res.text()
  const $ = cheerio.load(html, {xmlMode: true})
  const data = scrapeData($)

  await downloadAsBrowser(data.albumArtSmall, path.join(tmpDir, `folder`), {}, {addExtension: true})
  await downloadAsBrowser(data.albumArtLarge, path.join(tmpDir, `folder-orig`), {}, {addExtension: true})
  return data
}

module.exports = {
  runAuxTasks,
  getDestinationFromData
}
