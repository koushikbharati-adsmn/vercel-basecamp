import { AnimatedDialog } from "@/components/experience/animated-dialog"
import { DUR, EASE, STAGGER } from "@/lib/motion"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  PARTICIPANT_CHAT_MESSAGE_MAX_LENGTH,
  useParticipantChat,
} from "@/hooks/use-participant-chat"
import { cn, getInitials } from "@/lib/utils"
import {
  retryPendingParticipantChatDeletions,
  type ParticipantChatMessage,
} from "@/services/participant-chat"
import type {
  ParticipantIdea,
  ParticipantWorkshop,
  ParticipantWorkshopCoach,
} from "@/services/participants"
import {
  ArrowDown,
  ChevronRight,
  CircleAlert,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Send,
  Users,
  X,
} from "lucide-react"
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const ACTION =
  "inline-flex min-h-10 items-center justify-center gap-2 border border-[#231f20]/20 px-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"

export function SharpenDialog({
  idea,
  workshop,
  workshopCode,
  visitorId,
  canEdit,
  onClose,
  onEdit,
  children,
}: {
  idea: ParticipantIdea
  workshop: ParticipantWorkshop
  workshopCode: string
  visitorId: string
  canEdit: boolean
  onClose: () => void
  onEdit: () => void
  children?: ReactNode
}) {
  const reducedMotion = useReducedMotion()
  const [coachId, setCoachId] = useState<number | null>(null)
  const [draft, setDraft] = useState("")
  const [cleanupError, setCleanupError] = useState<string | null>(null)
  const coach = workshop.coaches.find((item) => item.ID === coachId) ?? null
  const chat = useParticipantChat({
    open: canEdit,
    idea,
    visitorId,
    workshopCode,
    coach,
    initialMessage:
      "How can I make this idea stronger while keeping it true to the brand?",
  })

  useEffect(() => {
    let active = true
    void retryPendingParticipantChatDeletions({
      visitorId,
      workshopCode,
      ideaId: idea.ID,
    }).then(({ storageFailed }) => {
      if (active && storageFailed)
        setCleanupError("Chat cleanup could not be saved in this browser.")
    })
    return () => {
      active = false
    }
  }, [idea.ID, visitorId, workshopCode])

  const selectCoach = (id: number | null) => {
    if (chat.isBusy || !canEdit) return
    setCoachId(id)
    setDraft("")
  }

  return (
    <AnimatedDialog
      variant="fullscreen"
      onClose={onClose}
      className="sharpen-workspace fixed inset-0 m-0 h-dvh max-h-dvh w-full max-w-none overflow-hidden border-0 bg-white p-0 text-[#231f20] backdrop:bg-black/70"
      aria-labelledby="sharpen-dialog-title"
    >
      <AnimatePresence propagate>{children}</AnimatePresence>
      <div className="flex size-full min-h-0 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#231f20]/15 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
          {coach ? (
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <CoachAvatar
                  key={coach.ID}
                  coach={coach}
                  className="size-10 sm:size-11"
                />
                <div className="min-w-0">
                  <h2
                    id="sharpen-dialog-title"
                    className="truncate text-base font-bold sm:text-lg"
                  >
                    {coach.CoachName}
                  </h2>
                  <p className="truncate text-xs text-[#6e6a6c] sm:text-sm">
                    {coach.Title}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  disabled={!canEdit || chat.isBusy}
                  onClick={onEdit}
                  aria-label="Edit idea"
                  className={cn(ACTION, "px-2 sm:px-3")}
                >
                  <Pencil size={16} />
                  <span className="hidden sm:inline">Edit idea</span>
                </button>
                <button
                  type="button"
                  disabled={!canEdit || chat.isBusy}
                  onClick={() => selectCoach(null)}
                  aria-label="Change coach"
                  className={cn(ACTION, "px-2 sm:px-3 lg:hidden")}
                >
                  <Users size={16} />
                  <span className="hidden sm:inline">Change coach</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="min-w-0">
              <h2
                id="sharpen-dialog-title"
                className="font-display text-2xl font-bold"
              >
                Choose a coach
              </h2>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close coaching"
            className="grid size-10 shrink-0 place-items-center border border-[#231f20]/15 hover:bg-[#231f20]/5"
          >
            <X size={20} />
          </button>
        </header>

        {!coach ? (
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reducedMotion ? 0 : DUR.beat, ease: EASE }}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
              {!canEdit && (
                <p role="status" className="mb-5 text-sm text-[#8a8689]">
                  Ideation has closed. Coaching is currently unavailable.
                </p>
              )}
              {workshop.coaches.length > 0 ? (
                <ul className="grid gap-3 md:grid-cols-2">
                  {workshop.coaches.map((item, index) => (
                    <motion.li
                      key={item.ID}
                      initial={{ opacity: 0, y: reducedMotion ? 0 : 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: reducedMotion ? 0 : DUR.beat,
                        delay: reducedMotion ? 0 : Math.min(index, 5) * STAGGER,
                        ease: EASE,
                      }}
                      className="min-w-0"
                    >
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => selectCoach(item.ID)}
                        aria-label={`Select ${item.CoachName} as your coach`}
                        className="flex h-full w-full items-center gap-4 border border-[#231f20]/20 p-4 text-left transition-colors hover:border-[#231f20]/50 disabled:opacity-40 sm:p-5"
                        style={{ backgroundColor: item.BGColor || "#f6f5f3" }}
                      >
                        <CoachAvatar
                          coach={item}
                          className="size-14 sm:size-16"
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className="block text-base font-bold sm:text-lg"
                            style={{ color: item.PrimaryTxtColor || "#231f20" }}
                          >
                            {item.CoachName}
                          </span>
                          <span
                            className="mt-0.5 block text-sm"
                            style={{
                              color: item.SecondaryTxtColor || "#6e6a6c",
                            }}
                          >
                            {item.Title}
                          </span>
                          <span
                            className="mt-2 line-clamp-2 block text-sm leading-5"
                            style={{
                              color: item.SecondaryTxtColor || "#6e6a6c",
                            }}
                          >
                            {item.Description}
                          </span>
                        </span>
                        <ChevronRight
                          size={20}
                          className="shrink-0"
                          style={{ color: item.PrimaryTxtColor || "#231f20" }}
                        />
                      </button>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <div className="grid min-h-64 place-content-center border border-[#231f20]/20 p-6 text-center">
                  <Users size={36} className="mx-auto" />
                  <h3 className="mt-4 text-lg font-bold">
                    No coaches available
                  </h3>
                  <p className="mt-1 text-sm text-[#6e6a6c]">
                    This workshop does not have any coaches assigned yet.
                  </p>
                </div>
              )}
            </div>
          </motion.main>
        ) : (
          <motion.div
            key={coach.ID}
            initial={{ opacity: 0, x: reducedMotion ? 0 : 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reducedMotion ? 0 : DUR.beat, ease: EASE }}
            className="grid min-h-0 flex-1 lg:grid-cols-[16rem_minmax(0,1fr)]"
          >
            <aside
              className="hidden min-h-0 flex-col overflow-y-auto border-r border-[#231f20]/15 p-3 lg:flex"
              aria-label="Coaches"
            >
              <p className="px-2 py-3 text-xs font-bold tracking-wider text-[#8a8689] uppercase">
                Coaches
              </p>
              <ul className="grid gap-1.5">
                {workshop.coaches.map((item) => (
                  <li key={item.ID}>
                    <button
                      type="button"
                      disabled={item.ID === coach.ID || chat.isBusy || !canEdit}
                      aria-current={item.ID === coach.ID ? "true" : undefined}
                      onClick={() => selectCoach(item.ID)}
                      className={cn(
                        "flex w-full items-center gap-3 border px-3 py-2.5 text-left transition-colors",
                        item.ID === coach.ID
                          ? "border-[#231f20]/20 bg-[#f6f5f3]"
                          : "border-transparent hover:bg-[#231f20]/3",
                        chat.isBusy && "opacity-50"
                      )}
                    >
                      <CoachAvatar coach={item} className="size-9" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">
                          {item.CoachName}
                        </span>
                        <span className="block truncate text-xs text-[#8a8689]">
                          {item.Title}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
            <ChatWorkspace
              key={coach.ID}
              coach={coach}
              chat={chat}
              draft={draft}
              setDraft={setDraft}
              canEdit={canEdit}
              cleanupError={cleanupError}
            />
          </motion.div>
        )}
      </div>
    </AnimatedDialog>
  )
}

function ChatWorkspace({
  coach,
  chat,
  draft,
  setDraft,
  canEdit,
  cleanupError,
}: {
  coach: ParticipantWorkshopCoach
  chat: ReturnType<typeof useParticipantChat>
  draft: string
  setDraft: (value: string) => void
  canEdit: boolean
  cleanupError: string | null
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const composerRef = useRef<HTMLFormElement>(null)
  const historyRef = useRef<HTMLDivElement>(null)
  const nearBottomRef = useRef(true)
  const previousCountRef = useRef(chat.session.messages.length)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const canSend =
    canEdit &&
    chat.connectionStatus === "connected" &&
    !chat.isBusy &&
    chat.session.status === "active"

  useLayoutEffect(() => {
    const composer = composerRef.current
    const history = historyRef.current
    if (!composer || !history) return
    const reserveSpace = () => {
      history.style.paddingBottom = `${Math.ceil(composer.getBoundingClientRect().height) + 24}px`
      const viewport = viewportRef.current
      if (nearBottomRef.current && viewport)
        viewport.scrollTop = viewport.scrollHeight
    }
    reserveSpace()
    const observer = new ResizeObserver(reserveSpace)
    observer.observe(composer)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const added = chat.session.messages.length > previousCountRef.current
    previousCountRef.current = chat.session.messages.length
    const viewport = viewportRef.current
    if (nearBottomRef.current && viewport) {
      viewport.scrollTop = viewport.scrollHeight
      setHasNewMessages(false)
    } else if (added) setHasNewMessages(true)
  }, [
    chat.session.messages,
    chat.isWaiting,
    chat.connectionStatus,
    chat.requestError,
  ])

  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(160, Math.max(40, textarea.scrollHeight))}px`
  }, [draft])

  const jumpToBottom = () => {
    nearBottomRef.current = true
    setHasNewMessages(false)
    const viewport = viewportRef.current
    if (viewport) viewport.scrollTop = viewport.scrollHeight
  }
  const placeholder = !canEdit
    ? "Ideation has closed."
    : chat.session.status !== "active"
      ? chat.session.status === "ended"
        ? "Session has ended."
        : "This session cannot continue."
      : chat.connectionStatus === "connected"
        ? `Message ${coach.CoachName}`
        : "Connecting to your coach…"

  return (
    <section className="relative flex min-h-0 min-w-0 flex-col">
      <div
        ref={viewportRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        onScroll={(event) => {
          const viewport = event.currentTarget
          nearBottomRef.current =
            viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <
            96
          if (nearBottomRef.current) setHasNewMessages(false)
        }}
      >
        <div
          ref={historyRef}
          className="mx-auto grid w-full max-w-3xl gap-4 px-4 pt-5 pb-64 sm:px-6 sm:pt-6"
        >
          {chat.connectionStatus !== "connected" && (
            <StatusNotice
              loading={chat.connectionStatus !== "error"}
              message={
                chat.connectionError ||
                (chat.connectionStatus === "reconnecting"
                  ? "Reconnecting to your coach…"
                  : "Connecting to your coach…")
              }
              onRetry={
                chat.connectionStatus === "error" ? chat.reconnect : undefined
              }
            />
          )}
          {chat.requestError && <StatusNotice message={chat.requestError} />}
          {(chat.persistenceError || cleanupError) && (
            <StatusNotice message={chat.persistenceError || cleanupError!} />
          )}
          {chat.session.statusMessage && (
            <StatusNotice message={chat.session.statusMessage} />
          )}
          {!canEdit && (
            <StatusNotice message="Ideation has closed. This conversation is now read-only." />
          )}
          <div
            role="log"
            aria-label={`Conversation with ${coach.CoachName}`}
            aria-live="polite"
            aria-relevant="additions"
            className="grid gap-4"
          >
            {chat.session.messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                coach={coach}
                canRetry={canSend}
                onRetry={() => chat.retryMessage(message.id)}
              />
            ))}
            {chat.isWaiting && (
              <div className="flex items-end gap-2 justify-self-start">
                <CoachAvatar coach={coach} className="size-8" />
                <p
                  role="status"
                  className="flex items-center gap-2 border border-[#231f20]/15 bg-[#f6f5f3] px-4 py-3 text-sm text-[#6e6a6c]"
                >
                  <LoaderCircle size={15} className="animate-spin" />
                  Coach is thinking…
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <form
        ref={composerRef}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pt-10 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5"
        style={{
          background: "linear-gradient(to top, #ffffff 55%, transparent)",
        }}
        onSubmit={(event) => {
          event.preventDefault()
          if (canSend && chat.sendMessage(draft)) {
            nearBottomRef.current = true
            setDraft("")
          }
        }}
      >
        <div className="pointer-events-auto mx-auto w-full max-w-3xl">
          {hasNewMessages && (
            <button
              type="button"
              onClick={jumpToBottom}
              className="mx-auto mb-3 flex items-center gap-2 border border-[#231f20]/20 bg-[#f6f5f3] px-3 py-2 text-xs font-bold"
            >
              <ArrowDown size={14} />
              New message
            </button>
          )}
          <label htmlFor="participant-chat-message" className="sr-only">
            Message {coach.CoachName}
          </label>
          <div className="flex items-end gap-2 border border-[#231f20]/20 bg-[#f6f5f3] p-2 focus-within:border-[#231f20]/60">
            <textarea
              ref={textareaRef}
              id="participant-chat-message"
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={PARTICIPANT_CHAT_MESSAGE_MAX_LENGTH}
              disabled={!canSend}
              placeholder={placeholder}
              className="max-h-40 min-h-10 min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-2 py-2 text-base leading-6 outline-none disabled:opacity-60 md:text-sm"
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault()
                  event.currentTarget.form?.requestSubmit()
                }
              }}
            />
            <button
              type="submit"
              disabled={!canSend || !draft.trim()}
              aria-busy={chat.isBusy}
              aria-label={
                chat.isSending
                  ? "Sending message"
                  : chat.isWaiting
                    ? "Waiting for coach"
                    : "Send message"
              }
              className="grid size-10 shrink-0 place-items-center bg-[#231f20] text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="mt-1.5 flex justify-between gap-3 text-[11px] text-[#8a8689]">
            <p className="w-full text-center">
              Enter to send, Shift + Enter for a new line
            </p>
            {draft.length > PARTICIPANT_CHAT_MESSAGE_MAX_LENGTH * 0.8 && (
              <span className="shrink-0 tabular-nums">
                {draft.length}/{PARTICIPANT_CHAT_MESSAGE_MAX_LENGTH}
              </span>
            )}
          </div>
        </div>
      </form>
    </section>
  )
}

function ChatMessage({
  message,
  coach,
  canRetry,
  onRetry,
}: {
  message: ParticipantChatMessage
  coach: ParticipantWorkshopCoach
  canRetry: boolean
  onRetry: () => void
}) {
  if (message.author === "system")
    return (
      <p className="max-w-xl justify-self-center border border-[#231f20]/15 px-3 py-2 text-center text-xs wrap-break-word text-[#8a8689]">
        {message.text}
      </p>
    )
  const isCoach = message.author === "coach"
  return (
    <div
      className={cn(
        "flex max-w-[90%] items-end gap-2 sm:max-w-[80%]",
        isCoach ? "justify-self-start" : "justify-self-end"
      )}
    >
      {isCoach && <CoachAvatar coach={coach} className="size-8" />}
      <div className="min-w-0">
        <span className="sr-only">
          {isCoach ? coach.CoachName : "You"} said:
        </span>
        <div
          className={cn(
            "px-4 py-2.5 text-sm leading-6 wrap-break-word",
            isCoach
              ? "border border-[#231f20]/15 bg-[#f6f5f3]"
              : "bg-[#231f20] whitespace-pre-wrap text-white"
          )}
        >
          {isCoach ? (
            <CoachMarkdown>{message.text}</CoachMarkdown>
          ) : (
            message.text
          )}
        </div>
        <div
          className={cn(
            "mt-1 flex items-center gap-2 text-[11px] text-[#8a8689]",
            !isCoach && "justify-end"
          )}
        >
          {message.createdAt && (
            <time dateTime={new Date(message.createdAt).toISOString()}>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          )}
          {message.status === "pending" && <span>Sending</span>}
          {message.status === "failed" && (
            <>
              <span>Not sent</span>
              <button
                type="button"
                disabled={!canRetry}
                onClick={onRetry}
                className="font-bold underline disabled:opacity-40"
              >
                Retry
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function CoachMarkdown({ children }: { children: string }) {
  return (
    <div className="coach-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, href }) => (
            <a
              href={href}
              target={
                /^(https?:)?\/\//i.test(href ?? "") ? "_blank" : undefined
              }
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}

function StatusNotice({
  message,
  loading = false,
  onRetry,
}: {
  message: string
  loading?: boolean
  onRetry?: () => void
}) {
  return (
    <div
      className="flex items-center gap-3 border border-[#231f20]/20 px-4 py-3 text-sm"
      role={loading ? "status" : "alert"}
    >
      {loading ? (
        <LoaderCircle size={18} className="shrink-0 animate-spin" />
      ) : (
        <CircleAlert size={18} className="shrink-0" />
      )}
      <p className="min-w-0 flex-1">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={ACTION}>
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  )
}

function CoachAvatar({
  coach,
  className,
}: {
  coach: ParticipantWorkshopCoach
  className: string
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden bg-[#eeedeb] text-xs font-bold text-[#4a4749]",
        className
      )}
    >
      {coach.AvatarFileName?.trim() && failedSrc !== coach.AvatarFileName ? (
        <img
          src={coach.AvatarFileName}
          alt=""
          className="size-full object-cover"
          onError={() => setFailedSrc(coach.AvatarFileName)}
        />
      ) : (
        getInitials(coach.CoachName, "C")
      )}
    </span>
  )
}
