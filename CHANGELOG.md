# Changelog

Versions follow the mobile app (`mobile/app.json`). The web app's offline cache name (`web/sw.js`) is bumped whenever the web files change.

## 1.2.0 (2026-10-12)

### Added
- **Greeting by time of day:** "Good morning / afternoon / evening, {name}" (or "Hi" late at night) with a matching nudge, instead of "Hi, I'm Sous".
- **Smart chat names** made from the first message, like AI apps ("Buttermilk substitute", "Sticky bread dough fix"). A chat that starts with a voice message is "Voice chat" until something is typed. The open chat's name shows in the header.
- **Search in chat history** across chat names and messages, with the matching words shown.
- **Long-press a chat** for Rename, Pin / Unpin and Delete. Pinned chats sit in their own section.
- **Swipe right** on the chat screen to open the history; swipe the history left to close it.

### Changed
- The history drawer is redesigned after AI-app sidebars: big title, round search button, Pinned and Recents, account button and a floating "New chat" pill.
- The voice-mode button uses a sound-wave icon.
- The Edit button in chat history is gone (long-press replaces it).

## 1.1.0 (2026-10-12)

### Added
- **Sous, the built-in sous-chef (preview).** New AI chat tab with chat history (new chat, swipe or Edit to delete), voice messages with a live level meter, a hands-free voice mode, and photo / recipe attachments. Not connected to an AI yet: Sous answers with a placeholder.
- **Several timers at once, iPhone Clock style.** Running timers show as a list with ＋ to add another. Each row has its own pause button and a small Ring / Clock / Sand face (tap it to switch style). Tap a timer for its own page with Label, "When Timer Ends" and +1 min.
- **Alarm tones:** Chime, Bell, Beeps or Vibrate only, each previewed when chosen.
- **Dynamic Island-style running timer** at the bottom of the screen.
- **Own pages for Look, Settings, About Mise and Feedback**, reached from separate sections on the Account tab.

### Changed
- Tab bar order: Recipes · Sous · Add · Timers · Account. The Recipes book opens when you're on it and closes when you leave.
- Swipe to delete now shows a round red trash button, and lists have an iOS-style Edit mode.

### Removed
- Timer history (Recents) on the Timers tab.

## 1.0.0

- First version: paste a recipe and get big step-by-step cards with timers, cook mode, a customisable look, the Timers and Account tabs, and AI import (link, photo, text) through a protected server.
