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
  "240": {
    width: 426,
    height: 240,
    bitrate: "400k",
    audioBitrate: "64k",
  },
  "560": {
    width: 996,
    height: 560,
    bitrate: "1500k",
    audioBitrate: "96k",
  },
} as const;
