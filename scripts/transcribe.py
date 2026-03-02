"""
transcribe.py — Whisper-based audio transcription for class recordings.

For each date directory under recordings/YYYY-MM-DD/, transcribes every audio
file and writes raw JSON to transcripts/.raw/YYYY-MM-DD/<filename>.json.

Skips dates that already have a full directory in transcripts/.raw/.
Skips individual files shorter than MIN_DURATION_SECS seconds.
On error, writes transcripts/.raw/YYYY-MM-DD/ERROR.txt and continues.

Output JSON shape per recording:
{
  "source_recording": "recording_1.m4a",
  "full_text": "Full transcript text...",
  "segments": [
    {"start": 0.0, "end": 5.2, "text": "..."}
  ]
}
"""

import os
import sys
import json
import traceback
from pathlib import Path

# Allow overriding the Whisper model via environment variable.
WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "base")
MIN_DURATION_SECS = 5.0

SUPPORTED_EXTENSIONS = {".m4a", ".mp3", ".wav", ".ogg"}

def get_audio_duration(audio_path: str) -> float:
    """Return audio duration in seconds using soundfile or ffprobe fallback."""
    try:
        import soundfile as sf
        info = sf.info(audio_path)
        return info.duration
    except Exception:
        pass

    # Fallback: use ffprobe if available
    try:
        import subprocess
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                audio_path,
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )
        return float(result.stdout.strip())
    except Exception:
        pass

    # Cannot determine duration — assume valid
    return float("inf")


def transcribe_file(model, audio_path: str) -> dict:
    """Transcribe a single audio file and return the raw result dict."""
    result = model.transcribe(audio_path)
    segments = [
        {"start": seg["start"], "end": seg["end"], "text": seg["text"].strip()}
        for seg in result.get("segments", [])
    ]
    return {
        "source_recording": Path(audio_path).name,
        "full_text": result.get("text", "").strip(),
        "segments": segments,
    }


def main():
    repo_root = Path(__file__).parent.parent
    recordings_root = repo_root / "recordings"
    raw_root = repo_root / "transcripts" / ".raw"

    if not recordings_root.exists():
        print("No recordings/ directory found. Nothing to transcribe.")
        return

    # Discover all date directories (YYYY-MM-DD)
    date_dirs = sorted(
        d for d in recordings_root.iterdir()
        if d.is_dir() and d.name not in {"__pycache__", ".git"}
        and len(d.name) == 10 and d.name[4] == "-" and d.name[7] == "-"
    )

    if not date_dirs:
        print("No date directories found under recordings/. Nothing to transcribe.")
        return

    # Filter to only dates that have audio files and lack an existing raw output dir
    dates_to_process = []
    for date_dir in date_dirs:
        audio_files = [
            f for f in date_dir.iterdir()
            if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS
        ]
        if not audio_files:
            continue
        raw_out_dir = raw_root / date_dir.name
        if raw_out_dir.exists() and any(raw_out_dir.glob("*.json")):
            print(f"Skipping {date_dir.name} — raw transcripts already exist.")
            continue
        dates_to_process.append((date_dir, audio_files))

    if not dates_to_process:
        print("All dates already transcribed or have no audio. Nothing to do.")
        return

    # Load Whisper model once
    print(f"Loading Whisper model '{WHISPER_MODEL}'...")
    import whisper  # noqa: E402  (import here so --check still works)
    model = whisper.load_model(WHISPER_MODEL)
    print("Model loaded.")

    for date_dir, audio_files in dates_to_process:
        date_str = date_dir.name
        raw_out_dir = raw_root / date_str
        raw_out_dir.mkdir(parents=True, exist_ok=True)

        print(f"\nProcessing date: {date_str} ({len(audio_files)} file(s))")

        for audio_file in sorted(audio_files):
            out_path = raw_out_dir / (audio_file.stem + ".json")
            if out_path.exists():
                print(f"  Skipping {audio_file.name} — output already exists.")
                continue

            try:
                duration = get_audio_duration(str(audio_file))
                if duration < MIN_DURATION_SECS:
                    print(f"  Skipping {audio_file.name} — too short ({duration:.1f}s < {MIN_DURATION_SECS}s).")
                    continue

                print(f"  Transcribing {audio_file.name}...")
                raw = transcribe_file(model, str(audio_file))
                out_path.write_text(json.dumps(raw, indent=2, ensure_ascii=False))
                print(f"  Wrote {out_path.name} ({len(raw['segments'])} segments, {len(raw['full_text'])} chars)")

            except Exception:
                err_msg = traceback.format_exc()
                error_file = raw_out_dir / "ERROR.txt"
                existing = error_file.read_text() if error_file.exists() else ""
                error_file.write_text(
                    existing + f"\n--- Error for {audio_file.name} ---\n{err_msg}\n"
                )
                print(f"  ERROR transcribing {audio_file.name} — see {error_file}", file=sys.stderr)

    print("\n✅ Transcription complete.")


if __name__ == "__main__":
    main()
