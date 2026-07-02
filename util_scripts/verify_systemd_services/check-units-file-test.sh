#!/usr/bin/bash
# Robust checker that continues checking all files even if some fail/miss directives.
# - No `set -e` to avoid early exits on non-zero statuses.
# - Accumulates results and exits once at the end with a global status code.

set -u  # keep -u for unset variables if you like; avoid -e here
# set -o pipefail  # optional; if you enable this, ensure all pipelines are guarded with `|| true`

usage() {
  cat <<'EOF'
Usage:
  check-unit-files.sh FILE1.service [FILE2.service ...]
  check-unit-files.sh -f filelist.txt

Options:
  -f FILE   Read unit file paths from FILE (one per line, # comments allowed)
  -q        Quiet summary (only per-file missing lines + final summary)
  -h        Help

Validates that the provided unit files contain (in correct sections):
  [Install] WantedBy=multi-user.target
  [Unit]    Wants=network-online.target
  [Unit]    After=network-online.target
  [Unit]    After=NetworkManager-wait-online.service
  [Unit] StartLimitIntervalSec=0
  [Service] Restart=always
  [Service] RestartSec=5
  [Service] User=root
EOF
}

quiet=0
files=()

while (( $# )); do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    -q) quiet=1; shift ;;
    -f)
      [[ $# -ge 2 ]] || { echo "Error: -f requires a file" >&2; exit 2; }
      filelist="$2"; shift 2
      if [[ ! -r "$filelist" ]]; then
        echo "Error: cannot read $filelist" >&2
        exit 2
      fi
      # Read list; ignore comments/blanks
      while IFS= read -r line; do
        line="${line%%#*}"
        # trim whitespace (POSIX-safe)
        line="$(printf '%s' "$line" | awk '{$1=$1;print}')"
        [[ -n "$line" ]] && files+=("$line")
      done < "$filelist"
      ;;
    *)
      files+=("$1"); shift ;;
  esac
done

[[ ${#files[@]} -gt 0 ]] || { usage; exit 2; }

# Requirements to check (section|key=value)
declare -a REQUIRED=(
  "[Install]|WantedBy=multi-user.target"
  "[Unit]|Wants=network-online.target"
  "[Unit]|After=network-online.target"
  "[Unit]|After=NetworkManager-wait-online.service"
  "[Service]|StartLimitIntervalSec=0"
  "[Service]|Restart=always"
  "[Service]|RestartSec=5"
  "[Service]|User=root"
)

total=${#files[@]}
fail_count=0

for path in "${files[@]}"; do
  unitname="$(basename "$path")"

  if [[ ! -r "$path" ]]; then
    echo "[$unitname] ERROR: Cannot read file: $path"
    fail_count=$((fail_count+1))
    # continue to the next file (do NOT exit)
    continue
  fi

  # Read file content (won't exit on failure because we avoid `set -e`)
  CONTENT="$(cat "$path" 2>/dev/null || true)"

  # If empty content, mark as failure but continue
  if [[ -z "$CONTENT" ]]; then
    echo "[$unitname] ERROR: Empty or unreadable content."
    fail_count=$((fail_count+1))
    continue
  fi

  # Make a working copy of the requirements per file
  mapfile -t reqs < <(printf '%s\n' "${REQUIRED[@]}")

  current_section=""
  # Read file line-by-line, track section, and mark found directives
  # Note: do NOT rely on pipeline exit status; no `set -e` anyway.
  while IFS= read -r line; do
    # Normalize CRLF
    line="${line%$'\r'}"
    # Track current section headers like [Unit], [Service], [Install]
    if [[ $line =~ ^\[[[:alnum:]-]+\]$ ]]; then
      current_section="$line"
    fi
    # Check each requirement in the current section for exact match (allow whitespace around)
    for i in "${!reqs[@]}"; do
      [[ -z "${reqs[$i]}" ]] && continue
      section="${reqs[$i]%%|*}"
      kv="${reqs[$i]#*|}"
      if [[ "$current_section" == "$section" ]] && [[ "$line" =~ ^[[:space:]]*$kv[[:space:]]*$ ]]; then
        reqs[$i]=""  # mark as found
      fi
    done
  done <<< "$CONTENT"

  # Collect missing directives
  missing_list=()
  for r in "${reqs[@]}"; do
    [[ -z "$r" ]] && continue
    missing_list+=("$r")
  done

  if (( ${#missing_list[@]} == 0 )); then
    ((quiet==0)) && echo "[$unitname] OK: All required directives present."
  else
    echo "[$unitname] MISSING (${#missing_list[@]}):"
    for m in "${missing_list[@]}"; do
      echo "  - $m"
    done
    fail_count=$((fail_count+1))
  fi

  ((quiet==0)) && echo
done

echo "Summary: ${total} files checked, ${fail_count} with issues."
# Exit 1 if any file had issues; otherwise 0
exit $(( fail_count > 0 ? 1 : 0 ))