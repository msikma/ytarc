#!/usr/bin/env node

// ytarc <https://github.com/msikma/ytarc>
// © MIT license

const {ArgumentParser} = require('argparse')
const {readJSON} = require('../util')

const pkgData = readJSON(`${__dirname}/../package.json`)
const parser = new ArgumentParser({
  description: `Helper utility for running yt-dlp for archiving purposes.`,
  add_help: true
})
parser.add_argument('URL', {help: 'URLs to fetch', nargs: '+'})
parser.add_argument('-v', '--version', {action: 'version', version: pkgData.version})
parser.add_argument('-d', '--date-first', {action: 'store_true', dest: 'dateFirst', help: 'put the date at the start of the filename'})
parser.add_argument('-k', '--keep-tmp', {action: 'store_true', dest: 'keepTmp', help: `don't delete temporary directory when done or on error`})

const args = {...parser.parse_args()}

require('../lib/index.js').archiveURLs(args.URL, args, {cwd: process.cwd()})
