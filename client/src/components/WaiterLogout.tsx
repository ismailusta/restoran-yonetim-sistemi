'use client';

export default function WaiterLogout() {
  return (
    <button
      type="button"
      onClick={async () => {
        const sessionRes = await fetch('/api/waiter/session');
        if (sessionRes.ok) {
          const session = await sessionRes.json();
          if (session.role === 'admin') {
            window.location.href = '/admin';
            return;
          }
        }
        await fetch('/api/waiter/login', { method: 'DELETE' });
        window.location.href = '/waiter/login';
      }}
      className="text-xs text-neutral-400 hover:text-ink"
    >
      Çıkış
    </button>
  );
}
