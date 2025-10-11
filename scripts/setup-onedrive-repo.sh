#!/usr/bin/env bash
set -euo pipefail

# Script to download the Harmony Cloud repository archive from OneDrive and
# prepare a local git repository with the extracted contents.

SHARE_URL="https://1drv.ms/f/c/61f190f99390ba1c/EuLdkPI7kL9MqVIyCEc5ck4BS_Pi7DaghA3iURL79i8fWg"
DOWNLOAD_URL="${SHARE_URL}?download=1"

SCRIPT_DIR=$(cd -- "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
PROJECT_ROOT=$(cd -- "${SCRIPT_DIR}/.." && pwd)
DEFAULT_TARGET="${PROJECT_ROOT}/external/harmony-cloud-01"

usage() {
  cat <<USAGE
Usage: $(basename "$0") [target-directory]

Downloads the OneDrive share that contains the Harmony Cloud project and
extracts it into the provided target directory (defaults to
external/harmony-cloud-01).

If downloading is not possible in the current environment, place the archive
next to this script (named after the target directory with a .zip extension) and
re-run the command.

After extraction the script will initialize a git repository if one does not
already exist in the destination directory.
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -gt 1 ]]; then
  usage
  exit 1
fi

TARGET_DIR="${DEFAULT_TARGET}"
ARCHIVE_BASENAME="$(basename "${TARGET_DIR}")"
ARCHIVE_NAME="${ARCHIVE_BASENAME}.zip"

if [[ $# -eq 1 ]]; then
  TARGET_DIR="$1"
  TARGET_DIR="${TARGET_DIR%/}"
  ARCHIVE_BASENAME="$(basename "${TARGET_DIR}")"
  ARCHIVE_NAME="${ARCHIVE_BASENAME}.zip"
fi

ARCHIVE_PATH="${TARGET_DIR}.zip"
LOCAL_ARCHIVE="${SCRIPT_DIR}/${ARCHIVE_NAME}"

mkdir -p "$(dirname "${TARGET_DIR}")"

if [[ -f "${LOCAL_ARCHIVE}" ]]; then
  echo "Using pre-downloaded archive ${LOCAL_ARCHIVE}..."
  cp "${LOCAL_ARCHIVE}" "${ARCHIVE_PATH}"
else
  echo "Downloading OneDrive archive to ${ARCHIVE_PATH}..."
  rm -f "${ARCHIVE_PATH}"
  if ! curl -L --fail --output "${ARCHIVE_PATH}" "${DOWNLOAD_URL}"; then
    echo "Failed to download archive from OneDrive share." >&2
    echo "You can download the archive manually and place it at ${LOCAL_ARCHIVE}." >&2
    exit 1
  fi
fi

echo "Extracting archive into ${TARGET_DIR}..."
rm -rf "${TARGET_DIR}"
mkdir -p "${TARGET_DIR}"
if ! unzip -q "${ARCHIVE_PATH}" -d "${TARGET_DIR}"; then
  echo "Failed to extract the downloaded archive." >&2
  exit 1
fi

# OneDrive archives typically contain a top-level directory matching the shared
# folder name. Flatten the structure if the archive only contained one folder.
ENTRY_COUNT=$(find "${TARGET_DIR}" -mindepth 1 -maxdepth 1 | wc -l | tr -d ' ')
if [[ "${ENTRY_COUNT}" == "1" ]]; then
  SHARED_SUBDIR=$(find "${TARGET_DIR}" -mindepth 1 -maxdepth 1 -type d | head -n 1)
  if [[ -d "${SHARED_SUBDIR}" ]]; then
    shopt -s dotglob nullglob
    mv "${SHARED_SUBDIR}"/* "${TARGET_DIR}"/
    rmdir "${SHARED_SUBDIR}"
    shopt -u dotglob nullglob
  fi
fi

if [[ ! -d "${TARGET_DIR}/.git" ]]; then
  echo "Initializing git repository in ${TARGET_DIR}..."
  git -C "${TARGET_DIR}" init >/dev/null
  git -C "${TARGET_DIR}" add .
  if git -C "${TARGET_DIR}" config user.email >/dev/null 2>&1 && \
    git -C "${TARGET_DIR}" config user.name >/dev/null 2>&1; then
    git -C "${TARGET_DIR}" commit -m "Initial import from OneDrive archive" >/dev/null
  else
    echo "Git user identity not configured; skipped creating initial commit." >&2
  fi
fi

echo "Repository ready at ${TARGET_DIR}"
