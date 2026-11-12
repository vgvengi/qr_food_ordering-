import Link from "next/link";

// Demo landing page. In a real restaurant, customers arrive via the table QR, not this page.
const DEMO_TABLES = [
  ["T1", "t1a8f3k2m9qz"],
  ["T2", "t2b7d4n1p8wx"],
  ["T3", "t3c6e5r0s7vy"],
];

export default function Home() {
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-bold">TableTap</h1>
      <p className="mt-2 text-stone-600">
        Scan the QR on your table, order and pay from your phone. The kitchen sees it instantly.
      </p>
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-stone-500">Try it as a customer</h2>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {DEMO_TABLES.map(([label, token]) => (
          <Link key={token} href={`/t/${token}`}
            className="rounded-xl border border-stone-200 bg-white p-4 text-center font-semibold hover:border-orange-500">
            Table {label}
          </Link>
        ))}
      </div>
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-stone-500">Restaurant side</h2>
      <Link href="/kitchen" className="mt-3 block rounded-xl bg-stone-900 p-4 text-center font-semibold text-white">
        Open kitchen board
      </Link>
    </main>
  );
}
