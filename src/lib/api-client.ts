import axios from "axios"

// Shared REST transport; workshop events and coach chat use separate sockets.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

apiClient.interceptors.request.use((config) => {
  config.headers["x-api-key"] = import.meta.env.VITE_API_KEY

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Preserve Axios status/payload while normalizing the message shown by callers.
    if (error.response) {
      error.message = error.response.data?.message ?? "Something went wrong"

      return Promise.reject(error)
    }

    if (error.request) {
      error.message = "Network error. Please try again."

      return Promise.reject(error)
    }

    error.message = error.message ?? "Unknown error"

    return Promise.reject(error)
  }
)

export default apiClient
