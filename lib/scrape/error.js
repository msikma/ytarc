// ytarc <https://github.com/msikma/ytarc>
// © MIT license

class ScrapeError extends Error {
  constructor(args) {
    this.reason = args.reason
    this.base = args.base
  }
}

module.exports = {
  ScrapeError
}
