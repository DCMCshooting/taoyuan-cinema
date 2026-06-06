"use client";

import Image from "next/image";
import type { Movie } from "@/app/types";

interface Props {
  movie: Movie;
}

function cleanMovieName(name: string): string {
  // Remove format tags like (數位), (ATMOS‧數位‧英文版), (DBOX特別場) etc.
  return name
    .replace(/^\([^)]*\)\s*/g, "")
    .replace(/（[^）]*）/g, "")
    .trim();
}

export default function MovieCard({ movie }: Props) {
  const displayName = cleanMovieName(movie.name);
  const hasFormat =
    movie.name.includes("ATMOS") ||
    movie.name.includes("3D") ||
    movie.name.includes("IMAX") ||
    movie.name.includes("DBOX") ||
    movie.name.includes("數位");

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-white/[0.05] hover:border-white/25 hover:bg-white/[0.08] transition-all duration-200 flex flex-col group">
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-white/[0.04] overflow-hidden">
        {movie.poster ? (
          <Image
            src={movie.poster}
            alt={displayName}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/15">
            <span className="text-5xl">🎬</span>
            <span className="text-xs tracking-widest uppercase">No Poster</span>
          </div>
        )}
        {/* Gradient overlay for readability */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Format badge */}
        {hasFormat && (
          <span className="absolute top-2 right-2 text-[10px] bg-black/70 px-1.5 py-0.5 rounded border border-white/20 text-white/70 font-medium">
            {movie.name.includes("ATMOS") ? "ATMOS" :
             movie.name.includes("IMAX") ? "IMAX" :
             movie.name.includes("DBOX") ? "D-BOX" :
             movie.name.includes("3D") ? "3D" : "數位"}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-2">{displayName}</h3>
        {movie.nameEn && (
          <p className="text-xs text-white/35 mb-2 line-clamp-1">{movie.nameEn}</p>
        )}

        {/* Sessions */}
        <div className="mt-auto pt-2">
          {movie.sessions.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {movie.sessions.map((s, i) => (
                <a
                  key={i}
                  href={s.bookingUrl || "#"}
                  target={s.bookingUrl ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="text-xs px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/25 border border-white/10 hover:border-white/40 transition-colors font-mono tabular-nums"
                  title={s.hall ? `${s.hall}${s.seats ? " · " + s.seats : ""}` : s.time}
                >
                  {s.time}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/25 italic">暫無場次</p>
          )}
        </div>
      </div>
    </div>
  );
}
