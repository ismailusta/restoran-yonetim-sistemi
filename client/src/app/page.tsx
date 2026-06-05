import Link from 'next/link';

const screens = [
  { href: '/waiter', label: 'Garson', desc: 'Sipariş alma ekranı' },
  { href: '/kitchen', label: 'Mutfak', desc: 'Yemek siparişleri (KDS)' },
  { href: '/bar', label: 'Bar', desc: 'İçecek siparişleri (KDS)' },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="mb-16 text-center">
        <h1 className="font-display text-5xl tracking-tight">Restoran KDS</h1>
        <p className="mt-3 text-neutral-400">Gerçek zamanlı sipariş takip demo</p>
      </div>

      <div className="grid w-full max-w-lg gap-4">
        {screens.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex items-center justify-between rounded-2xl border border-neutral-200 px-8 py-6 transition-all hover:border-ink hover:shadow-sm"
          >
            <div>
              <p className="text-lg font-medium">{s.label}</p>
              <p className="text-sm text-neutral-400">{s.desc}</p>
            </div>
            <span className="text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-ink">
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
