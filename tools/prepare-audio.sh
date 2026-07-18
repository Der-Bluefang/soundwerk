#!/usr/bin/env bash
# Converts a source clip into a normalized MP3 inside assets/audio/.
# Usage: ./tools/prepare-audio.sh /path/to/source.wav output-slug
set -euo pipefail

if [[ $# -ne 2 ]]; then
  printf 'Usage: %s SOURCE_FILE OUTPUT_SLUG\n' "$0" >&2
  exit 64
fi

source_file=$1
slug=$2

if [[ ! -f "$source_file" ]]; then
  printf 'Source file not found: %s\n' "$source_file" >&2
  exit 66
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  printf 'ffmpeg is required but not installed.\n' >&2
  exit 69
fi

if [[ ! "$slug" =~ ^[a-z0-9]+([_-][a-z0-9]+)*$ ]]; then
  printf 'OUTPUT_SLUG may only contain lowercase letters, digits, hyphens, and underscores.\n' >&2
  exit 64
fi

output_dir='assets/audio'
output_file="$output_dir/$slug.mp3"
mkdir -p "$output_dir"

ffmpeg -hide_banner -loglevel error -y \
  -i "$source_file" \
  -map 0:a:0 \
  -ac 2 \
  -ar 48000 \
  -af 'loudnorm=I=-16:TP=-1.5:LRA=11' \
  -c:a libmp3lame \
  -b:a 160k \
  "$output_file"

printf 'Created %s\n' "$output_file"
