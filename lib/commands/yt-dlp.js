// ytarc <https://github.com/msikma/ytarc>
// © MIT license

/**
 * Default arguments used for generating yt-dlp commands.
 */
const defaults = {
  ytdlpCommand: 'yt-dlp',
  ytdlpArguments: [
    `--no-colors`,
    `--newline`,
    `--verbose`,
    `--sleep-requests`, `1`,
    `--sleep-interval`, `5`,
    `--max-sleep-interval`, `30`,
    `--ignore-errors`,
    `--no-continue`,
    `--add-metadata`,
    `--write-description`,
    `--write-info-json`,
    `--write-annotations`,
    `--write-thumbnail`,
    `--embed-thumbnail`,
    `--all-subs`,
    `--embed-subs`,
    `--get-comments`,
    `--match-filter`, `!is_live & !live`,
    `--merge-output-format`, `mp4`,
    // Note: these prevent Content ID tags from overwriting the title/uploader embedded metadata values.
    `--parse-metadata`, `%(title)s:%(meta_title)s`,
    `--parse-metadata`, `%(uploader)s:%(meta_artist)s`
  ],
  ytdlpQuality: {
    youtube: [`--format`, `(bestvideo)+(bestaudio[acodec^=opus]/bestaudio)/best`],
    default: [`--format`, `(bestvideo)+(bestaudio)/best`]
  },
  ytdlpOutput: {
    default: target => [`--output`, `%(title)s (%(upload_date)s) [%(channel)s, %(id)s].%(ext)s`]
  }
}

/**
 * Returns an argument indicating the output filename we need yt-dlp to save to.
 */
const getOutputArgument = (outputArr, type, target) => {
  const argFactory = outputArr[type] ? outputArr[type] : outputArr['default']
  return argFactory(target)
}

/**
 * Returns an argument indicating the quality we need yt-dlp to use.
 */
const getQualityArgument = (qualityArr, type, target) => {
  return qualityArr[type] ? qualityArr[type] : qualityArr['default']
}

/**
 * Returns a string indicating the provider (site) for a given video.
 */
const getContentProviderType = url => {
  if (url.includes('youtube.com')) {
    return 'youtube'
  }
  return 'default'
}

/**
 * Returns an array containing a download command to be executed.
 */
const getDownloadCommand = (url, target, userSettings = {}) => {
  const settings = {...defaults, ...userSettings}
  const type = getContentProviderType(url)
  return [
    settings.ytdlpCommand,
    ...settings.ytdlpArguments,
    ...getQualityArgument(settings.ytdlpQuality, type, target),
    ...getOutputArgument(settings.ytdlpOutput, type, target),
    url
  ]
}

module.exports = {
  getDownloadCommand
}
