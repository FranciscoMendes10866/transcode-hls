import express, { type Request, type Response } from "express";
import multer from "multer";

import { VIDEO_FORMATS, RESOLUTIONS } from "./constants";
import { bucket, BucketUtils } from "./bucket";
import { convertToMp4 } from "./convertToMp4";
import { convertToHls, generateMasterManifest } from "./convertToHls";

const resolutionKeys = Object.keys(RESOLUTIONS) as Array<
  keyof typeof RESOLUTIONS
>;

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response): Promise<any> => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file provided" });
    }

    const fileName = BucketUtils.getFileName(req.file.originalname);
    const fileType = req.file.mimetype;
    const fileSize = req.file.size;

    if (!VIDEO_FORMATS.includes(fileType as (typeof VIDEO_FORMATS)[number])) {
      return res
        .status(400)
        .json({ success: false, message: `Invalid file type: ${fileType}.` });
    }

    const convertedBuffer = await convertToMp4(req.file.buffer);
    await bucket.write(
      BucketUtils.getOriginalVideoPath(fileName),
      convertedBuffer,
      { type: "video/mp4" },
    );

    for await (const resolution of resolutionKeys) {
      const { indexFile, segments } = await convertToHls(
        convertedBuffer,
        resolution as keyof typeof RESOLUTIONS,
      );

      await Promise.all([
        bucket.write(
          BucketUtils.getResolutionPlaylistPath(fileName, resolution),
          indexFile,
          { type: "application/vnd.apple.mpegurl" },
        ),
        ...segments.map((segment, segmentIdx) =>
          bucket.write(
            BucketUtils.getResolutionSegmentPath(
              fileName,
              resolution,
              segmentIdx,
            ),
            segment,
            { type: "video/mp2t" },
          ),
        ),
      ]);
    }

    const masterManifest = generateMasterManifest(resolutionKeys);

    await bucket.write(
      BucketUtils.getManifestPath(fileName),
      Buffer.from(masterManifest),
      { type: "application/vnd.apple.mpegurl" },
    );

    return res.json({
      success: true,
      message: "File uploaded successfully",
      file: {
        name: fileName,
        type: fileType,
        size: fileSize,
      },
    });
  },
);

app.listen(3000);
