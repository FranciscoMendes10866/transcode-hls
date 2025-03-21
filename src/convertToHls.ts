import { PassThrough } from "stream";
import ffmpeg from "fluent-ffmpeg";

import { RESOLUTIONS } from "./constants";
import { bucket, BucketUtils } from "./bucket";

type VideoResolution = keyof typeof RESOLUTIONS;

export async function handleHlsSegmentsUpload(
  videoBuffer: Buffer,
  fileName: string,
  resolution: VideoResolution,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const { width, height, bitrate, audioBitrate } = RESOLUTIONS[resolution];

    const inputStream = new PassThrough();
    inputStream.end(videoBuffer);

    const segmentStream = new PassThrough();
    let segmentIdx = -1;

    segmentStream.on("data", async (chunk: Buffer) => {
      segmentIdx += 1;

      await bucket.write(
        BucketUtils.getResolutionSegmentPath(fileName, resolution, segmentIdx),
        chunk,
        { type: "video/mp2t" },
      );
    });

    segmentStream.on("end", () => resolve(segmentIdx));

    ffmpeg(inputStream)
      .outputFormat("mpegts")
      .videoCodec("libx264")
      .audioCodec("aac")
      .size(`${width}x${height}`)
      .outputOptions([
        "-map 0:v:0",
        "-map 0:a:0",
        `-b:v ${bitrate}`,
        `-b:a ${audioBitrate}`,
        "-maxrate 1M",
        "-bufsize 1M",
        "-f mpegts",
      ])
      .on("error", (err, _, stderr) => {
        console.error("Segment stream error:", err);
        reject(
          new Error(`FFmpeg segment stream failed: ${stderr || err.message}`),
        );
      })
      .pipe(segmentStream, { end: true });
  });
}

export function generateHlsIndex(totalSegments: number): Buffer {
  const segmentDuration = 10;
  const targetDuration = Math.ceil(segmentDuration);

  let playlist = `#EXTM3U\n`;
  playlist += `#EXT-X-VERSION:3\n`;
  playlist += `#EXT-X-TARGETDURATION:${targetDuration}\n`;
  playlist += `#EXT-X-MEDIA-SEQUENCE:0\n`;

  for (let i = 0; i < totalSegments; i++) {
    playlist += `#EXTINF:${segmentDuration}.000,\n`;
    playlist += `segment-${i}.ts\n`;
  }

  playlist += `#EXT-X-ENDLIST\n`;

  return Buffer.from(playlist);
}

export function generateMasterManifest(
  resolutions: Array<VideoResolution>,
): Buffer {
  let manifest = "#EXTM3U\n";
  manifest += "#EXT-X-VERSION:3\n";

  for (const resolution of resolutions) {
    const { width, height, bitrate } = RESOLUTIONS[resolution];
    manifest += `#EXT-X-STREAM-INF:BANDWIDTH=${bitrate},RESOLUTION=${width}x${height}\n`;
    manifest += `${resolution}/playlist.m3u8\n`;
  }

  return Buffer.from(manifest);
}
