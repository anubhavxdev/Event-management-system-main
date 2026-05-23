# Contributing to eventone

First off, thank you for considering contributing to **eventone**! It's people like you that make eventone such a great tool. 

## Project Overview

**eventone** is a full-stack event management system built with:
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Frontend**: React (Vite), Tailwind CSS
- **Real-time**: Socket.IO

The project supports three distinct roles: **Customer**, **Organizer**, and **Admin**. 
Key features include:
- QR-coded PDF tickets
- Real-time Socket.IO check-ins
- CSV export for attendees and data
- Event reviews and ratings

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URL)
- [Git](https://git-scm.com/)

## Getting Started: Fork & Clone

1. **Fork the repository**: Click the "Fork" button at the top right of this page to create your own copy of the repository.
2. **Clone your fork**:
   ```bash
   git clone https://github.com/<your-username>/eventone.git
   cd eventone
   ```
3. **Add the original repository as upstream**:
   ```bash
   git remote add upstream https://github.com/OriginalOwner/eventone.git
   ```

## Branch Naming Convention

Please create a new branch for your work. Use the following prefixes to keep our branches organized:
- `feat/`: For new features (e.g., `feat/qr-code-generation`)
- `fix/`: For bug fixes (e.g., `fix/login-crash`)
- `docs/`: For documentation updates (e.g., `docs/update-readme`)
- `chore/`: For routine tasks, dependencies, or tooling (e.g., `chore/update-dependencies`)

## Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/). Your commit messages should be structured as follows:

```
<type>: <description>

[optional body]
```
**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

*Example:* `feat: add real-time check-in using Socket.IO`

## Raising an Issue

Before you start writing code, **please raise an issue** or find an existing one to work on. 
- Clearly describe the bug or feature request.
- Wait for a maintainer to assign the issue to you before making a Pull Request.

> **🌟 GSSoC Contributor Note:** 
> If you are contributing as part of GirlScript Summer of Code (GSSoC), you **must** have the issue assigned to you before you start working on it. Unassigned PRs may not be merged or counted towards your contribution.

## Pull Request Submission Steps

1. Commit your changes following the [Conventional Commits](#commit-message-format) guidelines.
2. Push your branch to your forked repository:
   ```bash
   git push origin <branch-name>
   ```
3. Open a Pull Request from your fork to the `main` branch of the original repository.
4. Fill out the provided Pull Request template completely.
5. Wait for maintainers to review your PR. Be open to feedback and make changes if requested!

Thank you for contributing! 🚀
