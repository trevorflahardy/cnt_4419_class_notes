# Class Recordings

This directory holds audio recordings of CNT 4419 class sessions. Files are stored
in Git LFS (tracked via `.gitattributes`).

## Naming Convention

Recordings must be organized by date using the following structure:

```
recordings/
  YYYY-MM-DD/
    recording_1.m4a
    recording_2.m4a
    ...
```

**Example:**
```
recordings/
  2026-01-15/
    recording_1.m4a
    recording_2.m4a
  2026-01-22/
    recording_1.m4a
```

## Supported Formats

- `.m4a` (recommended — compact, good quality)
- `.mp3`
- `.wav`
- `.ogg`

## Workflow

1. Record class audio and rename files to follow the convention above.
2. Commit and push the files to `master`. Git LFS handles large file storage.
3. The **Transcribe Recordings** GitHub Actions workflow triggers automatically
   when files under `recordings/` change.
4. Whisper transcribes each recording locally in CI (no external API cost).
5. If multiple recordings exist for the same date, Claude merges them into one
   canonical transcript.
6. Transcripts are committed back to `transcripts/` and `site/public/announcements.json`
   is updated with keyword-matched professor announcements.
7. The **Build PDF & Deploy** workflow then rebuilds the site with the enriched RAG
   context and the new "Professor Says" tab.

## Notes

- Recordings shorter than 5 seconds are skipped automatically.
- If a transcript already exists for a date, that date is skipped on re-runs.
- Errors during transcription are logged to `transcripts/.raw/YYYY-MM-DD/ERROR.txt`
  and do not block other dates from processing.
