'use client';

export default function AdminLogout() {
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch('/api/admin/login', { method: 'DELETE' });
        window.location.href = '/admin/login';
      }}
      className="text-xs text-neutral-400 hover:text-ink"
    >
      Çıkış
    </button>
  );
}
