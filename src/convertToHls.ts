import { PassThrough } from "stream";
import ffmpeg from "fluent-ffmpeg";

import { RESOLUTIONS } from "./constants";

type VideoResolution = keyof typeof RESOLUTIONS;

type HlsOutput = {
  segments: Array<Buffer>;
  indexFile: Buffer;
};

export async function convertToHls(
  videoBuffer: Buffer,
  resolution: VideoResolution,
): Promise<HlsOutput> {
  const { width, height } = RESOLUTIONS[resolution];

  return new Promise((resolve, reject) => {
    const inputStream = new PassThrough();
    inputStream.end(videoBuffer);

    const segments: Array<Buffer> = [];
    let indexFileContent = "";

    const indexStream = new PassThrough();
    indexStream.on("data", (chunk) => {
      indexFileContent += chunk.toString();
    });

    const segmentStream = new PassThrough();
    segmentStream.on("data", (chunk: Buffer) => {
      segments.push(Buffer.from(chunk));
    });

    ffmpeg(inputStream)
      .outputFormat("hls")
      .size(`${width}x${height}`)
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions([
        "-hls_time 10",
        "-hls_list_size 0",
        "-hls_segment_type mpegts",
        "-hls_segment_filename pipe:1",
        "-hls_flags independent_segments",
        "-hls_playlist_type vod",
        "-profile:v main",
        "-crf 20",
        "-sc_threshold 0",
        "-g 48",
        "-keyint_min 48",
        "-start_number 0",
        "-hls_allow_cache 1",
        "-b:v 0",
        "-maxrate 1M",
        "-bufsize 1M",
      ])
      .on("error", (err, _, stderr) => {
        console.error("FFmpeg error:", err);
        console.error("FFmpeg stderr:", stderr);
        reject(new Error(`FFmpeg failed: ${stderr || err.message}`));
      })
      .on("end", () => {
        resolve({
          segments,
          indexFile: Buffer.from(indexFileContent),
        });
      })
      .pipe(segmentStream, { end: true })
      .pipe(indexStream, { end: true });
  });
}

export function generateMasterManifest(
  resolutions: Array<VideoResolution>,
): string {
  let manifest = "#EXTM3U\n";
  manifest += "#EXT-X-VERSION:3\n";

  for (const resolution of resolutions) {
    const { width, height, bitrate } = RESOLUTIONS[resolution];
    manifest += `#EXT-X-STREAM-INF:BANDWIDTH=${bitrate},RESOLUTION=${width}x${height}\n`;
    manifest += `${resolution}/playlist.m3u8\n`;
  }

  return manifest;
}
