"use client";

import { io } from "socket.io-client";
import { API_URL } from "./api";

let socket;
// One shared connection per browser tab.
export function getSocket() {
  if (!socket) socket = io(API_URL, { transports: ["websocket", "polling"] });
  return socket;
}
