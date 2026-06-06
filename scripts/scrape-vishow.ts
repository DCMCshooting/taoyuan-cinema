import axios from "axios";
import fs from "fs";
import path from "path";

const BASE_URL = "https://www.vscinemas.com.tw/api";

const CINEMAS = [
  { id: "20|TY", name: "桃園統領威秀影城", address: "桃園市桃園區中正路1188號" },
  { id: "33|TG", name: "桃園桃知道威秀影城", address: "桃園市桃園區春日路1688號" },
];

const headers = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:150.0) Gecko/20100101 Firefox/150.0",
  "Accept": "*/*",
  "Content-Type": "application/json",
  "X-Requested-With": "XMLHttpRequest",
  "Referer": "https://www.vscinemas.com.tw/vsweb/film/index.aspx",
};

interface Movie {
  id: string;
  name: string;
  poster: string;
  sessions: Session[];
}

interface Session {
  date: string;
  time: string;
  sessionId: string;
  bookingUrl: string;
}

interface CinemaData {
  cinemaId: string;
  cinemaName: string;
  address: string;
  movies: Movie[];
  scrapedAt: string;
}

async function fetchWithSession(url: string, sessionCookie: string) {
  return axios.get(url, {
    headers: {
      ...headers,
      Cookie: `ASP.NET_SessionId=${sessionCookie}`,
    },
  });
}

async function initSession(): Promise<string> {
  const resp = await axios.get("https://www.vscinemas.com.tw/vsweb/film/index.aspx", {
    headers: { "User-Agent": headers["User-Agent"] },
  });
  const setCookie = resp.headers["set-cookie"] || [];
  const sessionCookie = setCookie
    .map((c: string) => c.split(";")[0])
    .find((c: string) => c.startsWith("ASP.NET_SessionId="));
  return sessionCookie ? sessionCookie.replace("ASP.NET_SessionId=", "") : "";
}

async function scrapeCinema(cinemaId: string, sessionCookie: string): Promise<Movie[]> {
  const moviesResp = await fetchWithSession(
    `${BASE_URL}/GetLstDicMovie?cinema=${encodeURIComponent(cinemaId)}`,
    sessionCookie
  );
  const movieList: { strText: string; strValue: string }[] = moviesResp.data;

  const movies: Movie[] = [];

  for (const movie of movieList) {
    try {
      const datesResp = await fetchWithSession(
        `${BASE_URL}/GetLstDicDate?cinema=${encodeURIComponent(cinemaId)}&movie=${movie.strValue}`,
        sessionCookie
      );
      const dates: { strValue: string; strText: string }[] = datesResp.data;

      const sessions: Session[] = [];

      for (const d of dates.slice(0, 1)) {
        const sessionsResp = await fetchWithSession(
          `${BASE_URL}/GetLstDicSession?cinema=${encodeURIComponent(cinemaId)}&movie=${movie.strValue}&date=${encodeURIComponent(d.strValue)}`,
          sessionCookie
        );
        const sessionList: { strText: string; strValue: string }[] = sessionsResp.data;

        for (const s of sessionList) {
          const bookingParams = new URLSearchParams(s.strValue);
          const bookingUrl = `https://www.vscinemas.com.tw/vsTicketing/ticketing/ticket.aspx?${s.strValue}`;
          sessions.push({
            date: d.strValue,
            time: s.strText,
            sessionId: s.strValue,
            bookingUrl,
          });
        }

        await new Promise((r) => setTimeout(r, 200));
      }

      movies.push({
        id: movie.strValue,
        name: movie.strText,
        poster: `https://www.unicornpopcorn.com.tw/ForVsWeb/upload/film/${movie.strValue}.jpg`,
        sessions,
      });

      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.warn(`Skipping movie ${movie.strText}:`, (err as Error).message);
    }
  }

  return movies;
}

async function main() {
  console.log("Initializing session...");
  const sessionCookie = await initSession();
  console.log(`Session: ${sessionCookie}`);

  const results: CinemaData[] = [];

  for (const cinema of CINEMAS) {
    console.log(`\nScraping ${cinema.name}...`);
    const movies = await scrapeCinema(cinema.id, sessionCookie);
    console.log(`  Found ${movies.length} movies`);

    results.push({
      cinemaId: cinema.id,
      cinemaName: cinema.name,
      address: cinema.address,
      movies,
      scrapedAt: new Date().toISOString(),
    });
  }

  const outPath = path.join(process.cwd(), "data", "vishow.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`\nSaved to ${outPath}`);
}

main().catch(console.error);
