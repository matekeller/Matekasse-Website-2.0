'use client'
import { ScanBarcode } from 'lucide-react'
import { useState } from 'react'
import { BarQRCodeScanner } from '@/components/admin/users/Scanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface BluecardInputProps {
  id: string
  name: string
  label?: string
  value: string
  onChange: (value: string) => void
  warning?: string
  disabled?: boolean
}

export const BluecardInput = (props: BluecardInputProps) => {
  const { id, name, label, value, onChange, warning, disabled } = props
  const [scanning, setScanning] = useState(false)

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label ?? 'Bluecard ID'}</Label>
      <div className="flex gap-1">
        <Input
          id={id}
          name={name}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Type or scan…"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={warning !== undefined}
          disabled={disabled}
        />
        <Button
          type="button"
          variant={scanning ? 'default' : 'outline'}
          size="icon"
          onClick={() => setScanning(!scanning)}
          disabled={disabled}
          aria-pressed={scanning}
          aria-label="Scan bluecard with camera"
        >
          <ScanBarcode />
        </Button>
      </div>
      {scanning && (
        <div className="overflow-hidden rounded-md border">
          <BarQRCodeScanner
            onScan={(codes) => {
              const code = codes.at(0)?.rawValue
              if (code !== undefined) {
                onChange(code)
                setScanning(false)
              }
            }}
          />
        </div>
      )}
      {warning !== undefined && (
        <span className="text-xs text-red-400">{warning}</span>
      )}
    </div>
  )
}
