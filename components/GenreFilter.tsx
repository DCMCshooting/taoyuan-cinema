"use client";

import { useState } from "react";
import type { Movie } from "@/app/types";
import MovieCard from "./MovieCard";
import MovieRow from "./MovieRow";

interface Props {
  genres: string[];
  movies: (Movie & { genre: string })[];
  listView?: boolean;
}

export default function GenreFilter({ genres, movies, listView = false }: Props) {
  const [selected, setSelected] = useState<string>("全部");

  const filtered = selected === "全部" ? movies : movies.filter((m) => m.genre === selected);

  return (
    <div>
      {/* Genre chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {["全部", ...genres].map((g) => (
          <button
            key={g}
            onClick={() => setSelected(g)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-all duration-150 ${
              selected === g
                ? "bg-white text-black border-white font-semibold"
                : "bg-white/5 text-white/60 border-white/15 hover:border-white/30 hover:text-white"
            }`}
          >
            {g}
            {g !== "全部" && (
              <span className="ml-1.5 text-xs opacity-60">
                {movies.filter((m) => m.genre === g).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {listView ? (
        /* List view: 電影名稱 | 放映時間 */
        <div className="rounded-xl border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4 px-5 py-2.5 bg-white/5 border-b border-white/10">
            <span className="w-56 shrink-0 text-xs text-white/40 uppercase tracking-wider">電影名稱</span>
            <span className="text-xs text-white/40 uppercase tracking-wider">放映時間</span>
          </div>

          {filtered.map((movie, i) => (
            <MovieRow key={`${movie.id}-${i}`} movie={movie} />
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-white/30">
              <p className="text-3xl mb-2">🎬</p>
              <p className="text-sm">此類型目前沒有上映中的電影</p>
            </div>
          )}
        </div>
      ) : (
        /* Card view */
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((movie, i) => (
              <MovieCard key={`${movie.id}-${i}`} movie={movie} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-white/30">
              <p className="text-4xl mb-3">🎬</p>
              <p>此類型目前沒有上映中的電影</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
