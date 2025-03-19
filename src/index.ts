import { randomUUIDv7 } from "bun";
import express, { type Request, type Response } from "express";
import multer from "multer";

import { VIDEO_FORMATS } from "./constants";
import { bucket } from "./bucket";
import { convertToMp4 } from "./convertToMp4";

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

    const fileName = req.file.originalname;
    const fileType = req.file.mimetype;
    const fileSize = req.file.size;

    if (!VIDEO_FORMATS.includes(fileType)) {
      return res
        .status(400)
        .json({ success: false, message: `Invalid file type: ${fileType}.` });
    }

    const baseFileName = fileName.replace(/\.[^/.]+$/, "");
    const blobName = `${randomUUIDv7()}-${baseFileName}.mp4`;

    const fileBuffer = req.file.buffer;

    if (fileType === "video/mp4") {
      await bucket.write(blobName, fileBuffer, { type: "video/mp4" });
    } else {
      const convertedBuffer = await convertToMp4(fileBuffer);
      await bucket.write(blobName, convertedBuffer, { type: "video/mp4" });
    }

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
