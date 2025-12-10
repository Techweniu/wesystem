import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full rounded-lg border border-transparent bg-muted/40 px-3 py-2 text-base shadow-inner-soft transition-all duration-200 outline-none md:text-sm',
        'hover:bg-muted/60',
        'focus-visible:bg-background focus-visible:border-ring focus-visible:ring-ring/20 focus-visible:ring-[3px] focus-visible:shadow-soft-sm',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        'dark:bg-input/20 dark:hover:bg-input/30 dark:focus-visible:bg-background/10',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
