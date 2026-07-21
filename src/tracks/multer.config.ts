import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';

export const trackFileStorage = diskStorage({
  destination: './uploads/tracks',
  filename: (_req, file, callback) => {
    const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
    callback(null, uniqueName);
  },
});

export const audioFileFilter = (
  _req: unknown,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowedMimeTypes = [
    'audio/mpeg', // .mp3 (standard)
    'audio/mp3', // .mp3 (variante non standard envoyée par certains clients)
    'audio/x-mpeg',
    'audio/wav',
    'audio/x-wav',
    'audio/mp4', // .m4a / .mp4 audio
    'audio/x-m4a',
    'video/mp4', // .mp4 (mimetype le plus courant pour ce conteneur)
  ];
  const allowedExtensions = ['.mp3', '.wav', '.m4a', '.mp4'];

  const hasValidMimeType = allowedMimeTypes.includes(file.mimetype);
  const hasValidExtension = allowedExtensions.includes(
    extname(file.originalname).toLowerCase(),
  );

  // On accepte si le mimetype OU l'extension est valide, car certains
  // navigateurs/OS envoient un mimetype générique (ex: application/octet-stream)
  // pour des fichiers pourtant valides.
  if (!hasValidMimeType && !hasValidExtension) {
    callback(
      new BadRequestException(
        'Format de fichier non supporté (mp3, wav, m4a, mp4 uniquement)',
      ),
      false,
    );
    return;
  }
  callback(null, true);
};
