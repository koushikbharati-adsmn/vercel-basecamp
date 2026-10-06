// Participant REST contracts, query factories, and mutation hooks. Query keys retain
// identity/filters; successful mutations may broadcast events for other room clients.
import apiClient from "@/lib/api-client"
import { socket } from "@/lib/socket"
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { toast } from "sonner"

/** Workshop phases used to gate participant actions and presenter views. */
export type WorkshopStatus = "Ideate" | "Vote" | "Reveal" | "Completed"
export type WorkshopLifecycleStatus = WorkshopStatus | null
export type VotingScope = "workshop" | "pillar"

export interface ParticipantWorkshopCoach {
  ID: number
  CoachName: string
  CoachKey: string
  AvatarFileName: string
  PromptFileName: string
  Title: string
  Description: string
  PrimaryTxtColor: string
  SecondaryTxtColor: string
  BGColor: string
}

export interface ParticipantWorkshopCategory {
  ID: number
  Name: string
  Context: string
}

export interface ParticipantWorkshopTeam {
  ID: number
  TeamName: string
  Description: string
  TeamColorCode: string
  TeamCode: null | string
  ThumbnailFileName: string
}

export interface ParticipantWorkshopWalkthrough {
  ID: string
  Title: string
  Description: string
  DisplayOrder: number
  tabName: string | null
  fileName: string | null
}

/** Workshop configuration plus visitor-specific userID/teamID membership. */
export interface ParticipantWorkshop {
  ID: string
  Name: string
  WorkshopContext: string
  Desc: string
  logoFileName: string
  page_bg_image: string | null
  GuidelineFileName: string
  videoFileName: string | null
  videoTitle: string | null
  videoSubTitle: string | null
  shortUrl: string | null
  votingLimit: number | null
  votingScope: VotingScope
  winningIdeaCount: number
  IsProtected: boolean
  font_primary_name: string | null // primary font url
  font_secondary_name: string | null // secondary font url
  header_bg_color: string
  header_txt_color: string
  page_bg_color: string
  txt_primary_color: string
  txt_secondary_color: string
  btn_primary_bg_color: string
  btn_primary_txt_color: string
  btn_secondary_bg_color: string
  btn_secondary_active_bg_color: string
  btn_secondary_txt_color: string
  btn_secondary_border_color: string
  card_primary_bg_color: string
  card_primary_border_color: string
  card_primary_border_radius: string
  card_primary_border_width: string
  card_secondary_bg_color: string
  card_secondary_border_radius: string
  card_secondary_txt_color: string
  ticker_live_bg_color: string
  ticker_live_txt_color: string
  ticker_bg_color: string
  ticker_txt_color: string
  TeamSelect: string
  IdeationPage: string
  ShortlistedIdeaPage: string
  StatsBoard: string
  VotingPage: string
  userID: string
  teamID: number | null
  status: WorkshopLifecycleStatus
  teams: ParticipantWorkshopTeam[]
  category: ParticipantWorkshopCategory[]
  coaches: ParticipantWorkshopCoach[]
  walkThrough: ParticipantWorkshopWalkthrough[]
  placeholderImages: {
    ID: number
    fileName: string // placeholder image url
  }[]
}

interface GetParticipantWorkshopResponse {
  success: boolean
  data: ParticipantWorkshop
}

export interface GetParticipantWorkshopParams {
  code: string
  visitor_id: string
}

// Membership differs by visitor, so workshop code alone is not a sufficient key.
export const participantWorkshopKeys = {
  all: ["PARTICIPANT_WORKSHOP"] as const,

  detail: (params: GetParticipantWorkshopParams) =>
    [...participantWorkshopKeys.all, params] as const,
}

/** Fetches workshop configuration and membership for this browser identity. */
const getParticipantWorkshop = async (params: GetParticipantWorkshopParams) => {
  const res = await apiClient.get<GetParticipantWorkshopResponse>(
    "/api/participant/workshop",
    {
      params,
    }
  )

  return res.data
}

/** Shares workshop fetch/cache policy between route loaders and consuming views. */
export function getParticipantWorkshopOptions(
  params: GetParticipantWorkshopParams
) {
  return queryOptions({
    queryKey: participantWorkshopKeys.detail(params),
    queryFn: () => getParticipantWorkshop(params),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
}

/** API idea row: flgTeam is shortlist, flgCoach is sharpened; flgSelf is view-dependent. */
export interface ParticipantIdea {
  ID: number
  TeamID: number
  TeamName: string
  CategoryID: number
  CategoryName: string
  Desc: string
  title: string | null
  Context: string | null
  imageFileName: string
  TotalVote: number
  flgSelf: boolean
  flgTeam: boolean
  flgCoach: boolean
  CreatedDttm: string
  imgCount: number
}

/** Lightweight upsert event row; it does not contain the full API idea metadata. */
export interface SocketIdea {
  roomId: string
  ideaId: number
  teamId: number
  teamName: string
  categoryId: number
  categoryName: string
  desc: string
  title: string | null
  context: string | null
}

export interface IdeaUpsertSocketPayload {
  roomId: string
  action: "add" | "update"
  idea: SocketIdea
}

export interface IdeaCoachSocketPayload {
  roomId: string
  flgCoach: boolean
  idea: ParticipantIdea
}

interface GetParticipantIdeasResponse {
  success: boolean
  data: ParticipantIdea[]
}

export interface GetParticipantIdeasParams {
  visitor_id: string
  workshop_code: string
  category_id: number | null
  team_id: number | null
  is_shortlisted: boolean | null
  is_coached: boolean | null
}

// Every filter/visitor combination gets its own list; all scopes cache operations.
export const participantIdeaKeys = {
  all: ["PARTICIPANT_IDEAS"] as const,

  list: (params: GetParticipantIdeasParams) =>
    [...participantIdeaKeys.all, params] as const,
}

// Screens inspect these keys to show per-idea pending work across hook instances.
export const participantIdeaMutationKeys = {
  shortlist: ["PARTICIPANT_IDEA_SHORTLIST"] as const,
  generateImage: ["PARTICIPANT_IDEA_GENERATE_IMAGE"] as const,
}

/** Fetches participant ideas; null filter fields mean no restriction. */
const getParticipantIdeas = async (params: GetParticipantIdeasParams) => {
  const res = await apiClient.get<GetParticipantIdeasResponse>(
    "/api/participant/idea",
    {
      params,
    }
  )

  return res.data
}

/** Builds identity/filter-scoped idea query options that refresh on mount/focus. */
export function getParticipantIdeasOptions(params: GetParticipantIdeasParams) {
  return queryOptions({
    queryKey: participantIdeaKeys.list(params),
    queryFn: () => getParticipantIdeas(params),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
}

export interface SaveIdeaPayload {
  idea_id?: number
  visitor_id: string
  workshop_code: string
  team_id: number
  category_id: number
  desc: string
  title: string | null
  context: string | null
  flg_coach?: boolean
}

interface SaveIdeaResponse {
  success: boolean
  message: string
  data: {
    idea_id: number
  }
}

/** Creates or edits an idea depending on whether idea_id is supplied. */
const saveIdea = async (payload: SaveIdeaPayload) => {
  const res = await apiClient.post<SaveIdeaResponse>(
    "/api/participant/idea",
    payload
  )

  return res.data
}

/** Saves with error toasts; the caller owns cache reconciliation and upsert events. */
export const useSaveIdea = () => {
  return useMutation({
    mutationFn: saveIdea,
    onError: (error) => {
      toast(error.message)
    },
  })
}

export interface ShortlistIdeaPayload {
  workshop_code: string
  idea_id: number
  flag: boolean
  idea: ParticipantIdea
}

export type IdeaShortlistSocketPayload = {
  roomId: string
  isShortlisted: boolean
  idea: ParticipantIdea
}

interface ShortlistIdeaResponse {
  success: boolean
  message: string
}

/** Persists the shortlist flag; the full idea is retained only for the later event. */
const shortlistIdea = async (payload: ShortlistIdeaPayload) => {
  const res = await apiClient.post<ShortlistIdeaResponse>(
    "/api/participant/idea/shortlist",
    {
      workshop_code: payload.workshop_code,
      idea_id: payload.idea_id,
      flag: payload.flag,
    }
  )

  return res.data
}

/** Persists shortlist state then broadcasts it; subscribed screens patch their caches. */
export const useShortlistIdea = () => {
  return useMutation({
    mutationKey: participantIdeaMutationKeys.shortlist,
    mutationFn: shortlistIdea,

    onSuccess: (response, { workshop_code, flag, idea }) => {
      if (!response.success) return
      const payload: IdeaShortlistSocketPayload = {
        roomId: workshop_code,
        isShortlisted: flag,
        idea: {
          ...idea,
          flgTeam: flag,
        },
      }
      socket.emit("update_idea_shortlist", payload)
    },

    onError: (error) => {
      toast(error.message)
    },
  })
}

export interface GenerateIdeaImagePayload {
  idea_id: number
  workshop_code: string
  pillar_context: string
  workshop_context: string
  user_idea: string
  brand_guidelines: string
}

export interface IdeaImageSocketPayload {
  roomId: string
  ideaId: number
  imageUrl: string
}

interface GenerateIdeaImageResponse {
  success: boolean
  data: {
    image: string
  }
}

/** Requests an image using the idea plus workshop, pillar, and brand context. */
const generateIdeaImage = async (payload: GenerateIdeaImagePayload) => {
  const res = await apiClient.post<GenerateIdeaImageResponse>(
    "/ai/generate",
    payload
  )

  return res.data
}

/** Generates an image and broadcasts its URL; consumers update image/count state. */
export const useGenerateIdeaImage = () => {
  return useMutation({
    mutationKey: participantIdeaMutationKeys.generateImage,
    mutationFn: generateIdeaImage,

    onSuccess: (response, { workshop_code, idea_id }) => {
      if (!response.success) return
      const payload: IdeaImageSocketPayload = {
        roomId: workshop_code,
        ideaId: idea_id,
        imageUrl: response.data.image,
      }
      socket.emit("idea_image_generated", payload)
    },

    onError: (error) => {
      toast(error.message)
    },
  })
}

export interface ScoutIdeaPayload {
  workshop_code: string
  pillar_title: string
  user_ideas: string[]
}

interface ScoutIdeaResponse {
  success: boolean
  data: {
    status: string
    text: string[]
  }
}

/** Requests fresh AI directions from the supplied pillar and current idea descriptions. */
const scoutIdea = async (payload: ScoutIdeaPayload) => {
  const res = await apiClient.post<ScoutIdeaResponse>("/ai/scout", payload)

  return res.data
}

/** Exposes Scout suggestions/loading state with shared API-error toasts. */
export const useScoutIdea = () => {
  return useMutation({
    mutationFn: scoutIdea,

    onError: (error) => {
      toast(error.message)
    },
  })
}

/** Voting rows plus usage counters; here idea.flgSelf records this visitor's vote. */
interface GetParticipantVoteIdeasResponse {
  success: boolean
  data: ParticipantIdea[]
  usage: {
    workshopWise: number
    pillarWise: {
      categoryId: number
      votes: number
    }[]
  }
}

export interface GetParticipantVoteIdeasParams {
  visitor_id: string
  workshop_code: string
  category_id: number | null
  team_id: number | null
}

export const participantVoteIdeaKeys = {
  all: ["PARTICIPANT_VOTE_IDEAS"] as const,

  list: (params: GetParticipantVoteIdeasParams) =>
    [...participantVoteIdeaKeys.all, params] as const,
}

/** Fetches eligible ideas and the visitor's workshop/pillar vote usage. */
const getParticipantVoteIdeas = async (
  params: GetParticipantVoteIdeasParams
) => {
  const res = await apiClient.get<GetParticipantVoteIdeasResponse>(
    "/api/participant/idea/vote",
    {
      params,
    }
  )

  return res.data
}

/** Keeps voting usage/results separate from ordinary participant idea caches. */
export function getParticipantVoteIdeasOptions(
  params: GetParticipantVoteIdeasParams
) {
  return queryOptions({
    queryKey: participantVoteIdeaKeys.list(params),
    queryFn: () => getParticipantVoteIdeas(params),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
}

export interface VoteIdeaPayload {
  workshop_code: string
  visitor_id: string
  idea_id: number
  action: "add" | "remove"
}

export interface IdeaVoteSocketPayload {
  roomId: string
  visitorId: string
  ideaId: number
  isVoted: boolean
}

interface VoteIdeaResponse {
  success: boolean
  message: string
}

/** Adds/removes one visitor vote; limits/conflicts remain server decisions. */
const voteIdea = async (payload: VoteIdeaPayload) => {
  const res = await apiClient.post<VoteIdeaResponse>(
    "/api/participant/idea/vote",
    payload
  )
  return res.data
}

/** Persists a vote then broadcasts identity/state; the caller updates its usage cache. */
export const useVoteIdea = () => {
  return useMutation({
    mutationFn: (payload: VoteIdeaPayload) => voteIdea(payload),

    onSuccess: (_response, payload) => {
      socket.emit("update_idea_vote", {
        roomId: payload.workshop_code,
        visitorId: payload.visitor_id,
        ideaId: payload.idea_id,
        isVoted: payload.action === "add",
      } satisfies IdeaVoteSocketPayload)
    },

    onError: (error) => {
      if (
        isAxiosError<VoteIdeaResponse>(error) &&
        error.response?.status === 409
      ) {
        toast(error.message)
        return
      }

      toast(error.message)
    },
  })
}

interface SelectTeamPayload {
  visitor_id: string
  workshop_code: string
  team_id: number
  team_code?: string
}

interface SelectTeamResponse {
  success: boolean
  message: string
}

/** Persists membership, including a team PIN when the workshop is protected. */
const selectTeam = async (payload: SelectTeamPayload) => {
  const res = await apiClient.post<SelectTeamResponse>(
    "/api/participant/team/select",
    payload
  )

  return res.data
}

/** Updates this visitor's cached team after success; the parent owns PIN/error UI. */
export const useSelectTeam = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SelectTeamPayload) => selectTeam(payload),
    onSuccess: (_response, payload) => {
      queryClient.setQueryData<GetParticipantWorkshopResponse>(
        participantWorkshopKeys.detail({
          code: payload.workshop_code,
          visitor_id: payload.visitor_id,
        }),
        (current) =>
          current
            ? {
                ...current,
                data: {
                  ...current.data,
                  teamID: payload.team_id,
                },
              }
            : current
      )
    },
  })
}
