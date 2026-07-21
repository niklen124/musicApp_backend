import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class QueueService {
  constructor(private readonly databaseService: DatabaseService) {}

  // La queue (et le player) n'existent pas forcément encore : on les crée
  // à la volée. Player doit exister avant Queue (contrainte de clé étrangère).
  private async getOrCreateQueue(userId: number) {
    await this.databaseService.player.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    return this.databaseService.queue.upsert({
      where: { playerId: userId },
      create: { playerId: userId },
      update: {},
      include: {
        tracks: { orderBy: { position: 'asc' }, include: { track: true } },
      },
    });
  }

  async getQueue(userId: number) {
    return this.getOrCreateQueue(userId);
  }

  // push : ajoute un morceau à la fin de la file
  async push(userId: number, trackId: string) {
    const queue = await this.getOrCreateQueue(userId);

    const track = await this.databaseService.track.findUnique({
      where: { id: trackId },
    });
    if (!track) {
      throw new NotFoundException(`Track ${trackId} introuvable`);
    }

    const lastTrack = await this.databaseService.queueTrack.findFirst({
      where: { queueId: queue.id },
      orderBy: { position: 'desc' },
    });
    const nextPosition = lastTrack ? lastTrack.position + 1 : 0;

    return this.databaseService.queueTrack.create({
      data: { queueId: queue.id, trackId, position: nextPosition },
    });
  }

  // pop : retire le dernier morceau de la file
  async pop(userId: number) {
    const queue = await this.getOrCreateQueue(userId);

    const lastTrack = await this.databaseService.queueTrack.findFirst({
      where: { queueId: queue.id },
      orderBy: { position: 'desc' },
    });
    if (!lastTrack) {
      throw new BadRequestException('La file de lecture est déjà vide');
    }

    return this.databaseService.queueTrack.delete({
      where: { id: lastTrack.id },
    });
  }

  // Retire un morceau précis de la file (pas forcément le dernier)
  async removeTrack(userId: number, trackId: string) {
    const queue = await this.getOrCreateQueue(userId);

    const entry = await this.databaseService.queueTrack.findFirst({
      where: { queueId: queue.id, trackId },
    });
    if (!entry) {
      throw new NotFoundException("Ce morceau n'est pas dans la file");
    }

    return this.databaseService.$transaction(async (tx) => {
      await tx.queueTrack.delete({ where: { id: entry.id } });
      // Comble le trou laissé dans les positions
      await tx.queueTrack.updateMany({
        where: { queueId: queue.id, position: { gt: entry.position } },
        data: { position: { decrement: 1 } },
      });
    });
  }

  // Mélange l'ordre de tous les morceaux de la file et repart de l'index 0
  async shuffleQueue(userId: number) {
    const queue = await this.getOrCreateQueue(userId);

    if (queue.tracks.length === 0) {
      throw new BadRequestException('La file de lecture est vide');
    }

    const shuffledTrackIds = [...queue.tracks.map((t) => t.trackId)];
    for (let i = shuffledTrackIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledTrackIds[i], shuffledTrackIds[j]] = [
        shuffledTrackIds[j],
        shuffledTrackIds[i],
      ];
    }

    await this.databaseService.$transaction(
      shuffledTrackIds.map((trackId, index) =>
        this.databaseService.queueTrack.updateMany({
          where: { queueId: queue.id, trackId },
          data: { position: index },
        }),
      ),
    );

    await this.databaseService.queue.update({
      where: { id: queue.id },
      data: { currentIndex: 0 },
    });

    return this.getOrCreateQueue(userId);
  }

  // clear : vide entièrement la file
  async clear(userId: number) {
    const queue = await this.getOrCreateQueue(userId);

    await this.databaseService.queueTrack.deleteMany({
      where: { queueId: queue.id },
    });

    return this.databaseService.queue.update({
      where: { id: queue.id },
      data: { currentIndex: 0 },
    });
  }
}
