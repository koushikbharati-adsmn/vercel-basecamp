import { getVisitorId } from '@/lib/fingerprint'
import { queryOptions } from '@tanstack/react-query'

export const visitorIdOptions = queryOptions({
  queryKey: ['PARTICIPANT_VISITOR_ID'],
  queryFn: getVisitorId,
  staleTime: Number.POSITIVE_INFINITY,
})
