export const VIDEO_FORMATS = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/x-msvideo",
  "video/x-flv",
  "video/quicktime",
  "video/x-matroska",
  "video/3gpp",
  "video/3gpp2",
  "video/x-ms-wmv",
  "video/x-m4v",
  "video/mpeg",
  "video/mp2t",
  "video/x-ms-asf",
  "video/x-mpegURL",
  "video/x-m4v",
] as const;

export const RESOLUTIONS = {
  "360": {
    width: 640,
    height: 360,
    bitrate: "800k",
    audioBitrate: "96k",
  },
  "480": {
    width: 854,
    height: 480,
    bitrate: "1500k",
    audioBitrate: "128k",
  },
  "720": {
    width: 1280,
    height: 720,
    bitrate: "3000k",
    audioBitrate: "192k",
  },
} as const;
