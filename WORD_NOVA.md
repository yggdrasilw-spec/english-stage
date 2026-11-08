# WORD NOVA

Original supplied WORD_NOVA game, retaining its CSS, canvas rendering, controls, sectors, combos, guardian and word log. The menu adds a focused listening entry and a return link. English Stage home adds a launch link.

All 822 word entries in grade5.json use their own normal-speed MP3 from audio-manifest.json. No browser speech synthesis is used. Japanese prompts appear on screen. Regenerate with `python scripts/build-word-nova-data.py`.

`word-nova.html?sets=near` uses 41 words in 21 explicit sound contrasts. Questions wait until contrasting choices are visible. Homophones such as two/to/too and right/write cannot appear together. Other sectors retain the original prompt mixture and harder stages prefer these sound contrasts too.

MP3 completion starts listening response timing. Playback failure freezes the question until replay succeeds. Pause cancels playback; resume replays the question. Records use `english-stage.word-nova.v1`, separately from other games.

Validation: 105 existing app tests, 13 grammar tests, 2 new content/MP3 tests, content/audio and release-entry validation passed. Edge QA used actual MP3 loading/playback, 1280px and 390px layouts, sound contrasts, failure/retry, pause/resume, answering and persisted results. Original CSS is unchanged. Exhaustive human listening was not performed.

User authorized publication after the accent app deployment completes. Publish from codex/word-nova after merging the latest main entry links.
