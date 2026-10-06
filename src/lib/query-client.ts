import { QueryClient } from "@tanstack/react-query"

// Shared by route loaders and hooks; services opt into focus refetching as needed.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})
