import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';

const uploadDir = join(process.cwd(), 'uploads', 'images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const imageFileStorage = diskStorage({
  destination: uploadDir,
  filename: (_req, file, callback) => {
    const ext = extname(file.originalname).toLowerCase();
    const uniqueName = `${randomUUID()}${ext}`;
    callback(null, uniqueName);
  },
});

export const imageFileFilter = (
  _req: unknown,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/jpg',
    'image/svg+xml',
  ];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];

  const hasValidMimeType = allowedMimeTypes.includes(file.mimetype);
  const hasValidExtension = allowedExtensions.includes(
    extname(file.originalname).toLowerCase(),
  );

  if (!hasValidMimeType && !hasValidExtension) {
    callback(
      new BadRequestException(
        'Format d’image non supporté (JPEG, PNG, WEBP, GIF, SVG uniquement)',
      ),
      false,
    );
    return;
  }
  callback(null, true);
};
