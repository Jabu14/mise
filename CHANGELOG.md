# Changelog

Versions follow the mobile app (`mobile/app.json`). The web app's offline cache name (`web/sw.js`) is bumped whenever the web files change.

## 1.4.0 (2026-10-12)

### Added
- **＋ sheet in Sous** (like Gemini and ChatGPT): big Camera, Photos and Recipes tiles, plus starters (Plan meals, Use what I have, Swap an ingredient, Rescue a dish) that drop a prompt into the message box. Drag down to close.
- **••• menu in an open chat**: Share, Rename, Pin and Delete, with the chat's name on top.
- **Recipe prompt page**: how to use it, the full prompt, Copy, Edit and Restore. (Editing moved here from Settings.)
- **Help center** with searchable questions and answers.
- **Report an issue** form.
- **Terms of Use and Privacy Policy** under About (drafts to review before publishing).

### Changed
- Sous's answers are plain text across the page: no bubble, border or avatar.
- Sous header: round ☰ on the left, a pill with a new compose icon and ••• on the right, and no chat name.
- The history sidebar's account button is replaced by a voice-mode button.
- Account: one icon size everywhere, no subtitles, a Support section (Help center, Report an issue, Send feedback), and "About Mise" is now "About". The Feedback button is a normal row.

## 1.3.0 (2026-10-12)

### Changed
- **Running timer at the top.** The Dynamic Island-style pill now grows in at the top of the screen instead of sitting at the bottom. With several timers it shows the next one to ring and a "+N" for the rest (tap it to see them all). It hides on the Timers screens, which already list them.
- **Chat history opens like the Claude app.** Swipe right on the Sous chat and the whole app, tab bar included, slides right with your finger to uncover your chats. Swipe left or tap the strip on the right to close.
- "Look" is now called **Appearance**.
- The Feedback card on Account uses a normal icon instead of an emoji.

### Fixed
- The greeting showed only part of some names (it split names on the letter "s").

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
