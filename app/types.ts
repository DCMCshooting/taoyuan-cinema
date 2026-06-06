export interface Session {
  date: string;
  time: string;
  hall: string;
  seats: string;
  bookingUrl: string;
}

export interface Movie {
  id: string;
  name: string;
  nameEn: string;
  rating: string;
  duration: string;
  poster: string;
  genre?: string;
  sessions: Session[];
}

export interface CinemaData {
  cinemaId: string;
  cinemaName: string;
  address: string;
  movies: Movie[];
  scrapedAt: string;
}
