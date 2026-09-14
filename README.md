# Game Night Tracker

Build a game score-tracking app for friend groups with the following features:

Core functionality

Track scores for game sessions among a fixed group of friends

Support multiple games out of the box: Sevens, Poker, Uno

Allow users to add custom/new games at any time (name, scoring type — e.g. points-based, win/loss, ranked)

Every player should be able to 
add his / her name 
see current/on going game

Start a new "session" for a game, add players, enter scores per round, auto-calculate running totals

Players & profiles

Each player creates a profile with a name and picks a "spirit animal" — shown as a small animated avatar (simple looping animation, not static image)

Profile persists across sessions/games so stats accumulate over time

Leaderboards & stats

Per-game all-time leaderboard (who has the most wins/points in Uno, Poker, Sevens, etc.)

Overall/combined leaderboard across all games

Visual dashboard: graphs showing score trends over time per player, win-rate comparisons, and a combined "all games" performance view (bar chart, radar/spider chart for multi-game comparison, and line chart for trend over time)

Filter leaderboard by game, by date range, or all-time

UX

Mobile-friendly, fun and playful visual style (fits the "game night with friends" vibe)

Quick score entry during a live game (minimal taps)

Session history — view past games with final scores and dates

Tech

Persist data so history isn't lost between sessions (use a database, not local-only storage)

Simple auth or shared group login so all friends see the same data
Player Profiles: Give each friend a tappable profile page showing their own win streak, favourite game and score trend

Winner Confetti: Add a burst of confetti and a victory sound when a game ends so wins feel like a real celebration

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://friend-feat-tracker.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ed27d136-acfa-418e-bc5e-0917f97b534f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
