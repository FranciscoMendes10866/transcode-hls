import { PassThrough } from "stream";
import ffmpeg from "fluent-ffmpeg";

import { bucket, BucketUtils } from "./bucket";

export async function handleOriginalVideoUpload(
  inputBuffer: Buffer,
  fileName: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const s3File = bucket.file(BucketUtils.getOriginalVideoPath(fileName), {
      type: "video/mp4",
    });

    const writer = s3File.writer({
      retry: 1,
      queueSize: 4,
      partSize: 5 * 1024 * 1024,
    });

    const inputStream = new PassThrough();
    inputStream.end(inputBuffer);

    const outputStream = new PassThrough();
    const chunks: Array<Buffer> = [];

    outputStream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
      writer.write(chunk);
    });

    outputStream.on("error", reject);

    outputStream.on("end", async () => {
      await writer.end();
      resolve(Buffer.concat(chunks));
    });

    ffmpeg(inputStream)
      .outputFormat("mp4")
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions([
        "-movflags frag_keyframe+empty_moov",
        "-pix_fmt yuv420p",
        "-preset ultrafast",
        "-shortest",
      ])
      .on("error", (err, stdout, stderr) => {
        console.error("FFmpeg error:", err);
        console.error("FFmpeg stdout:", stdout);
        console.error("FFmpeg stderr:", stderr);
        reject(new Error(`FFmpeg failed: ${stderr || err.message}`));
      })
      .pipe(outputStream, { end: true });
  });
}
