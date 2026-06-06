"use client";

import type { Movie } from "@/app/types";

interface Props {
  movie: Movie;
}

function parseNameAndFormat(raw: string): { name: string; format: string } {
  const m = raw.match(/^\(([^)]+)\)\s*(.+)$/);
  if (m) return { name: m[2].trim(), format: m[1].trim() };
  return { name: raw.trim(), format: "" };
}

export default function MovieRow({ movie }: Props) {
  const { name, format } = parseNameAndFormat(movie.name);

  return (
    <div className="flex items-start gap-4 px-5 py-4 border-b border-white/8 hover:bg-white/[0.03] transition-colors">
      {/* 電影名稱欄 */}
      <div className="w-56 shrink-0">
        <p className="font-semibold text-sm leading-snug">{name}</p>
        {format && (
          <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded bg-white/10 text-white/50">
            {format}
          </span>
        )}
      </div>

      {/* 放映時間欄 */}
      <div className="flex-1">
        <p className="text-[10px] text-white/30 mb-1.5 uppercase tracking-wider">放映時間</p>
        {movie.sessions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {movie.sessions.map((s, i) => (
              <a
                key={i}
                href={s.bookingUrl || "#"}
                target={s.bookingUrl ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="text-xs px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/25 border border-white/10 hover:border-white/40 transition-colors font-mono tabular-nums"
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
  );
}
