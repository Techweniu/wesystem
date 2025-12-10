import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // MUDANÇAS SOFT UI:
        // 1. rounded-lg: Cantos arredondados consistentes
        // 2. border-transparent: Removemos a borda padrão
        // 3. bg-muted/40: Fundo cinza bem suave (estilo "filled")
        // 4. shadow-inner-soft: Sombra interna para profundidade
        // 5. focus-visible:bg-background: Ao focar, ele fica branco
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-10 w-full min-w-0 rounded-lg border border-transparent bg-muted/40 px-3 py-1 text-base shadow-inner-soft transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'hover:bg-muted/60', // Escurece levemente ao passar o mouse
        'focus-visible:bg-background focus-visible:border-ring focus-visible:ring-ring/20 focus-visible:ring-[3px] focus-visible:shadow-soft-sm', // "Acende" no foco
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        'dark:bg-input/20 dark:hover:bg-input/30 dark:focus-visible:bg-background/10', // Ajustes Dark Mode
        className,
      )}
      {...props}
    />
  )
}

export { Input }
