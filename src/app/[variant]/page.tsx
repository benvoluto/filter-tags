import { notFound } from "next/navigation"

import { ClientOnlyShell } from "@/components/client-only-shell"
import { PROTOTYPE_VARIANTS, isPrototypeVariant } from "@/lib/variants"

/** /filters, /quick, /views, /prompt: the same page, opened at that variant (read client-side). */
export function generateStaticParams() {
  return PROTOTYPE_VARIANTS.map((variant) => ({ variant }))
}

export default async function VariantPage({ params }: PageProps<"/[variant]">) {
  const { variant } = await params
  if (!isPrototypeVariant(variant)) notFound()
  return <ClientOnlyShell />
}
