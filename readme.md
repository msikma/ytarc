[![MIT license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT) [![npm version](https://badge.fury.io/js/cmd-tokenize.svg)](https://badge.fury.io/js/ytarc)

# ytarc

Archiving script for Youtube videos (and videos from other services, such as Twitch).

This script is really just a convenience wrapper around [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) that does a few additional things, such as enforcing a standard set of arguments, downloading to a temporary directory, and moving all the relevant files into a single output directory.

```
usage: ytarc [-h] [-v] [-d] URL [URL ...]

Helper utility for running yt-dlp for archiving purposes.

positional arguments:
  URL               URLs to fetch

optional arguments:
  -h, --help        show this help message and exit
  -v, --version     show program's version number and exit
  -d, --date-first  put the date at the start of the filename
```

## Prerequisites

Requires that [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) and [FFmpeg](https://ffmpeg.org/) are both installed.

## License

© MIT license.
