export const metadata = {
  title: "仕様書エンジン",
  description: "ラフな要件から検証済み仕様書を自動生成",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
