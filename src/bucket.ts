import { randomUUIDv7, S3Client } from "bun";

export const bucket = new S3Client({
  endpoint: "http://localhost:9000",
  accessKeyId: "minioadmin",
  secretAccessKey: "minioadmin",
  region: "us-east-1",
  bucket: "video-blobs",
});

export class BucketUtils {
  static getFileName(fileName: string): string {
    const baseFileName = fileName.replace(/\.[^/.]+$/, "");
    return `${randomUUIDv7()}-${baseFileName}.mp4`;
  }

  static getBucketPath(fileName: string): string {
    const baseName = fileName.replace(/\.[^/.]+$/, "");
    return `videos/${baseName}`;
  }

  static getManifestPath(fileName: string): string {
    const basePath = BucketUtils.getBucketPath(fileName);
    return `${basePath}/manifest.m3u8`;
  }

  static getOriginalVideoPath(fileName: string): string {
    const basePath = BucketUtils.getBucketPath(fileName);
    return `${basePath}/original.mp4`;
  }

  static getResolutionPlaylistPath(
    fileName: string,
    resolution: string,
  ): string {
    const basePath = BucketUtils.getBucketPath(fileName);
    return `${basePath}/${resolution}/playlist.m3u8`;
  }

  static getResolutionSegmentPath(
    fileName: string,
    resolution: string,
    segmentNumber: number,
  ): string {
    const basePath = BucketUtils.getBucketPath(fileName);
    return `${basePath}/${resolution}/segment_${segmentNumber}.ts`;
  }
}
