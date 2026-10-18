// Shared dashboard queries and workshop activity contracts.
import apiClient from "@/lib/api-client"
import { queryOptions } from "@tanstack/react-query"

export interface DashboardOverall {
  Draft: number
  Shortlisted: number
  Sharpened: number
  TotalIdeas: number
}

export interface DashboardTeamStat {
  TeamID: number
  TeamName: string
  Drafts: number
  Shortlisted: number
  Sharpened: number
  TotalIdeas: number
}

export interface GetDashboardResponse {
  success: boolean
  data: {
    overall: DashboardOverall
    teams: DashboardTeamStat[]
  }
}

export const dashboardKeys = {
  all: ["BIG_SCREEN_DASHBOARD"] as const,

  detail: (code: string) => [...dashboardKeys.all, code] as const,
}

/** Fetches workshop-wide and per-team activity totals for both experiences. */
const getDashboard = async (code: string): Promise<GetDashboardResponse> => {
  const res = await apiClient.get<GetDashboardResponse>("/api/big/dashboard", {
    params: { code },
  })

  return res.data
}

/** Builds the shared workshop dashboard cache entry. */
export const getDashboardOptions = (code: string) =>
  queryOptions({
    queryKey: dashboardKeys.detail(code),
    queryFn: () => getDashboard(code),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

export type ActivityType = "added" | "shortlisted" | "sharpened"

export interface WorkshopActivity {
  ID: number
  TeamName: string
  TeamColorCode?: string | null
  Message: string
  CreatedDttm: string
  Type: ActivityType
}

/** Feed delta: incoming rows may replace existing IDs, while deleted IDs are removed. */
export interface ActivityCreatedSocketPayload {
  roomId: string
  activities: WorkshopActivity[] | null
  deletedActivityIds: number[] | null
}

export interface GetActivitiesParams {
  code: string
  type: ActivityType | null
}

interface GetActivitiesResponse {
  success: boolean
  data: WorkshopActivity[]
}

export const activityKeys = {
  all: ["ACTIVITIES"] as const,

  list: (params: GetActivitiesParams) => [...activityKeys.all, params] as const,
}

/** Fetches the activity feed, optionally restricted to one activity type. */
const getActivities = async (params: GetActivitiesParams) => {
  const res = await apiClient.get<GetActivitiesResponse>(
    "/api/workshop/activity",
    {
      params,
    }
  )

  return res.data
}

/** Builds feed options used by the socket-aware activities hook. */
export const getActivitiesOptions = (params: GetActivitiesParams) =>
  queryOptions({
    queryKey: activityKeys.list(params),
    queryFn: () => getActivities(params),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
