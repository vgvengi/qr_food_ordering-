"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, rupees } from "@/lib/api";
import { payWithRazorpay } from "@/lib/razorpay";

export default function TableMenu() {
  const { token } = useParams();
  const router = useRouter();
  const [table, setTable] = useState(null);
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({}); // menuItemId -> quantity
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    Promise.all([api(`/api/tables/${token}`), api("/api/menu")])
      .then(([t, m]) => { setTable(t); setMenu(m); })
      .catch((e) => setError(e.message));
  }, [token]);

  const itemsById = useMemo(() => new Map(menu.flatMap((c) => c.items).map((i) => [i.id, i])), [menu]);
  const lines = Object.entries(cart).filter(([, q]) => q > 0).map(([id, q]) => ({ item: itemsById.get(Number(id)), q }));
  const total = lines.reduce((s, l) => s + l.item.price_paise * l.q, 0);
  const count = lines.reduce((s, l) => s + l.q, 0);

  const change = (id, delta) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, Math.min(20, (c[id] || 0) + delta)) }));

  async function checkout() {
    setError("");
    setPaying(true);
    try {
      const order = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({ tableToken: token, items: lines.map((l) => ({ menuItemId: l.item.id, quantity: l.q })) }),
      });
      const payment = order.mockPayment
        ? { razorpayOrderId: order.razorpayOrderId, razorpayPaymentId: `mock_pay_${order.orderId}`, signature: "mock_signature" }
        : await payWithRazorpay({
            keyId: order.razorpayKeyId,
            razorpayOrderId: order.razorpayOrderId,
            amountPaise: order.totalPaise,
            description: `Table ${table.label}`,
          });
      await api(`/api/orders/${order.orderId}/verify`, { method: "POST", body: JSON.stringify(payment) });
      router.push(`/orders/${order.orderId}`);
    } catch (e) {
      setError(e.message);
      setPaying(false);
    }
  }

  if (error && !table) return <p className="p-6 text-red-600">{error}</p>;
  if (!table) return <p className="p-6 text-stone-500">Loading menu…</p>;

  return (
    <main className="mx-auto max-w-md pb-32">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur">
        <p className="text-xs text-stone-500">You are at</p>
        <h1 className="text-xl font-bold">Table {table.label}</h1>
      </header>

      {menu.map((cat) => (
        <section key={cat.id} className="px-4 pt-6">
          <h2 className="mb-2 text-lg font-semibold">{cat.name}</h2>
          <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
            {cat.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 p-3">
                <span className={`h-3 w-3 shrink-0 rounded-sm border-2 ${item.is_veg ? "border-green-600" : "border-red-600"}`}
                  title={item.is_veg ? "Veg" : "Non-veg"} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="truncate text-sm text-stone-500">{item.description}</p>
                  <p className="text-sm font-semibold">{rupees(item.price_paise)}</p>
                </div>
                {cart[item.id] ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => change(item.id, -1)} className="h-8 w-8 rounded-full border border-orange-600 text-orange-600">−</button>
                    <span className="w-4 text-center font-semibold">{cart[item.id]}</span>
                    <button onClick={() => change(item.id, 1)} className="h-8 w-8 rounded-full bg-orange-600 text-white">+</button>
                  </div>
                ) : (
                  <button onClick={() => change(item.id, 1)}
                    className="rounded-lg border border-orange-600 px-4 py-1.5 text-sm font-semibold text-orange-600">Add</button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white p-4">
          <div className="mx-auto max-w-md">
            {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
            <button onClick={checkout} disabled={paying}
              className="flex w-full items-center justify-between rounded-xl bg-orange-600 px-5 py-3.5 font-semibold text-white disabled:opacity-60">
              <span>{count} item{count > 1 ? "s" : ""} · {rupees(total)}</span>
              <span>{paying ? "Processing…" : "Pay & order →"}</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
