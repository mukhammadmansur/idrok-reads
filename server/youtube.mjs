/** Accept video URLs only, never arbitrary iframe HTML or another hostname. */
export function youtubeId(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    let id = null;
    if (url.hostname === "youtu.be") id = url.pathname.slice(1);
    else if (
      ["youtube.com", "www.youtube.com", "www.youtube-nocookie.com"].includes(
        url.hostname,
      )
    )
      id =
        url.pathname === "/watch"
          ? url.searchParams.get("v")
          : /^\/(embed|shorts)\//.test(url.pathname)
            ? url.pathname.split("/")[2]
            : null;
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
export function canonicalYoutubeUrl(value) {
  const id = youtubeId(value);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}
