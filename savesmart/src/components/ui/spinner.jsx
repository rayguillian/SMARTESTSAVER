import { cn } from "../../lib/utils"

function Spinner({ className }) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full h-12 w-12 border-b-2 border-primary",
        className
      )}
    />
  )
}

export { Spinner }
