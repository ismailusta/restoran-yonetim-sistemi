'use client';

import HorizontalScrollTabs from '@/components/HorizontalScrollTabs';

interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
}

function TabButton({
  cat,
  active,
  onSelect,
  className = '',
}: {
  cat: string;
  active: boolean;
  onSelect: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex-none whitespace-nowrap rounded-lg px-3.5 py-2.5 text-left text-sm transition-colors ${
        active ? 'bg-ink text-white' : 'text-neutral-500 active:bg-stone'
      } ${className}`}
    >
      {cat}
    </button>
  );
}

export default function CategoryTabs({
  categories,
  activeCategory,
  onSelect,
}: CategoryTabsProps) {
  return (
    <div className="shrink-0 border-b border-neutral-200 bg-white md:w-44 md:border-b-0 md:border-r">
      <div className="md:hidden">
        <HorizontalScrollTabs innerClassName="gap-1.5 px-3 py-2.5" fade="white">
          {categories.map((cat) => (
            <TabButton
              key={cat}
              cat={cat}
              active={activeCategory === cat}
              onSelect={() => onSelect(cat)}
            />
          ))}
        </HorizontalScrollTabs>
      </div>

      {/* Masaüstü: dikey liste */}
      <div className="category-tabs-desktop hidden md:block">
        <div className="flex flex-col gap-1 px-3 py-6">
          {categories.map((cat) => (
            <TabButton
              key={cat}
              cat={cat}
              active={activeCategory === cat}
              onSelect={() => onSelect(cat)}
              className="w-full whitespace-normal hover:bg-stone"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
