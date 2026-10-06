import FingerprintJS from "@fingerprintjs/fingerprintjs"

/** Computes the browser fingerprint used to identify a participant in API calls. */
export const getVisitorId = async () => {
  const fp = await FingerprintJS.load()
  const result = await fp.get()
  return result.visitorId
}
