# First private GitHub push

Destination: `mukhammadmaqsud/wbooks`, private. The local directory is still `/workspace/iqro_kids_reads`; the current branch is `work`. Keep the original `origin` pointing to `mukhammadmaqsud/iqro_kids_reads`. The new remote will be named `wbooks`.

Before pushing, run typecheck, lint, unit tests, browser tests, and production build using the README instructions. Scan all reachable Git history and project files for secrets. If any real credential has been committed, stop before pushing and arrange rotation and history remediation; do not silently rewrite history.

Gitleaks 8.30.1 was used for the preparation audit. With Gitleaks installed, a repeat history audit is:

```sh
gitleaks git . --log-opts='--all' --redact
```

Ignoring a path does not remove already tracked files or secrets in history. Keep `.env.example` credential-free and never commit keys, local databases, generated output, or logs. The application's local browser data is not a project database file.

## Commands after the audit and preparation commit

Run these in Bash from the project checkout. In a different checkout, change only the first path. GitHub API access to `api.github.com` is required in addition to Git access to `github.com`. Use interactive GitHub CLI authentication; do not paste a token or password into these commands.

```bash
set -e
cd /workspace/iqro_kids_reads

gh auth login --hostname github.com --git-protocol https
test "$(gh api user --jq .login)" = "mukhammadmaqsud"
test -z "$(git status --porcelain)"
branch=$(git symbolic-ref --quiet --short HEAD)
test -n "$branch"

if git remote get-url wbooks >/dev/null 2>&1; then
  echo 'Stop: the wbooks remote already exists; inspect it before continuing.' >&2
  exit 1
fi

# Creation fails if the repository already exists; set -e prevents any push.
gh api --method POST /user/repos \
  -f name=wbooks -F private=true -F auto_init=false \
  --jq .html_url

test "$(gh api repos/mukhammadmaqsud/wbooks --jq .private)" = "true"
remote_refs=$(git ls-remote https://github.com/mukhammadmaqsud/wbooks.git)
if test -n "$remote_refs"; then
  echo 'Stop: the destination is not empty; no push was performed.' >&2
  exit 1
fi

git remote add wbooks https://github.com/mukhammadmaqsud/wbooks.git
git push --set-upstream wbooks "HEAD:refs/heads/$branch"

local_commit=$(git rev-parse HEAD)
remote_commit=$(git ls-remote --heads wbooks "refs/heads/$branch" | cut -f1)
test "$local_commit" = "$remote_commit"
test "$(gh api repos/mukhammadmaqsud/wbooks --jq .private)" = "true"
git remote get-url wbooks
gh repo view mukhammadmaqsud/wbooks --json url,visibility
printf 'Verified commit: %s\n' "$local_commit"
```

No force-push, history rewrite, branch rename, or production deployment is involved. If creation succeeds but a later step fails, stop and inspect that partially completed state; rerunning this first-push procedure will intentionally refuse the existing repository or remote.
