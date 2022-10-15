// ytarc <https://github.com/msikma/ytarc>
// © MIT license

/**
 * Default arguments used for generating yt-dlp commands.
 */
const defaults = {
  ytdlpCommand: 'yt-dlp',
  ytdlpArguments: {
    'youtube-music': () => {
      return [
        `--no-colors`,
        `--newline`,
        `--verbose`,
        `--sleep-requests`, `1`,
        `--sleep-interval`, `5`,
        `--max-sleep-interval`, `10`,
        `--ignore-errors`,
        `--no-continue`,
        `--add-metadata`,
        `--write-info-json`,
        `--match-filter`, `!is_live & !live`,
        `--extract-audio`,
        `--audio-format`, `best`
      ]
    },
    'default': () => {
      return [
        `--no-colors`,
        `--newline`,
        `--verbose`,
        `--ignore-errors`,
        `--no-continue`,
        `--add-metadata`,
        `--write-description`,
        `--write-info-json`,
        `--write-annotations`,
        `--write-subs`,
        `--write-thumbnail`,
        `--embed-thumbnail`,
        `--all-subs`,
        `--embed-subs`,
        `--sub-langs`, `all`,
        `--get-comments`,
        `--match-filter`, `!is_live & !live`,
        `--merge-output-format`, `mp4`,
        // Note: these prevent Content ID tags from overwriting the title/uploader embedded metadata values.
        `--parse-metadata`, `%(title)s:%(meta_title)s`,
        `--parse-metadata`, `%(uploader)s:%(meta_artist)s`
      ]
    }
  },
  ytdlpQuality: {
    'youtube': () => [`--format`, `(bestvideo)+(bestaudio[acodec^=opus]/bestaudio)/best`],
    'youtube-music': () => [`--format`, `bestaudio`],
    'default': () => [`--format`, `(bestvideo)+(bestaudio)/best`]
  },
  ytdlpOutput: {
    'default': (target, type, args = {}) => {
      if (type === 'twitch') {
        if (args.dateFirst) {
          return [`--output`, `%(upload_date)s - %(title)s [%(uploader)s, %(id)s].%(ext)s`]
        }
        return [`--output`, `%(title)s (%(upload_date)s) [%(uploader)s, %(id)s].%(ext)s`]
      }
      else if (type === 'youtube-music') {
        return [`--output`, `%(playlist_index)s %(artist)s - %(title)s [%(id)s].%(ext)s`]
      }
      else {
        if (args.dateFirst) {
          return [`--output`, `%(upload_date)s - %(title)s [%(channel)s, %(id)s].%(ext)s`]
        }
        return [`--output`, `%(title)s (%(upload_date)s) [%(channel)s, %(id)s].%(ext)s`]
      }
    }
  }
}

/**
 * Returns an argument indicating the output filename we need yt-dlp to save to.
 */
const getOutputArgument = (outputArr, type, target, args = {}) => {
  const argFactory = outputArr[type] ? outputArr[type] : outputArr['default']
  return argFactory(target, type, args)
}

/**
 * Returns an argument indicating the quality we need yt-dlp to use.
 */
const getQualityArgument = (qualityArr, type, target, args = {}) => {
  const argFactory = qualityArr[type] ? qualityArr[type] : qualityArr['default']
  return argFactory(target, type, args)
}

/**
 * Returns an argument indicating the quality we need yt-dlp to use.
 */
const getYtDlpArguments = (ytdlpArr, type, target, args = {}) => {
  const ytdlpFactory = ytdlpArr[type] ? ytdlpArr[type] : ytdlpArr['default']
  return ytdlpFactory(target, type, args)
}

/**
 * Returns a string indicating the provider (site) for a given video.
 */
const getContentProviderType = url => {
  if (url.includes('music.youtube.com')) {
    return 'youtube-music'
  }
  if (url.includes('youtube.com')) {
    return 'youtube'
  }
  if (url.includes('twitch.tv')) {
    return 'twitch'
  }
  return 'default'
}

/**
 * Returns an array containing a download command to be executed.
 */
const getDownloadCommand = (url, args, target, userSettings = {}) => {
  const settings = {...defaults, ...userSettings}
  const type = getContentProviderType(url)
  return [
      [
      settings.ytdlpCommand,
      ...getYtDlpArguments(settings.ytdlpArguments, type, target, args),
      ...getQualityArgument(settings.ytdlpQuality, type, target, args),
      ...getOutputArgument(settings.ytdlpOutput, type, target, args),
      url
    ],
    type
  ]
}

module.exports = {
  getDownloadCommand
}
