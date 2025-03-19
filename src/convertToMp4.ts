import { PassThrough } from "stream";
import ffmpeg from "fluent-ffmpeg";

export async function convertToMp4(inputBuffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const inputStream = new PassThrough();
    inputStream.end(inputBuffer);

    const outputStream = new PassThrough();
    const chunks: Array<Buffer> = [];

    outputStream.on("data", (chunk) => chunks.push(chunk));
    outputStream.on("error", reject);
    outputStream.on("end", () => resolve(Buffer.concat(chunks)));

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
