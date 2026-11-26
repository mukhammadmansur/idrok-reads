"""Accept video URLs only, never arbitrary iframe HTML or another hostname.

Port of server/youtube.mjs.
"""

import re
from urllib.parse import parse_qs, urlparse

from .helpers import YOUTUBE_ID_RE


def youtube_id(value):
    try:
        url = urlparse(value)
        if url.scheme != "https":
            return None
        if url.hostname == "youtu.be":
            candidate = url.path[1:]
        elif url.hostname in ("youtube.com", "www.youtube.com", "www.youtube-nocookie.com"):
            if url.path == "/watch":
                candidate = (parse_qs(url.query).get("v") or [None])[0]
            else:
                match = re.match(r"^/(?:embed|shorts)/([^/]+)", url.path)
                candidate = match.group(1) if match else None
        else:
            candidate = None
        return candidate if candidate and YOUTUBE_ID_RE.fullmatch(candidate) else None
    except ValueError:
        return None


def canonical_youtube_url(value):
    video_id = youtube_id(value)
    return f"https://www.youtube.com/watch?v={video_id}" if video_id else None
