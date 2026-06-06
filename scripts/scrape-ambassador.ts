import { chromium } from "playwright";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

const THEATER = {
  id: "8fda9934-73d4-4c14-b1c4-386c2b81045c",
  name: "八德廣豐國賓影城",
  address: "桃園市八德區介壽路一段728號3樓",
};

interface Session {
  date: string;
  time: string;
  hall: string;
  seats: string;
  bookingUrl: string;
}

interface Movie {
  id: string;
  name: string;
  nameEn: string;
  rating: string;
  duration: string;
  poster: string;
  sessions: Session[];
}

interface CinemaData {
  cinemaId: string;
  cinemaName: string;
  address: string;
  movies: Movie[];
  scrapedAt: string;
}

function parseShowtimePage(html: string, date: string): Movie[] {
  const $ = cheerio.load(html);
  const movies: Movie[] = [];

  $(".movie-list-item, .showtime-movie, article").each((_, el) => {
    const $el = $(el);
    const name = $el.find(".movie-title, h3, h2").first().text().trim();
    if (!name) return;

    const nameEn = $el.find(".movie-title-en, .en-title").first().text().trim();
    const rating = $el.find(".rating, .movie-rating").first().text().trim();
    const duration = $el.find(".duration, .movie-duration").first().text().trim();
    const poster = $el.find("img").first().attr("src") || "";

    const sessions: Session[] = [];
    $el.find("a[href*='booking'], .session-time, .time-slot").each((_, sessionEl) => {
      const $s = $(sessionEl);
      const time = $s.text().trim();
      const href = $s.attr("href") || "";
      const hall = $s.closest("tr, .row, .session-row").find(".hall, .theater-hall").text().trim();
      const seats = $s.closest("tr, .row, .session-row").find(".seats").text().trim();

      if (/^\d{1,2}:\d{2}$/.test(time)) {
        sessions.push({
          date,
          time,
          hall,
          seats,
          bookingUrl: href.startsWith("http") ? href : `https://booking.ambassador.com.tw${href}`,
        });
      }
    });

    const movieId = name.replace(/[^a-zA-Z0-9一-鿿]/g, "").substring(0, 20);

    if (sessions.length > 0 || name) {
      movies.push({ id: movieId, name, nameEn, rating, duration, poster, sessions });
    }
  });

  return movies;
}

function parseShowtimePageV2(html: string, date: string): Movie[] {
  const $ = cheerio.load(html);
  const movies: Movie[] = [];

  // 國賓場次頁結構：每部電影有一個區塊，包含片名和場次時間
  const movieBlocks = $(".movie-info, .film-block, section, .col-12").filter((_, el) => {
    const text = $(el).text();
    return text.includes(":") && /\d{1,2}:\d{2}/.test(text);
  });

  movieBlocks.each((_, block) => {
    const $block = $(block);
    const nameEl = $block.find("h3, h4, .title, strong").first();
    const name = nameEl.text().trim();
    if (!name || name.length < 2) return;

    const poster = $block.find("img").first().attr("src") || "";
    const sessions: Session[] = [];

    $block.find("a").each((_, a) => {
      const $a = $(a);
      const time = $a.text().trim();
      if (/^\d{1,2}:\d{2}$/.test(time)) {
        const href = $a.attr("href") || "";
        sessions.push({
          date,
          time,
          hall: "",
          seats: "",
          bookingUrl: href.startsWith("http") ? href : `https://booking.ambassador.com.tw${href}`,
        });
      }
    });

    const movieId = name.replace(/[^a-zA-Z0-9一-鿿]/g, "").substring(0, 20);
    movies.push({ id: movieId, name, nameEn: "", rating: "", duration: "", poster, sessions });
  });

  return movies;
}

function parseShowtimeRaw(text: string, html: string, date: string): Movie[] {
  const $ = cheerio.load(html);
  const movies: Movie[] = [];

  // Strategy: find movie name elements followed by time patterns
  // 國賓網頁結構分析：片名在特定 class 內，時間在 a 標籤
  $("[class*='movie'], [class*='film'], [class*='show']").each((_, el) => {
    const $el = $(el);
    const fullText = $el.text();
    if (!fullText.includes(":") || !/\d{1,2}:\d{2}/.test(fullText)) return;

    const lines = fullText.split(/\n/).map((l) => l.trim()).filter(Boolean);
    let currentMovie: Movie | null = null;

    for (const line of lines) {
      if (/^\d{1,2}:\d{2}$/.test(line)) {
        if (currentMovie) {
          currentMovie.sessions.push({ date, time: line, hall: "", seats: "", bookingUrl: "" });
        }
      } else if (line.length > 2 && !line.match(/^\d/) && !line.match(/^[A-Z]{1,3}$/)) {
        if (currentMovie && currentMovie.sessions.length > 0) {
          movies.push(currentMovie);
        }
        currentMovie = {
          id: line.replace(/[^a-zA-Z0-9一-鿿]/g, "").substring(0, 20),
          name: line,
          nameEn: "",
          rating: "",
          duration: "",
          poster: "",
          sessions: [],
        };
      }
    }
    if (currentMovie && currentMovie.sessions.length > 0) {
      movies.push(currentMovie);
    }
  });

  // dedupe by movie name
  const seen = new Set<string>();
  return movies.filter((m) => {
    if (seen.has(m.name)) return false;
    seen.add(m.name);
    return true;
  });
}

async function main() {
  const today = new Date();
  const dateStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, "0")}/${String(today.getDate()).padStart(2, "0")}`;

  console.log(`Scraping 八德廣豐國賓影城 for ${dateStr}...`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1800 } });

  const url = `https://www.ambassador.com.tw/home/Showtime?ID=${THEATER.id}&DT=${encodeURIComponent(dateStr)}`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);

  const html = await page.content();
  const bodyText = await page.innerText("body");

  // Extract poster URLs: width=255 movie posters
  const posterData: { src: string; alt: string }[] = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("img"))
      .filter((img) => img.naturalWidth > 100 && img.src.includes("/assets/img/movies/"))
      .map((img) => ({ src: img.src, alt: img.alt }));
  });

  await browser.close();

  // Try extracting using structured parsing of the body text
  const movies = extractFromBodyText(bodyText, html, dateStr, posterData);

  console.log(`Found ${movies.length} movies`);
  movies.forEach((m) => console.log(`  ${m.name}: ${m.sessions.length} sessions`));

  const result: CinemaData = {
    cinemaId: THEATER.id,
    cinemaName: THEATER.name,
    address: THEATER.address,
    movies,
    scrapedAt: new Date().toISOString(),
  };

  const outPath = path.join(process.cwd(), "data", "ambassador.json");
  fs.writeFileSync(outPath, JSON.stringify([result], null, 2), "utf-8");
  console.log(`Saved to ${outPath}`);
}

function extractFromBodyText(
  text: string,
  html: string,
  date: string,
  posterData: { src: string; alt: string }[] = []
): Movie[] {
  const $ = cheerio.load(html);
  const movies: Movie[] = [];

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let currentName = "";
  let currentNameEn = "";
  let currentPoster = "";
  let currentSessions: Session[] = [];

  // Build poster list from the extracted poster data (dedupe by index position)
  const posterList = posterData.map((p) => p.src);

  // 找到電影名稱和場次的 pattern
  // 電影名稱行後面會接英文名、分級、時長，然後是場次
  const ratingPattern = /^(普遍級|保護級|輔12級|輔15級|限制級)/;
  const timePattern = /^\d{1,2}:\d{2}$/;
  const hallPattern = /^\d+廳/;
  const durationPattern = /^\d+時\d+分$|^\d+時$/;

  function saveCurrentMovie() {
    if (currentName && currentSessions.length > 0) {
      movies.push({
        id: currentName.replace(/[^a-zA-Z0-9一-鿿]/g, "").substring(0, 20),
        name: currentName,
        nameEn: currentNameEn,
        rating: "",
        duration: "",
        poster: currentPoster,
        sessions: [...currentSessions],
      });
    }
  }

  // Extract posters
  const posterMap: Record<string, string> = {};
  $("img").each((_, img) => {
    const src = $(img).attr("src") || "";
    const alt = $(img).attr("alt") || "";
    if (src && (src.includes("poster") || src.includes("movie") || src.includes("film"))) {
      if (alt) posterMap[alt] = src.startsWith("http") ? src : `https://www.ambassador.com.tw${src}`;
    }
  });

  // Extract booking links for sessions
  const sessionLinks: Record<string, string> = {};
  $("a").each((_, a) => {
    const href = $(a).attr("href") || "";
    const text = $(a).text().trim();
    if (timePattern.test(text) && href) {
      sessionLinks[text] = href.startsWith("http") ? href : `https://booking.ambassador.com.tw${href}`;
    }
  });

  // Parse lines
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Skip navigation lines
    if (["電影", "影城", "好康", "消息", "團體", "加入會員", "線上訂票", "首頁", "關於國賓"].includes(line)) {
      i++;
      continue;
    }

    // Time pattern - belongs to current movie
    if (timePattern.test(line)) {
      const bookingUrl = sessionLinks[line] || "";
      // Next line might be hall info
      let hall = "";
      let seats = "";
      if (i + 1 < lines.length && hallPattern.test(lines[i + 1])) {
        const hallLine = lines[i + 1];
        const hallMatch = hallLine.match(/^(\d+廳)\s*(\d+席)?/);
        if (hallMatch) {
          hall = hallMatch[1];
          seats = hallMatch[2] || "";
        }
        i++;
      }
      currentSessions.push({ date, time: line, hall, seats, bookingUrl });
      i++;
      continue;
    }

    // Skip hall/seats standalone lines
    if (hallPattern.test(line) || durationPattern.test(line) || ratingPattern.test(line)) {
      i++;
      continue;
    }

    // Check if this looks like a movie name
    // Movie names: Chinese chars, 2+ chars, not a common UI element
    const uiElements = new Set(["首頁", "電影時刻", "影城資訊", "當日", "找不到想看的電影嗎？", "換個影城試試看！", "請選擇戲院", "Copyright"]);
    const looksLikeMovieName =
      line.length >= 2 &&
      !line.startsWith("0") &&
      !line.match(/^\d/) &&
      !line.match(/^[A-Z]{1,3}$/) &&
      !line.match(/^(ATMOS|DBOX|3D|4DX|IMAX)/) &&
      !uiElements.has(line) &&
      !line.includes("©") &&
      !line.includes("@") &&
      line.length < 30;

    // Peek ahead: if next non-trivial lines contain a time, this is likely a movie name
    let hasTimeAhead = false;
    for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
      if (timePattern.test(lines[j])) { hasTimeAhead = true; break; }
    }

    if (looksLikeMovieName && hasTimeAhead) {
      saveCurrentMovie();
      currentName = line;
      currentNameEn = "";
      currentSessions = [];
      // Assign posters in order of discovery
      currentPoster = posterList[movies.length] || "";
      // Check if next line is English title
      if (i + 1 < lines.length && /^[A-Z]/.test(lines[i + 1]) && lines[i + 1].length > 3) {
        currentNameEn = lines[i + 1];
        i++;
      }
    }

    i++;
  }

  saveCurrentMovie();
  return movies;
}

main().catch(console.error);
