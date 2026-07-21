import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class SearchService {
  constructor(private readonly databaseService: DatabaseService) {}

  searchByTitle(q: string) {
    return this.databaseService.track.findMany({
      where: { title: { contains: q, mode: 'insensitive' } },
      include: { artist: true, album: true, genre: true },
      take: 20,
    });
  }

  searchByArtist(q: string) {
    return this.databaseService.artist.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      include: { albums: true },
      take: 20,
    });
  }

  searchByGenre(q: string) {
    return this.databaseService.genre.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      take: 20,
    });
  }

  // Recherche globale : combine les trois pour une vue d'ensemble
  async searchGlobal(q: string) {
    const [tracks, artists, genres] = await Promise.all([
      this.searchByTitle(q),
      this.searchByArtist(q),
      this.searchByGenre(q),
    ]);

    return { tracks, artists, genres };
  }
}
