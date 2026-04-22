// Backend sends ISO strings without timezone indicator (e.g. "2024-01-15T12:42:00").
// Without a 'Z', JS treats them as local time instead of UTC. We append 'Z' when
// no offset is present so the browser correctly converts UTC → user's local time.
function parseUTC(dateStr) {
  if (!dateStr) return new Date(NaN)
  if (!dateStr.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'Z')
  }
  return new Date(dateStr)
}

export function formatTime(dateStr) {
  return parseUTC(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(dateStr) {
  return parseUTC(dateStr).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })
}
