"use client";

import { useEffect, useState } from "react";
import { api, STATUS_LABEL } from "@/lib/api";
import { getSocket } from "@/lib/socket";

const ACTION = { paid: "Start preparing", preparing: "Mark ready", ready: "Mark served" };
const COLUMNS = ["paid", "preparing", "ready"];

function minutesAgo(ts) {
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  return m < 1 ? "just now" : `${m} min ago`;
}

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  const load = () => api("/api/kitchen/orders").then(setOrders).catch((e) => setError(e.message));

  const [live, setLive] = useState(false);

  useEffect(() => {
    load();
    const socket = getSocket();
    const join = () => { socket.emit("join:kitchen"); setLive(true); load(); };
    const onUpdate = (order) =>
      setOrders((os) => {
        const rest = os.filter((o) => o.id !== order.id);
        if (!["paid", "preparing", "ready"].includes(order.status)) return rest;
        return [...rest, order].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      });
    const onDown = () => setLive(false);
    if (socket.connected) join();
    socket.on("connect", join);
    socket.on("disconnect", onDown);
    socket.on("order:updated", onUpdate);
    const t = setInterval(load, 30000); // safety net if a socket event is ever missed
    return () => { socket.off("connect", join); socket.off("disconnect", onDown); socket.off("order:updated", onUpdate); clearInterval(t); };
  }, []);

  async function advance(id) {
    try {
      const updated = await api(`/api/kitchen/orders/${id}`, { method: "PATCH" });
      setOrders((os) => (updated.status === "served" ? os.filter((o) => o.id !== id) : os.map((o) => (o.id === id ? updated : o))));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main className="min-h-screen bg-stone-900 p-4 text-stone-100">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kitchen board</h1>
        <span className="flex items-center gap-2 text-sm text-stone-400">
          <span className={`h-2 w-2 rounded-full ${live ? "bg-green-500" : "bg-stone-500"}`} />
          {live ? "Live" : "Connecting…"}
        </span>
      </div>
      {error && <p className="mb-4 text-red-400">{error}</p>}
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <section key={col} className="rounded-xl bg-stone-800 p-3">
            <h2 className="mb-3 font-semibold">
              {STATUS_LABEL[col]} <span className="text-stone-400">({orders.filter((o) => o.status === col).length})</span>
            </h2>
            <div className="space-y-3">
              {orders.filter((o) => o.status === col).map((o) => (
                <article key={o.id} className="rounded-lg bg-stone-100 p-3 text-stone-900">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold">Table {o.table_label}</span>
                    <span className="text-stone-500">#{o.id} · {minutesAgo(o.created_at)}</span>
                  </div>
                  <ul className="mt-2 text-sm">
                    {o.items.map((it, i) => <li key={i}><b>{it.quantity}×</b> {it.name}</li>)}
                  </ul>
                  {o.customer_note && <p className="mt-2 text-sm italic text-stone-600">“{o.customer_note}”</p>}
                  <button onClick={() => advance(o.id)}
                    className="mt-3 w-full rounded-md bg-orange-600 py-2 text-sm font-semibold text-white">
                    {ACTION[o.status]}
                  </button>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
