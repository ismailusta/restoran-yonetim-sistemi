'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import HorizontalScrollTabs from '@/components/HorizontalScrollTabs';

const LINKS = [
  { href: '/admin', label: 'Panel', exact: true },
  { href: '/admin/menu', label: 'Menü' },
  { href: '/admin/waiters', label: 'Garsonlar' },
  { href: '/admin/stats', label: 'İstatistikler' },
  { href: '/admin/areas', label: 'Alanlar' },
  { href: '/admin/settings', label: 'Ayarlar' },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <HorizontalScrollTabs innerClassName="gap-4 px-1 py-0.5 md:gap-6">
      {LINKS.map((link) => {
        const active = isActive(pathname, link.href, link.exact);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex-none whitespace-nowrap text-sm transition-colors ${
              active ? 'font-medium text-ink' : 'text-neutral-500 active:text-ink'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </HorizontalScrollTabs>
  );
}
