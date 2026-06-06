import Link from "next/link";

const CINEMAS = [
  {
    id: "vishow-ty",
    name: "桃園統領威秀影城",
    brand: "VIESHOW",
    address: "桃園市桃園區中正路1188號",
    colorFrom: "from-red-900/40",
    colorTo: "to-red-950/60",
    accent: "bg-red-600",
    logo: "V",
  },
  {
    id: "vishow-tg",
    name: "桃園桃知道威秀影城",
    brand: "VIESHOW",
    address: "桃園市桃園區春日路1688號",
    colorFrom: "from-red-900/40",
    colorTo: "to-red-950/60",
    accent: "bg-red-600",
    logo: "V",
  },
  {
    id: "ambassador",
    name: "八德廣豐國賓影城",
    brand: "AMBASSADOR",
    address: "桃園市八德區介壽路一段728號3樓",
    colorFrom: "from-indigo-900/40",
    colorTo: "to-indigo-950/60",
    accent: "bg-indigo-600",
    logo: "A",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-white/10 px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <span className="text-2xl">🎬</span>
          <div>
            <h1 className="text-xl font-bold tracking-wide">桃園電影院</h1>
            <p className="text-xs text-white/40">院線片場次聚合</p>
          </div>
        </div>
      </header>

      <section className="px-8 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-3 tracking-tight">今天想看什麼？</h2>
          <p className="text-white/50 text-lg">選擇影城，查看今日上映場次</p>
        </div>
      </section>

      <section className="px-8 pb-16 flex-1">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {CINEMAS.map((cinema) => (
            <Link
              key={cinema.id}
              href={`/cinema/${cinema.id}`}
              className={`group relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br ${cinema.colorFrom} ${cinema.colorTo} hover:border-white/30 hover:scale-[1.02] transition-all duration-300 cursor-pointer block`}
            >
              <div className={`h-1 ${cinema.accent}`} />
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-full ${cinema.accent} flex items-center justify-center font-bold text-lg`}>
                    {cinema.logo}
                  </div>
                  <span className="text-xs font-semibold tracking-[0.2em] text-white/50 uppercase">
                    {cinema.brand}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2 leading-snug">{cinema.name}</h3>
                <p className="text-sm text-white/40">{cinema.address}</p>
                <div className="mt-8 flex items-center gap-2 text-sm font-medium text-white/60 group-hover:text-white transition-colors">
                  <span>查看院線片</span>
                  <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 px-8 py-5 text-center text-xs text-white/30">
        資料每日更新 · 訂票請至各影城官網
      </footer>
    </main>
  );
}
