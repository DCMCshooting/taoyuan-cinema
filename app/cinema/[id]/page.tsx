import fs from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CinemaData, Movie } from "@/app/types";
import GenreFilter from "@/components/GenreFilter";

const CINEMA_MAP: Record<string, { file: string; cinemaIndex: number; accent: string; listView: boolean }> = {
  "vishow-ty": { file: "vishow.json", cinemaIndex: 0, accent: "bg-red-600", listView: true },
  "vishow-tg": { file: "vishow.json", cinemaIndex: 1, accent: "bg-red-600", listView: true },
  ambassador:  { file: "ambassador.json", cinemaIndex: 0, accent: "bg-indigo-600", listView: false },
};

function loadCinemaData(id: string): CinemaData | null {
  const config = CINEMA_MAP[id];
  if (!config) return null;

  const filePath = path.join(process.cwd(), "data", config.file);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const list: CinemaData[] = JSON.parse(raw);
  return list[config.cinemaIndex] ?? null;
}

function extractGenre(movie: Movie): string {
  const name = movie.name.toLowerCase();
  if (name.includes("動畫") || movie.nameEn?.toLowerCase().includes("animation")) return "動畫";
  if (name.includes("恐怖") || name.includes("驚聲") || name.includes("backroom")) return "恐怖";
  if (name.includes("動作") || name.includes("超人") || name.includes("超級") || name.includes("mandalorian")) return "動作";
  if (name.includes("愛情") || name.includes("戀") || name.includes("love")) return "愛情";
  if (name.includes("喜劇") || name.includes("笑")) return "喜劇";
  if (name.includes("科幻") || name.includes("太空")) return "科幻";
  if (name.includes("紀錄")) return "紀錄片";
  return "其他";
}

export default async function CinemaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cinema = loadCinemaData(id);
  if (!cinema) notFound();

  const config = CINEMA_MAP[id];
  const moviesWithGenre = cinema.movies.map((m) => ({ ...m, genre: extractGenre(m) }));
  const genres = Array.from(new Set(moviesWithGenre.map((m) => m.genre))).sort();

  const scrapedDate = new Date(cinema.scrapedAt).toLocaleDateString("zh-TW", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-white/10 px-8 py-5 sticky top-0 bg-[#0d0d0d]/90 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-white/40 hover:text-white transition-colors text-sm">
            ← 返回
          </Link>
          <div className={`w-1 h-6 rounded-full ${config.accent}`} />
          <div>
            <h1 className="text-lg font-bold">{cinema.cinemaName}</h1>
            <p className="text-xs text-white/40">{cinema.address}</p>
          </div>
          <div className="ml-auto text-xs text-white/30">
            資料更新：{scrapedDate}
          </div>
        </div>
      </header>

      <div className="px-8 py-8 flex-1">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <p className="text-white/50 text-sm">
              共 <span className="text-white font-semibold">{cinema.movies.length}</span> 部上映中
            </p>
          </div>

          <GenreFilter genres={genres} movies={moviesWithGenre} listView={config.listView} />
        </div>
      </div>

      <footer className="border-t border-white/10 px-8 py-5 text-center text-xs text-white/30">
        場次資料來源：{cinema.cinemaName}官網 · 訂票請至官網完成
      </footer>
    </main>
  );
}
