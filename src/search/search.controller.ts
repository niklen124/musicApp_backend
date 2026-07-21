import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  searchGlobal(@Query() dto: SearchQueryDto) {
    return this.searchService.searchGlobal(dto.q);
  }

  @Get('tracks')
  searchTracks(@Query() dto: SearchQueryDto) {
    return this.searchService.searchByTitle(dto.q);
  }

  @Get('artists')
  searchArtists(@Query() dto: SearchQueryDto) {
    return this.searchService.searchByArtist(dto.q);
  }

  @Get('genres')
  searchGenres(@Query() dto: SearchQueryDto) {
    return this.searchService.searchByGenre(dto.q);
  }
}
