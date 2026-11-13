'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { refreshData } from '@/hooks/data'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const REFRESH_INTERVAL = 60_000
const MIN_SPIN_DURATION = 500
let lastRefreshAt = Date.now()

export const AutoRefresh = () => {
  const refreshInProgress = useRef(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refresh = useCallback(async () => {
    if (refreshInProgress.current) return

    refreshInProgress.current = true
    lastRefreshAt = Date.now()
    setIsRefreshing(true)
    const startedAt = Date.now()

    try {
      await refreshData()
    } catch {
      toast.warning(
        'Could not refresh data. Showing the last loaded information.',
      )
    } finally {
      const remaining = MIN_SPIN_DURATION - (Date.now() - startedAt)
      if (remaining > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remaining))
      }
      refreshInProgress.current = false
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const refreshIfStale = () => {
      if (!document.hidden && Date.now() - lastRefreshAt >= REFRESH_INTERVAL) {
        void refresh()
      }
    }
    const interval = window.setInterval(refreshIfStale, REFRESH_INTERVAL)
    document.addEventListener('visibilitychange', refreshIfStale)
    window.addEventListener('focus', refreshIfStale)
    refreshIfStale()
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshIfStale)
      window.removeEventListener('focus', refreshIfStale)
    }
  }, [refresh])

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            className="ml-auto size-11 shrink-0 touch-manipulation"
            aria-label="Refresh data"
            onClick={() => void refresh()}
          >
            <RefreshCw
              className={`size-5 motion-reduce:animate-none ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </Button>
        }
      />
      <TooltipContent side="bottom" align="end">
        Refresh now (auto every minute)
      </TooltipContent>
    </Tooltip>
  )
}
