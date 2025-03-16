import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}
type Assert = (condition: unknown, message?: string) => asserts condition
export const assert: Assert = (
  condition: unknown,
  msg?: string,
): asserts condition => {
  if (!condition) {
    throw Error(msg)
  }
}
