import { S3Client } from "bun";

export const bucket = new S3Client({
  endpoint: "http://localhost:9000",
  accessKeyId: "minioadmin",
  secretAccessKey: "minioadmin",
  region: "us-east-1",
  bucket: "video-blobs",
});
