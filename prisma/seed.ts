import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

// Helper to write an SVG cover file
function generateSvgCover(
  title: string,
  bgColor1: string,
  bgColor2: string,
  filename: string,
) {
  const dir = path.join(process.cwd(), 'uploads', 'images');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
    <defs>
      <linearGradient id="grad-${filename}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${bgColor1};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${bgColor2};stop-opacity:1" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="15" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad-${filename})" />
    <circle cx="250" cy="250" r="120" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="8" />
    <circle cx="250" cy="250" r="90" fill="rgba(0, 0, 0, 0.3)" />
    
    <!-- Record lines -->
    <circle cx="250" cy="250" r="70" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2" />
    <circle cx="250" cy="250" r="50" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2" />
    
    <!-- Music note icon -->
    <path d="M240 210 v60 c-5 0-10 2-13 5-5 5-5 13 0 18 5 5 13 5 18 0 5-5 5-13 0-18 -2-2-5-3-5-3 v-52 h25 v20 h5 v-25 z" fill="#ffffff" filter="url(#glow)" />
    
    <text x="50%" y="420" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Inter', sans-serif" font-size="28" font-weight="800" fill="#ffffff" letter-spacing="2">${title.toUpperCase()}</text>
    <text x="50%" y="450" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Inter', sans-serif" font-size="14" font-weight="400" fill="rgba(255,255,255,0.7)">PREMIUM AUDIO STREAM</text>
  </svg>`;

  fs.writeFileSync(path.join(dir, filename), svgContent, 'utf-8');
  return `/uploads/images/${filename}`;
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing records
  await prisma.queueTrack.deleteMany({});
  await prisma.queue.deleteMany({});
  await prisma.player.deleteMany({});
  await prisma.playlistTrack.deleteMany({});
  await prisma.playlist.deleteMany({});
  await prisma.track.deleteMany({});
  await prisma.album.deleteMany({});
  await prisma.artist.deleteMany({});
  await prisma.genre.deleteMany({});
  await prisma.userPreference.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned existing database tables');

  // 2. Create Users
  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('admin123', saltRounds);
  const artistPassword = await bcrypt.hash('artist123', saltRounds);
  const userPassword = await bcrypt.hash('user123', saltRounds);

  const admin = await prisma.user.create({
    data: {
      name: 'Nathan Admin',
      email: 'admin@musicapp.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      avatarUrl: '/uploads/images/avatar-admin.svg',
    },
  });

  const artistUser = await prisma.user.create({
    data: {
      name: 'Alex Synth',
      email: 'artist@musicapp.com',
      passwordHash: artistPassword,
      role: 'ARTIST',
      avatarUrl: '/uploads/images/avatar-artist.svg',
    },
  });

  const normalUser = await prisma.user.create({
    data: {
      name: 'Jane Doe',
      email: 'user@musicapp.com',
      passwordHash: userPassword,
      role: 'USER',
      avatarUrl: '/uploads/images/avatar-user.svg',
    },
  });

  // Create Preferences
  await prisma.userPreference.createMany({
    data: [
      { userId: admin.id, theme: 'dark', defaultVolume: 80 },
      { userId: artistUser.id, theme: 'dark', defaultVolume: 90 },
      { userId: normalUser.id, theme: 'dark', defaultVolume: 75 },
    ],
  });

  console.log('👤 Created users: Admin, Artist, Regular User');

  // 3. Create Genres
  const genresData = [
    {
      name: 'Synthwave',
      color1: '#ff007f',
      color2: '#7f00ff',
      file: 'genre-synthwave.svg',
    },
    {
      name: 'Lo-Fi Chill',
      color1: '#ff8a00',
      color2: '#e52e71',
      file: 'genre-lofi.svg',
    },
    {
      name: 'Electro House',
      color1: '#00f2fe',
      color2: '#4facfe',
      file: 'genre-electro.svg',
    },
    {
      name: 'Cyberpunk Ambient',
      color1: '#185a9d',
      color2: '#3cba92',
      file: 'genre-cyberpunk.svg',
    },
    {
      name: 'Acoustic',
      color1: '#f857a6',
      color2: '#ff5858',
      file: 'genre-acoustic.svg',
    },
  ];

  const genresMap: Record<string, any> = {};
  for (const g of genresData) {
    const coverUrl = generateSvgCover(g.name, g.color1, g.color2, g.file);
    const genre = await prisma.genre.create({
      data: {
        name: g.name,
        coverUrl,
      },
    });
    genresMap[g.name] = genre;
  }

  console.log('🎵 Created Genres with visual covers');

  // 4. Create Artists
  const artistsData = [
    {
      name: 'Neon Horizon',
      bio: 'Pioneering retro-future synthwave sounds straight from the neon grid.',
      avatarFile: 'artist-neon-horizon.svg',
      coverFile: 'artist-cover-neon.svg',
      c1: '#f107a3',
      c2: '#7b2ff7',
    },
    {
      name: 'Lofi Dreamer',
      bio: 'Warm vinyl crackles, chill study beats, and peaceful evening melodies.',
      avatarFile: 'artist-lofi-dreamer.svg',
      coverFile: 'artist-cover-lofi.svg',
      c1: '#ff9966',
      c2: '#ff5e62',
    },
    {
      name: 'Cybernetic Syndicate',
      bio: 'Dark industrial atmospheres and aggressive cyberpunk synth lines.',
      avatarFile: 'artist-cybernetic.svg',
      coverFile: 'artist-cover-cyber.svg',
      c1: '#3a7bd5',
      c2: '#3a6073',
    },
  ];

  const artistsMap: Record<string, any> = {};
  for (const a of artistsData) {
    const avatarUrl = generateSvgCover(a.name, a.c1, a.c2, a.avatarFile);
    const coverUrl = generateSvgCover(
      `${a.name} Background`,
      a.c2,
      '#11111d',
      a.coverFile,
    );
    const artist = await prisma.artist.create({
      data: {
        name: a.name,
        bio: a.bio,
        avatarUrl,
        coverUrl,
      },
    });
    artistsMap[a.name] = artist;
  }

  console.log('🎤 Created Artists with biographies and avatars');

  // 5. Create Albums
  const albumsData = [
    {
      title: 'Outrun the Grid',
      releaseYear: 2025,
      artistName: 'Neon Horizon',
      file: 'album-outrun.svg',
      c1: '#ff00cc',
      c2: '#333399',
    },
    {
      title: 'Midnight Coffee',
      releaseYear: 2026,
      artistName: 'Lofi Dreamer',
      file: 'album-coffee.svg',
      c1: '#11998e',
      c2: '#38ef7d',
    },
    {
      title: 'Neural Networks',
      releaseYear: 2024,
      artistName: 'Cybernetic Syndicate',
      file: 'album-networks.svg',
      c1: '#ea00d9',
      c2: '#711c91',
    },
  ];

  const albumsMap: Record<string, any> = {};
  for (const al of albumsData) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const artist = artistsMap[al.artistName];
    const coverUrl = generateSvgCover(al.title, al.c1, al.c2, al.file);
    const album = await prisma.album.create({
      data: {
        title: al.title,
        releaseYear: al.releaseYear,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        artistId: artist.id,
        coverUrl,
      },
    });
    albumsMap[al.title] = album;
  }

  console.log('💿 Created Albums and linked to Artists');

  // 6. Audio File Setup - Generate real playable WAV files
  const tracksDir = path.join(process.cwd(), 'uploads', 'tracks');
  if (!fs.existsSync(tracksDir)) {
    fs.mkdirSync(tracksDir, { recursive: true });
  }

  // Helper to generate a real PCM WAV audio file with musical chord tones
  function generateMusicalWavFile(
    filename: string,
    durationSeconds: number,
    freq: number,
  ): string {
    const filePath = path.join(tracksDir, filename);
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * durationSeconds);
    const buffer = Buffer.alloc(44 + numSamples * 2);

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + numSamples * 2, 4);
    buffer.write('WAVE', 8);

    // fmt subchunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(1, 22); // Mono
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);

    // data subchunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(numSamples * 2, 40);

    // Generate musical chord tones with ADSR envelope
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Harmony: fundamental + major 3rd + perfect 5th
      const val =
        Math.sin(2 * Math.PI * freq * t) * 0.4 +
        Math.sin(2 * Math.PI * (freq * 1.25) * t) * 0.3 +
        Math.sin(2 * Math.PI * (freq * 1.5) * t) * 0.2;
      // Smooth start & end envelope
      const envelope =
        Math.min(1, t / 0.15) * Math.min(1, (durationSeconds - t) / 0.15);
      const sample = Math.max(
        -32768,
        Math.min(32767, Math.floor(val * envelope * 14000)),
      );
      buffer.writeInt16LE(sample, 44 + i * 2);
    }

    fs.writeFileSync(filePath, buffer);
    return `/uploads/tracks/${filename}`;
  }

  // Tracks data definitions with unique musical frequencies per song
  const tracksData = [
    {
      title: 'Sunset Cruise',
      durationSeconds: 30,
      artistName: 'Neon Horizon',
      albumTitle: 'Outrun the Grid',
      genreName: 'Synthwave',
      c1: '#ff007f',
      c2: '#7f00ff',
      file: 'track-sunset-cruise.wav',
      freq: 220, // A3 - warm, dreamy
    },
    {
      title: 'Laser Flashback',
      durationSeconds: 30,
      artistName: 'Neon Horizon',
      albumTitle: 'Outrun the Grid',
      genreName: 'Synthwave',
      c1: '#00f2fe',
      c2: '#4facfe',
      file: 'track-laser-flashback.wav',
      freq: 330, // E4 - energetic
    },
    {
      title: 'Rainy Cafe Study',
      durationSeconds: 30,
      artistName: 'Lofi Dreamer',
      albumTitle: 'Midnight Coffee',
      genreName: 'Lo-Fi Chill',
      c1: '#ff8a00',
      c2: '#e52e71',
      file: 'track-rainy-cafe.wav',
      freq: 174, // F3 - mellow, chill
    },
    {
      title: 'Sleepy Pillow',
      durationSeconds: 30,
      artistName: 'Lofi Dreamer',
      albumTitle: 'Midnight Coffee',
      genreName: 'Lo-Fi Chill',
      c1: '#11998e',
      c2: '#38ef7d',
      file: 'track-sleepy-pillow.wav',
      freq: 196, // G3 - soft, peaceful
    },
    {
      title: 'Neon Tokyo Alley',
      durationSeconds: 30,
      artistName: 'Cybernetic Syndicate',
      albumTitle: 'Neural Networks',
      genreName: 'Cyberpunk Ambient',
      c1: '#ea00d9',
      c2: '#711c91',
      file: 'track-neon-tokyo.wav',
      freq: 466, // Bb4 - dark, mysterious
    },
    {
      title: 'System Override',
      durationSeconds: 30,
      artistName: 'Cybernetic Syndicate',
      albumTitle: 'Neural Networks',
      genreName: 'Cyberpunk Ambient',
      c1: '#fcb045',
      c2: '#fd1d1d',
      file: 'track-system-override.wav',
      freq: 554, // C#5 - intense, aggressive
    },
  ];

  const seededTracks: any[] = [];

  for (const t of tracksData) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const artist = artistsMap[t.artistName];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const album = albumsMap[t.albumTitle];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const genre = genresMap[t.genreName];

    // Generate specific cover for track
    const coverFilename = `track-${t.title.replace(/\s+/g, '-').toLowerCase()}.svg`;
    const coverUrl = generateSvgCover(t.title, t.c1, t.c2, coverFilename);

    // Generate real playable WAV audio file with unique frequency
    const fileUrl = generateMusicalWavFile(t.file, t.durationSeconds, t.freq);

    const track = await prisma.track.create({
      data: {
        title: t.title,
        durationSeconds: t.durationSeconds,
        fileUrl,
        coverUrl,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        artistId: artist.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        albumId: album.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        genreId: genre.id,
      },
    });

    seededTracks.push(track);
  }

  console.log(
    `🎶 Seeded ${seededTracks.length} tracks with real playable WAV audio`,
  );

  // 7. Create Playlists & Add tracks
  const playlistsData = [
    {
      name: 'Retro Coding Drive',
      description:
        'Futuristic synthwave playlist for maximum programming focus.',
      ownerId: admin.id,
      isPublic: true,
      coverFile: 'playlist-retro.svg',
      c1: '#8a2387',
      c2: '#e94057',
      trackIndexes: [0, 1, 4],
    },
    {
      name: 'Rainy Day Relax',
      description: 'Lofi study beats for a quiet and cozy afternoon.',
      ownerId: normalUser.id,
      isPublic: true,
      coverFile: 'playlist-rainy.svg',
      c1: '#00c6ff',
      c2: '#0072ff',
      trackIndexes: [2, 3],
    },
  ];

  for (const pl of playlistsData) {
    const coverUrl = generateSvgCover(pl.name, pl.c1, pl.c2, pl.coverFile);
    const playlist = await prisma.playlist.create({
      data: {
        name: pl.name,
        description: pl.description,
        coverUrl,
        isPublic: pl.isPublic,
        ownerId: pl.ownerId,
      },
    });

    // Add tracks to playlist
    for (let i = 0; i < pl.trackIndexes.length; i++) {
      const idx = pl.trackIndexes[i];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const track = seededTracks[idx];
      await prisma.playlistTrack.create({
        data: {
          playlistId: playlist.id,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          trackId: track.id,
          position: i,
        },
      });
    }
  }

  // Generate generic profile avatars
  generateSvgCover('Admin', '#00f2fe', '#4facfe', 'avatar-admin.svg');
  generateSvgCover('Artist', '#f107a3', '#7b2ff7', 'avatar-artist.svg');
  generateSvgCover('User', '#ff9966', '#ff5e62', 'avatar-user.svg');

  console.log('📂 Seeded initial Playlists and populated them with tracks');
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
