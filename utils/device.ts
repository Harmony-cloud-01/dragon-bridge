"use client"

export const isLowRam: boolean = (() => {
  try {
    const mem = (navigator as any)?.deviceMemory as number | undefined
    return typeof mem === "number" ? mem <= 2 : false
  } catch {
    return false
  }
})()

export const isLowCpu: boolean = (() => {
  try {
    const cores = navigator?.hardwareConcurrency
    return typeof cores === "number" ? cores <= 4 : false
  } catch {
    return false
  }
})()

