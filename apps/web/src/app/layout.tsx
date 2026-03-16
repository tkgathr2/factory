export const metadata = {
  title: "Specification Engine",
  description: "Generate verified specification documents from rough requirements",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
