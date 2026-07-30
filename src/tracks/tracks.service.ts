import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import { join } from 'path';
import { unlink } from 'fs/promises';
import { parseFile } from 'music-metadata';

@Injectable()
export class TracksService {
  constructor(private readonly databaseService: DatabaseService) {}

  private async assertRelationsExist(dto: {
    artistId?: string;
    albumId?: string;
    genreId?: string;
  }) {
    if (dto.artistId) {
      const artist = await this.databaseService.artist.findUnique({
        where: { id: dto.artistId },
      });
      if (!artist) {
        throw new NotFoundException(`Artiste ${dto.artistId} introuvable`);
      }
    }

    if (dto.albumId) {
      const album = await this.databaseService.album.findUnique({
        where: { id: dto.albumId },
      });
      if (!album) {
        throw new NotFoundException(`Album ${dto.albumId} introuvable`);
      }
    }

    if (dto.genreId) {
      const genre = await this.databaseService.genre.findUnique({
        where: { id: dto.genreId },
      });
      if (!genre) {
        throw new NotFoundException(`Genre ${dto.genreId} introuvable`);
      }
    }
  }

  private resolveDiskPath(fileUrl: string) {
    const filename = fileUrl.split('/').pop() as string;
    return join(process.cwd(), 'uploads', 'tracks', filename);
  }

  // Lit les vraies métadonnées du fichier audio pour en extraire la durée
  // exacte, au lieu de faire confiance à une valeur saisie manuellement.
  // Retourne undefined si la détection échoue (fichier corrompu, format
  // non supporté par la lib, etc.) pour ne pas faire planter l'upload.
  private async getAudioDuration(fileUrl: string): Promise<number | undefined> {
    try {
      const filePath = this.resolveDiskPath(fileUrl);
      const metadata = await parseFile(filePath);
      const duration = metadata.format.duration;
      if (duration && Number.isFinite(duration) && duration > 0) {
        return Math.round(duration);
      }
      return undefined;
    } catch (err) {
      console.warn(
        `[TracksService] Impossible de détecter la durée pour ${fileUrl} :`,
        err,
      );
      return undefined;
    }
  }

  // Supprime physiquement un ancien fichier audio du disque.
  private async deleteFileFromDisk(fileUrl: string) {
    try {
      await unlink(this.resolveDiskPath(fileUrl));
    } catch (err) {
      console.warn(
        `[TracksService] Impossible de supprimer l'ancien fichier :`,
        err,
      );
    }
  }

  async create(createTrackDto: CreateTrackDto, fileUrl: string) {
    await this.assertRelationsExist(createTrackDto);

    const detectedDuration = await this.getAudioDuration(fileUrl);

    return this.databaseService.track.create({
      data: {
        ...createTrackDto,
        fileUrl,
        // Priorité à la durée détectée automatiquement ; le champ envoyé
        // par le client ne sert que de secours si la détection échoue.
        durationSeconds:
          detectedDuration ?? createTrackDto.durationSeconds ?? 0,
      },
    });
  }

  findAll() {
    return this.databaseService.track.findMany({
      include: { artist: true, album: true, genre: true },
    });
  }

  async findOne(id: string) {
    const track = await this.databaseService.track.findUnique({
      where: { id },
      include: { artist: true, album: true, genre: true },
    });
    if (!track) {
      throw new NotFoundException(`Track ${id} introuvable`);
    }
    return track;
  }

  async update(
    id: string,
    updateTrackDto: UpdateTrackDto,
    newFileUrl?: string,
  ) {
    const existingTrack = await this.findOne(id);
    await this.assertRelationsExist(updateTrackDto);

    let durationSeconds: number | undefined;

    if (newFileUrl) {
      await this.deleteFileFromDisk(existingTrack.fileUrl);
      // Recalcule la durée réelle sur le nouveau fichier
      durationSeconds = await this.getAudioDuration(newFileUrl);
    }

    return this.databaseService.track.update({
      where: { id },
      data: {
        ...updateTrackDto,
        ...(newFileUrl ? { fileUrl: newFileUrl } : {}),
        ...(durationSeconds ? { durationSeconds } : {}),
      },
    });
  }

  async remove(id: string) {
    const track = await this.findOne(id);
    await this.deleteFileFromDisk(track.fileUrl);
    return this.databaseService.track.delete({ where: { id } });
  }

  async incrementPlayCount(id: string) {
    await this.findOne(id);
    return this.databaseService.track.update({
      where: { id },
      data: { playCount: { increment: 1 } },
    });
  }
}
