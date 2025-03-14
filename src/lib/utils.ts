import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function assert(condition: boolean, msg?: string): asserts condition {
  if (!condition) {
    throw Error(msg)
  }
}
