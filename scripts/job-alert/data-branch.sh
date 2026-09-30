#!/usr/bin/env bash
# Checks out and saves the job-alert-data branch in $JOB_ALERT_DATA_DIR.
#   data-branch.sh checkout
#   data-branch.sh save "<commit note>"
set -euo pipefail

BRANCH=job-alert-data
DIR="${JOB_ALERT_DATA_DIR:?JOB_ALERT_DATA_DIR is required}"
export GIT_AUTHOR_NAME='github-actions[bot]'
export GIT_AUTHOR_EMAIL='41898282+github-actions[bot]@users.noreply.github.com'
export GIT_COMMITTER_NAME="$GIT_AUTHOR_NAME"
export GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL"

checkout() {
  if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null; then
    git fetch --quiet --depth=1 origin "$BRANCH"
    git worktree add --detach "$DIR" FETCH_HEAD
  else
    git worktree add --detach "$DIR"
    git -C "$DIR" switch --orphan "$BRANCH"
  fi
}

save() {
  cd "$DIR"
  git add -A
  if git diff --cached --quiet; then exit 0; fi
  git commit --quiet -m "chore(job-alert): ${1:-update data}"
  # Receive runs are not serialized but each writes its own file, so replaying
  # this one commit on top of whatever landed in the meantime stays clean.
  local commit
  commit="$(git rev-parse HEAD)"
  for attempt in 1 2 3 4 5; do
    if git push --quiet origin "HEAD:refs/heads/$BRANCH"; then exit 0; fi
    sleep "$attempt"
    git fetch --quiet --depth=1 origin "$BRANCH"
    git reset --quiet --hard FETCH_HEAD
    git cherry-pick "$commit" >/dev/null
  done
  echo "Could not push $BRANCH after 5 attempts" >&2
  exit 1
}

"$@"
