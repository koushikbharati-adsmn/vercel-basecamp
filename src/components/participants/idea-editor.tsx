import { AnimatedDialog } from "@/components/experience/animated-dialog"
import { ExperienceSelect } from "@/components/experience/experience-select"
import { socket } from "@/lib/socket"
import {
  hasParticipantChatSession,
  invalidateParticipantChatSessions,
} from "@/services/participant-chat"
import {
  useSaveIdea,
  type IdeaCoachSocketPayload,
  type IdeaUpsertSocketPayload,
  type ParticipantIdea,
  type ParticipantWorkshop,
} from "@/services/participants"
import { X } from "lucide-react"
import { useRef, useState, type FormEvent } from "react"

export function IdeaEditor({
  workshop,
  workshopCode,
  visitorId,
  teamId,
  idea,
  description,
  canEdit,
  onClose,
  onSaved,
}: {
  workshop: ParticipantWorkshop
  workshopCode: string
  visitorId: string
  teamId: number
  idea?: ParticipantIdea
  description?: string
  canEdit: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const save = useSaveIdea()
  const [title, setTitle] = useState(idea?.title ?? "")
  const [desc, setDesc] = useState(idea?.Desc ?? description ?? "")
  const [context, setContext] = useState(idea?.Context ?? "")
  const [category, setCategory] = useState<number | null>(
    idea?.CategoryID ?? null
  )
  const [error, setError] = useState("")
  const [pillarError, setPillarError] = useState("")
  const pillarRef = useRef<HTMLButtonElement>(null)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!canEdit || save.isPending) return
    if (
      category === null ||
      !workshop.category.some((pillar) => pillar.ID === category)
    ) {
      setPillarError("Choose a pillar before submitting your idea.")
      pillarRef.current?.focus()
      return
    }
    if (!desc.trim()) {
      setError("Describe your idea before submitting.")
      return
    }
    setPillarError("")
    setError("")
    const chatIdentity = idea
      ? { visitorId, workshopCode, ideaId: idea.ID }
      : null
    const hasCoachSession =
      chatIdentity !== null && hasParticipantChatSession(chatIdentity)
    save.mutate(
      {
        ...(idea ? { idea_id: idea.ID } : {}),
        visitor_id: visitorId,
        workshop_code: workshopCode,
        team_id: teamId,
        category_id: category,
        desc: desc.trim(),
        title: title.trim() || null,
        context: context.trim() || null,
        ...(hasCoachSession ? { flg_coach: true } : {}),
      },
      {
        onSuccess: (response) => {
          if (!response.success) {
            setError(response.message || "Your idea could not be saved.")
            return
          }
          socket.emit("upsert_idea", {
            roomId: workshopCode,
            action: idea ? "update" : "add",
            idea: {
              roomId: workshopCode,
              ideaId: response.data.idea_id,
              teamId,
              teamName:
                workshop.teams.find((team) => team.ID === teamId)?.TeamName ??
                "",
              categoryId: category,
              categoryName:
                workshop.category.find((item) => item.ID === category)?.Name ??
                "",
              desc: desc.trim(),
              title: title.trim() || null,
              context: context.trim() || null,
            },
          } satisfies IdeaUpsertSocketPayload)
          if (hasCoachSession && chatIdentity && idea) {
            void invalidateParticipantChatSessions(chatIdentity)
            socket.emit("update_idea_coach", {
              roomId: workshopCode,
              flgCoach: true,
              idea: {
                ...idea,
                flgCoach: true,
                title: title.trim() || null,
                Desc: desc.trim(),
                Context: context.trim() || null,
                CategoryID: category,
                CategoryName:
                  workshop.category.find((item) => item.ID === category)
                    ?.Name ?? "",
              },
            } satisfies IdeaCoachSocketPayload)
          }
          onSaved()
        },
      }
    )
  }

  return (
    <AnimatedDialog
      className="ideate-dialog idea-editor-dialog"
      aria-labelledby="idea-editor-title"
      dismissDisabled={save.isPending}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="flex items-center justify-between gap-4">
          <h2 id="idea-editor-title" className="font-display text-2xl">
            {idea ? "Edit idea" : "Add an idea"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={save.isPending}
            aria-label="Close idea"
          >
            <X size={22} />
          </button>
        </div>
        <fieldset
          disabled={!canEdit || save.isPending}
          className="mt-4 space-y-3"
        >
          <ExperienceSelect
            ref={pillarRef}
            label="Pillar"
            placeholder="Choose a pillar"
            autoFocus={!idea}
            options={workshop.category.map((item) => ({
              value: item.ID,
              label: item.Name,
            }))}
            value={category}
            onValueChange={(value) => {
              setCategory(value)
              setPillarError("")
            }}
            required
            disabled={!canEdit || save.isPending}
            error={pillarError}
          />
          <label className="block text-sm font-bold">
            Idea
            <textarea
              autoFocus={Boolean(idea)}
              value={desc}
              onChange={(event) => setDesc(event.target.value)}
              required
              rows={3}
              className="ideate-input"
              placeholder="What’s the big idea?"
            />
          </label>
          <label className="block text-sm font-bold">
            Title <span className="font-normal text-[#8a8689]">(optional)</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="ideate-input"
              placeholder="Give it a name"
            />
          </label>
          <label className="block text-sm font-bold">
            Context{" "}
            <span className="font-normal text-[#8a8689]">(optional)</span>
            <textarea
              value={context}
              onChange={(event) => setContext(event.target.value)}
              rows={2}
              className="ideate-input"
              placeholder="The insight or thinking behind it"
            />
          </label>
        </fieldset>
        {(error || save.error) && (
          <p role="alert" className="mt-4 text-sm text-[#da291c]">
            {error || save.error?.message}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={save.isPending}
            className="border border-[#231f20]/20 px-4 py-2.5 text-xs font-bold tracking-widest uppercase"
          >
            {canEdit ? "Cancel" : "Close"}
          </button>
          {canEdit && (
            <button
              type="submit"
              disabled={save.isPending}
              className="bg-[#da291c] px-4 py-2.5 text-xs font-bold tracking-widest text-white uppercase disabled:opacity-50"
            >
              {save.isPending
                ? "Saving…"
                : idea
                  ? "Save changes"
                  : "Add to the board"}
            </button>
          )}
        </div>
      </form>
    </AnimatedDialog>
  )
}
