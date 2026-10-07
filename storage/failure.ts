"use client"

import { toast } from "@/hooks/use-toast"

export function reportStorageFailure(action = "save progress") {
  toast({
    title: "Progress storage unavailable",
    description: `Could not ${action}. Check available device storage and browser storage permissions, then retry.`,
    variant: "destructive",
  })
}
