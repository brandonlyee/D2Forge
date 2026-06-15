"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Icon } from "@/components/forge/icons"

/* ---------------- Switch ---------------- */
export function ForgeSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  ariaLabel?: string
}) {
  return (
    <span
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      tabIndex={0}
      className={"switch" + (checked ? " on" : "")}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault()
          onChange(!checked)
        }
      }}
    />
  )
}

/* ---------------- Slider (pointer + keyboard) ---------------- */
export function ForgeSlider({
  value,
  onChange,
  min = 0,
  max = 200,
  step = 5,
  floor = null,
  locked = false,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  floor?: number | null
  locked?: boolean
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [drag, setDrag] = React.useState(false)
  const pct = ((value - min) / (max - min)) * 100

  const setFromClientX = React.useCallback(
    (clientX: number) => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      let ratio = (clientX - r.left) / r.width
      ratio = Math.max(0, Math.min(1, ratio))
      let v = min + ratio * (max - min)
      v = Math.round(v / step) * step
      onChange(Math.max(min, Math.min(max, v)))
    },
    [min, max, step, onChange]
  )

  React.useEffect(() => {
    if (!drag) return
    const move = (e: PointerEvent) => {
      e.preventDefault()
      setFromClientX(e.clientX)
    }
    const up = () => setDrag(false)
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    return () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }
  }, [drag, setFromClientX])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      onChange(Math.min(max, value + step))
      e.preventDefault()
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      onChange(Math.max(min, value - step))
      e.preventDefault()
    }
  }

  return (
    <div
      className={"slider" + (locked ? " locked" : "")}
      ref={ref}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId)
        setDrag(true)
        setFromClientX(e.clientX)
      }}
    >
      <div className="track">
        <div className="range" style={{ width: pct + "%" }} />
      </div>
      {floor != null && floor > min && (
        <div
          className="floor"
          style={{ left: ((floor - min) / (max - min)) * 100 + "%" }}
          title={"Minimum " + floor}
        />
      )}
      <div
        className={"thumb" + (drag ? " drag" : "")}
        style={{ left: pct + "%" }}
        tabIndex={0}
        role="slider"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        onKeyDown={onKey}
      />
    </div>
  )
}

/* ---------------- Number field ---------------- */
export function ForgeNumberField({
  value,
  onChange,
  min = 0,
  max = 200,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  return (
    <input
      className="numfield"
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      onChange={(e) => {
        const digits = e.target.value.replace(/[^0-9]/g, "")
        const v = digits === "" ? 0 : parseInt(digits, 10)
        onChange(Math.max(min, Math.min(max, v)))
      }}
    />
  )
}

/* ---------------- Tooltip ---------------- */
export function ForgeTooltip({ children }: { children: React.ReactNode }) {
  return (
    <span className="tip" tabIndex={0}>
      <Icon.info className="tip-ic" />
      <span className="tip-body">{children}</span>
    </span>
  )
}

/* ---------------- Select (custom dropdown) ---------------- */
export interface ForgeSelectItem {
  value: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
}

export function ForgeSelect({
  value,
  placeholder,
  items,
  onChange,
}: {
  value?: string
  placeholder?: string
  items: ForgeSelectItem[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  // The menu is portaled to <body> with fixed positioning so it can never be
  // clipped by a scrolling/overflow ancestor (e.g. the form's scroll pane) or
  // painted behind the pinned submit button. `pos` is measured from the trigger.
  const [pos, setPos] = React.useState<{
    left: number
    width: number
    top?: number
    bottom?: number
    maxHeight: number
  } | null>(null)
  const ref = React.useRef<HTMLDivElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)

  const updatePosition = React.useCallback(() => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const gap = 5
    const vh = window.innerHeight
    const spaceBelow = vh - r.bottom - gap
    const spaceAbove = r.top - gap
    // Flip upward only when below is cramped and above has more room.
    const openUp = spaceBelow < 220 && spaceAbove > spaceBelow
    const maxHeight = Math.max(120, Math.min(280, (openUp ? spaceAbove : spaceBelow)))
    setPos({
      left: r.left,
      width: r.width,
      top: openUp ? undefined : r.bottom + gap,
      bottom: openUp ? vh - r.top + gap : undefined,
      maxHeight,
    })
  }, [])

  React.useLayoutEffect(() => {
    if (!open) return
    updatePosition()
    const onScroll = () => updatePosition()
    // Capture phase so scrolls inside any nested overflow container are caught too.
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", onScroll)
    }
  }, [open, updatePosition])

  React.useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      const t = e.target as Node
      if (ref.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }
    window.addEventListener("mousedown", close)
    return () => window.removeEventListener("mousedown", close)
  }, [open])

  const current = items.find((i) => i.value === value)

  return (
    <div className="select" ref={ref}>
      <button
        type="button"
        className={"select-trigger" + (open ? " open" : "") + (current ? "" : " placeholder")}
        onClick={() => setOpen((o) => !o)}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {current?.icon}
          {current ? current.label : placeholder}
        </span>
        <Icon.chevron
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}
        />
      </button>
      {open && pos && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="select-menu"
            style={{
              position: "fixed",
              left: pos.left,
              width: pos.width,
              top: pos.top ?? "auto",
              bottom: pos.bottom ?? "auto",
              right: "auto",
              maxHeight: pos.maxHeight,
              zIndex: 1000,
            }}
          >
            {items.map((it) => (
              <div
                key={it.value}
                className={
                  "select-item" +
                  (it.value === value ? " sel" : "") +
                  (it.disabled ? " disabled" : "")
                }
                onClick={() => {
                  if (it.disabled) return
                  onChange(it.value)
                  setOpen(false)
                }}
              >
                {it.icon}
                <span style={{ flex: 1 }}>{it.label}</span>
                {it.value === value && <Icon.check style={{ width: 13, height: 13 }} />}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  )
}
