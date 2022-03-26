// ytarc <https://github.com/msikma/ytarc>
// © MIT license

const {runArchiver} = require('./scrape')
const {fileIsWritable, arrayUniq} = require('../util')

const archiveURLs = async (passedURLs, args = {}, {cwd} = {}) => {
  const urls = arrayUniq(passedURLs)
  for (const url of urls) {
    const isWritable = await fileIsWritable(cwd)
    if (!isWritable) {
      console.error(`ytarc: error: Current directory is not writable.`)
      process.exit(1)
    }

    const res = await runArchiver(url, args, cwd)
    if (res.success === false) {
      console.error(`ytarc: error while archiving URL: ${url}:`)
      console.error(res.err)
    }
  }

  console.log(`\nytarc: URLs archived: ${urls.length}.`)
  process.exit(0)
}

module.exports = {
  archiveURLs
}
