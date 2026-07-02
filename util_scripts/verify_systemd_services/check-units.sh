#!/usr/bin/env bash
# Robust checker that continues checking all units even if some fail/miss directives.
# - No `set -e` to avoid early exits on non-zero statuses.
# - Accumulates results and exits once at the end with a global status code.
# - Reads effective (merged) configuration via `systemctl cat`.

set -u  # keep -u; avoid -e to prevent early exit
# set -o pipefail  # optional; if you enable this, guard pipelines with `|| true`

usage() {
  cat <<'EOF'
Usage:
  check-units-systemctl.sh UNIT1.service [UNIT2.service ...]
  check-units-systemctl.sh -f unitlist.txt

Options:
  -f FILE   Read unit names from FILE (one per line, # comments allowed)
  -q        Quiet summary (only per-unit missing lines + final summary)
  -h        Help

Validates that the effective unit configuration (systemctl cat) contains:
  [Install] WantedBy=multi-user.target
  [Unit]    Wants=network-online.target
  [Unit]    After=network-online.target
  [Unit]    After=NetworkManager-wait-online.service
  [Unit]    StartLimitIntervalSec=0
  [Service] Restart=always
  [Service] RestartSec=5
  [Service] User=root

Notes:
- This inspects the "effective" unit (base file + drop-ins).
- 'WantedBy=' takes effect when the unit is enabled:
    sudo systemctl enable UNIT
EOF
}

quiet=0
units=()

while (( $# )); do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    -q) quiet=1; shift ;;
    -f)
      [[ $# -ge 2 ]] || { echo "Error: -f requires a file" >&2; exit 2; }
      list="$2"; shift 2
      if [[ ! -r "$list" ]]; then
        echo "Error: cannot read $list" >&2
        exit 2
      fi
      while IFS= read -r line; do
        line="${line%%#*}"
        line="$(printf '%s' "$line" | awk '{$1=$1;print}')" # trim
        [[ -n "$line" ]] && units+=("$line")
      done < "$list"
      ;;
    *)
      units+=("$1"); shift ;;
  esac
done

[[ ${#units[@]} -gt 0 ]] || { usage; exit 2; }

# Requirements to check (section|key=value)
# Important: StartLimitIntervalSec belongs to [Unit]
declare -a REQUIRED=(
  "[Install]|WantedBy=multi-user.target"
  "[Unit]|Wants=network-online.target"
  "[Unit]|After=network-online.target"
  "[Unit]|After=NetworkManager-wait-online.service"
  "[Unit]|StartLimitIntervalSec=0"
  "[Service]|Restart=always"
  "[Service]|RestartSec=5"
  "[Service]|User=root"
)

total=${#units[@]}
fail_count=0

for UNIT in "${units[@]}"; do
  label="$UNIT"

  # Fetch effective config; don't abort on failure
  CONTENT="$(systemctl cat "$UNIT" 2>/dev/null || true)"

  if [[ -z "$CONTENT" ]]; then
    echo "[$label] ERROR: Cannot load effective config (unit missing or not found)."
    fail_count=$((fail_count+1))
    # continue to next unit
    continue
  fi

  # Working copy per unit
  mapfile -t reqs < <(printf '%s\n' "${REQUIRED[@]}")

  current_section=""
  while IFS= read -r line; do
    # Normalize CRLF endings if any
    line="${line%$'\r'}"
    # Track section headers like [Unit], [Service], [Install]
    if [[ $line =~ ^\[[[:alnum:]-]+\]$ ]]; then
      current_section="$line"
    fi
    # Match exact key=value in the correct section (whitespace tolerant)
    for i in "${!reqs[@]}"; do
      [[ -z "${reqs[$i]}" ]] && continue
      section="${reqs[$i]%%|*}"
      kv="${reqs[$i]#*|}"
      if [[ "$current_section" == "$section" ]] && [[ "$line" =~ ^[[:space:]]*$kv[[:space:]]*$ ]]; then
        reqs[$i]=""  # found
      fi
    done
  done <<< "$CONTENT"

  # Gather missing
  missing_list=()
  for r in "${reqs[@]}"; do
    [[ -z "$r" ]] && continue
    missing_list+=("$r")
  done

  if (( ${#missing_list[@]} == 0 )); then
    ((quiet==0)) && echo "[$label] OK: All required directives present (effective config)."
  else
    echo "[$label] MISSING (${#missing_list[@]}):"
    for m in "${missing_list[@]}"; do
      echo "  - $m"
    done
    fail_count=$((fail_count+1))
  fi

  # Optional: show enablement note for WantedBy=multi-user.target
  if systemctl is-enabled "$UNIT" &>/dev/null; then
    # Helpful info: check the multi-user.target symlink location
    wants_link="/etc/systemd/system/multi-user.target.wants/$UNIT"
    if [[ -L "$wants_link" ]]; then
      ((quiet==0)) && echo "[$label] Enabled via multi-user.target (symlink exists)."
    else
      echo "[$label] NOTE: Unit is enabled, but not via multi-user.target (no symlink at $wants_link)."
    fi
  else
    echo "[$label] NOTE: Unit is not enabled. 'WantedBy=multi-user.target' applies when enabled:"
    echo "  sudo systemctl enable $UNIT"
  fi

  ((quiet==0)) && echo
done

echo "Summary: ${total} units checked, ${fail_count} with issues."
exit $(( fail_count > 0 ? 1 : 0 ))
``