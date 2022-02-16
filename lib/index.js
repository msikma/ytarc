// ytarc <https://github.com/msikma/ytarc>
// © MIT license

const path = require('path')
const {runArchiver} = require('./scrape')
const {fileIsWritable} = require('../util')

const archiveURLs = async (urls, args = {}, {cwd} = {}) => {
  for (const url of urls) {
    const isWritable = await fileIsWritable(cwd)
    if (!isWritable) {
      console.error(`ytarc: error: Current directory is not writable.`)
      process.exit(1)
    }

    const res = await runArchiver(url, args, cwd)
  }

  console.log(`\nytarc: URLs archived: ${urls.length}.`)
  process.exit(0)
}

module.exports = {
  archiveURLs
}
