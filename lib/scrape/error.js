// asl_scrape <https://github.com/msikma/asl_scrape>
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
