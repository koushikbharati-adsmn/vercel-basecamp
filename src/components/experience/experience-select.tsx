import { cn } from "@/lib/utils"
import { Check, ChevronDown } from "lucide-react"
import {
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
  type Ref,
} from "react"

export type SelectOption<Value extends string | number> = {
  value: Value
  label: string
  disabled?: boolean
}

type ExperienceSelectProps<Value extends string | number> = {
  options: SelectOption<Value>[]
  value: Value | null
  onValueChange: (value: Value) => void
  label: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  autoFocus?: boolean
  error?: string
  className?: string
  triggerClassName?: string
  listboxClassName?: string
  ref?: Ref<HTMLButtonElement>
}

/** Controlled, non-native select. Required-value validation belongs to the form. */
export function ExperienceSelect<Value extends string | number>({
  options,
  value,
  onValueChange,
  label,
  placeholder = "Select an option",
  disabled = false,
  required = false,
  autoFocus = false,
  error,
  className,
  triggerClassName,
  listboxClassName,
  ref,
}: ExperienceSelectProps<Value>) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listboxRef = useRef<HTMLUListElement>(null)
  const searchRef = useRef({ text: "", time: 0 })
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const expanded = open && !disabled
  const selected = options.find((option) => option.value === value)
  const enabledIndices = options.flatMap((option, index) =>
    option.disabled ? [] : [index]
  )
  const activeOption = options[activeIndex]

  useImperativeHandle(ref, () => triggerRef.current!, [])

  useEffect(() => {
    if (autoFocus && !disabled) triggerRef.current?.focus()
  }, [autoFocus, disabled])

  useEffect(() => {
    if (!expanded) return
    const dismiss = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", dismiss)
    return () => document.removeEventListener("pointerdown", dismiss)
  }, [expanded])

  useEffect(() => {
    if (expanded)
      listboxRef.current
        ?.querySelector('[data-active="true"]')
        ?.scrollIntoView({ block: "nearest" })
  }, [expanded, activeIndex])

  const openList = (last = false) => {
    const selectedIndex = options.findIndex(
      (option) => option.value === value && !option.disabled
    )
    setActiveIndex(
      selectedIndex >= 0
        ? selectedIndex
        : last
          ? (enabledIndices.at(-1) ?? -1)
          : (enabledIndices[0] ?? -1)
    )
    setOpen(true)
  }
  const choose = (index: number) => {
    const option = options[index]
    if (disabled || !option || option.disabled) return
    onValueChange(option.value)
    setOpen(false)
    triggerRef.current?.focus()
  }
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (event.key === "Escape" && expanded) {
      event.preventDefault()
      event.stopPropagation() // Close the list first, not the surrounding modal.
      setOpen(false)
    } else if (event.key === "Tab") {
      setOpen(false)
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      if (!expanded) {
        openList(event.key === "ArrowUp")
        return
      }
      const position = enabledIndices.indexOf(activeIndex)
      const next = position + (event.key === "ArrowDown" ? 1 : -1)
      setActiveIndex(
        enabledIndices[
          Math.max(0, Math.min(next, enabledIndices.length - 1))
        ] ?? -1
      )
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault()
      setOpen(true)
      setActiveIndex(
        event.key === "Home"
          ? (enabledIndices[0] ?? -1)
          : (enabledIndices.at(-1) ?? -1)
      )
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      if (expanded) choose(activeIndex)
      else openList()
    } else if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      const now = Date.now()
      const search =
        (now - searchRef.current.time < 700 ? searchRef.current.text : "") +
        event.key.toLowerCase()
      searchRef.current = { text: search, time: now }
      const match = options.findIndex(
        (option) =>
          !option.disabled && option.label.toLowerCase().startsWith(search)
      )
      if (match >= 0) {
        setOpen(true)
        setActiveIndex(match)
      }
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn("experience-select relative", className)}
      data-slot="select"
      data-state={expanded ? "open" : "closed"}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <label htmlFor={`${id}-trigger`} className="block text-sm font-bold">
        {label}
      </label>
      <button
        ref={triggerRef}
        id={`${id}-trigger`}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={expanded}
        aria-controls={`${id}-listbox`}
        aria-required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-activedescendant={
          expanded && activeOption && !activeOption.disabled
            ? `${id}-option-${activeIndex}`
            : undefined
        }
        disabled={disabled}
        className={cn(
          "mt-1.5 flex w-full items-center justify-between gap-3 border border-[#231f20]/25 bg-white px-2.5 py-[9px] text-left text-base font-normal text-[#231f20] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#231f20] disabled:cursor-not-allowed disabled:opacity-50",
          triggerClassName
        )}
        data-slot="select-trigger"
        onKeyDown={handleKeyDown}
        onClick={() => (expanded ? setOpen(false) : openList())}
      >
        <span className={cn("truncate", !selected && "text-[#8a8689]")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={16} aria-hidden="true" className="shrink-0" />
      </button>
      {expanded && (
        <ul
          ref={listboxRef}
          id={`${id}-listbox`}
          role="listbox"
          aria-label={label}
          className={cn(
            "absolute top-full right-0 left-0 z-20 mt-1 max-h-48 overflow-y-auto border border-[#231f20]/25 bg-white py-1 shadow-lg",
            listboxClassName
          )}
          data-slot="select-listbox"
          onPointerDown={(event) => event.preventDefault()}
        >
          {options.length === 0 && (
            <li
              role="presentation"
              className="px-3 py-2 text-sm text-[#8a8689]"
            >
              No options available
            </li>
          )}
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled || undefined}
              data-active={index === activeIndex}
              data-slot="select-option"
              className={cn(
                "flex items-center justify-between gap-3 px-3 py-2 text-sm font-normal",
                option.disabled
                  ? "cursor-not-allowed opacity-40"
                  : "cursor-pointer",
                index === activeIndex && "bg-[#231f20]/5"
              )}
              onPointerMove={() => {
                if (!option.disabled) setActiveIndex(index)
              }}
              onClick={() => choose(index)}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <Check size={14} aria-hidden="true" className="shrink-0" />
              )}
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-[#da291c]">
          {error}
        </p>
      )}
    </div>
  )
}
