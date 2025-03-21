import express, { type Request, type Response } from "express";
import multer from "multer";

import { VIDEO_FORMATS, RESOLUTIONS } from "./constants";
import { bucket, BucketUtils } from "./bucket";
import { handleOriginalVideoUpload } from "./convertToMp4";
import {
  handleHlsSegmentsUpload,
  generateHlsIndex,
  generateMasterManifest,
} from "./convertToHls";

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

    const originalVideoBuffer = await handleOriginalVideoUpload(
      req.file.buffer,
      fileName,
    );

    for await (const resolution of resolutionKeys) {
      const segments = await handleHlsSegmentsUpload(
        originalVideoBuffer,
        fileName,
        resolution as keyof typeof RESOLUTIONS,
      );

      await bucket.write(
        BucketUtils.getResolutionPlaylistPath(fileName, resolution),
        generateHlsIndex(segments),
        { type: "application/vnd.apple.mpegurl" },
      );
    }

    await bucket.write(
      BucketUtils.getManifestPath(fileName),
      generateMasterManifest(resolutionKeys),
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
