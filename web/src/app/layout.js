import "./globals.css";

export const metadata = {
  title: "TableTap",
  description: "Scan the QR on your table, order and pay from your phone.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
