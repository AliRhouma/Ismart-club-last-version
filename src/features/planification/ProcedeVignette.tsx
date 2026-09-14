import { useState } from "react"
import { ImageOff } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Le schéma d'un procédé, en petit.
 *
 * Un éducateur reconnaît un exercice à son dessin bien avant son titre, donc la
 * vignette accompagne le procédé partout où on le choisit ou le relit. Les
 * schémas viennent de la bibliothèque du club (URL distante ou data-URI) : si
 * l'image manque ou ne charge pas, la tuile reste — un trou dans la liste ferait
 * sauter l'alignement.
 */
export function ProcedeVignette({
  src,
  titre,
  className,
}: {
  src?: string
  titre: string
  className?: string
}) {
  const [rate, setRate] = useState(false)

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-nested",
        className,
      )}
    >
      {src && !rate ? (
        <img
          src={src}
          alt={"Schéma du procédé " + titre}
          loading="lazy"
          onError={() => setRate(true)}
          className="size-full object-contain"
        />
      ) : (
        <ImageOff size={16} className="text-ink-disabled" aria-hidden />
      )}
    </span>
  )
}
