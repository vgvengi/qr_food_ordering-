"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, rupees, STATUS_LABEL } from "@/lib/api";
import { getSocket } from "@/lib/socket";

const STEPS = ["paid", "preparing", "ready", "served"];

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const load = () => api(`/api/orders/${id}`).then((o) => alive && setOrder(o)).catch((e) => alive && setError(e.message));
    load();
    const socket = getSocket();
    const join = () => { socket.emit("join:order", Number(id)); load(); };
    const onUpdate = (o) => { if (alive && o.id === Number(id)) setOrder(o); };
    if (socket.connected) join();
    socket.on("connect", join);
    socket.on("order:updated", onUpdate);
    const t = setInterval(load, 30000); // safety net if a socket event is ever missed
    return () => { alive = false; socket.off("connect", join); socket.off("order:updated", onUpdate); clearInterval(t); };
  }, [id]);

  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!order) return <p className="p-6 text-stone-500">Loading order…</p>;
  const current = STEPS.indexOf(order.status);

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <p className="text-sm text-stone-500">Order #{order.id} · Table {order.table_label}</p>
      <h1 className="mt-1 text-2xl font-bold">{STATUS_LABEL[order.status]}</h1>

      <ol className="mt-6 flex gap-2">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= current ? "bg-orange-600" : "bg-stone-200"}`} />
            <p className={`mt-1 text-xs ${i <= current ? "font-semibold" : "text-stone-400"}`}>{STATUS_LABEL[s]}</p>
          </li>
        ))}
      </ol>

      <ul className="mt-8 divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
        {order.items.map((it, i) => (
          <li key={i} className="flex justify-between p-3 text-sm">
            <span>{it.quantity} × {it.name}</span>
            <span>{rupees(it.price_paise * it.quantity)}</span>
          </li>
        ))}
        <li className="flex justify-between p-3 font-semibold">
          <span>Paid</span><span>{rupees(order.total_paise)}</span>
        </li>
      </ul>
    </main>
  );
}
