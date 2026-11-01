export const metadata = { title: "ایڈمن پینل" };

// Pass-through layout: auth guard + AdminShell live in (panel)/layout.tsx
// so that /admin/login stays standalone (no shell, no redirect).
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
