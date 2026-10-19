"use client"

import dynamic from "next/dynamic"

/**
 * The staff app is a client-rendered SPA (Vite), and MUI X's grid generates ids with Math.random()
 * during render, which Next's prerender rejects. So the prototype renders client-only, as it would
 * in staff.
 */
export const ClientOnlyShell = dynamic(() => import("./prototype-shell").then((m) => m.PrototypeShell), {
  ssr: false,
})
