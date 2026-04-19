# OFSD Codespace Setup Kit

This kit bootstraps the OFSD frontend development environment for Claude Code.

## What's in this bundle

```
├── CLAUDE.md                         ← Claude reads this first
├── README.md                         ← This file
├── docs/
│   ├── context.md                    ← What OFSD does, terminology, reference data
│   ├── design-system.md              ← Fonts, colors, components, tokens
│   ├── api-contract.md               ← Every endpoint: shape, fields, examples
│   ├── data-model.md                 ← DB tables, relationships, data flow
│   ├── backend-additions.md          ← Things Daniel needs to build (living doc)
│   ├── build-order.md                ← Sprint schedule + page sequence
│   └── current-task.md               ← The ONE page to build right now
├── demos/
│   ├── landing-page.html
│   ├── fund-management.html
│   └── add-investor.html
├── .claude/
│   └── skills/demo-to-react/SKILL.md ← How to convert demos to React
├── .devcontainer/
│   └── devcontainer.json             ← Codespace auto-config
├── public/
│   ├── logo.webp                     ← AI BAXYS logo
│   └── emblem.webp
├── .env.example
└── .gitignore-additions
```

## Setup — Option A: Upload from the Codespace web UI (simplest)

This is the easiest path if you've never done this before.

### Step 1 — Open your repo on GitHub in the browser

Navigate to your OFSD frontend repo on github.com.

### Step 2 — Start a Codespace

Click the green **Code** button → **Codespaces** tab → **Create codespace on main**.

Wait ~2 minutes for the container to build. You'll land in a browser-based VS Code.

### Step 3 — Upload the zip

1. Drag the `ofsd_claude_kit.zip` file directly onto the file explorer panel on the left side of VS Code.
2. It will upload into the root of your repo.
3. Open the Codespace terminal (`` Ctrl+` `` or View → Terminal).

### Step 4 — Extract the zip in place

```bash
# Unzip into current directory
unzip ofsd_claude_kit.zip

# The zip expands into ofsd_kit/ folder. Move its contents to the repo root.
# IMPORTANT: this may overwrite existing files with the same name.
# If you have an existing CLAUDE.md or docs/ folder, back it up first.
mv ofsd_kit/* ofsd_kit/.[!.]* .
rmdir ofsd_kit
rm ofsd_claude_kit.zip

# Verify
ls -la
# You should see: CLAUDE.md, docs/, demos/, .claude/, .devcontainer/, public/, etc.
```

### Step 5 — Handle the public/ folder carefully

If your repo already has a `public/` folder (Vite repos do), you only want to ADD `logo.webp` and `emblem.webp` to it, not replace the whole folder.

If the move above merged correctly, you're fine. If it replaced your `public/` folder, restore your existing files and manually copy only the two images:

```bash
# If needed, recover the original public/ via git:
git checkout public/

# Then manually merge: the bundle's public/ contains logo.webp and emblem.webp
```

### Step 6 — Append to .gitignore

```bash
cat .gitignore-additions >> .gitignore
rm .gitignore-additions
```

### Step 7 — Create your local env file

```bash
cp .env.example .env.local
# If Daniel's backend is on a different URL, edit .env.local
```

### Step 8 — Install dependencies (if not auto-run)

The devcontainer config should auto-run `npm install`, but if not:

```bash
npm install
```

### Step 9 — Commit the setup kit

```bash
git add CLAUDE.md README.md docs/ demos/ .claude/ .devcontainer/ public/logo.webp public/emblem.webp .env.example .gitignore
git commit -m "Add Claude Code setup kit"
git push
```

### Step 10 — Rebuild the container (so Claude Code installs)

The Claude Code CLI is installed via a devcontainer feature. If you uploaded the kit AFTER the Codespace was already running, you need to rebuild:

- In VS Code, press `F1` (or `Ctrl+Shift+P`)
- Type: **Codespaces: Rebuild Container**
- Hit Enter, confirm

After rebuild (~1 min), the `claude` command is available.

### Step 11 — Start Claude Code

```bash
claude
```

On first run it will ask you to log in (opens a browser tab).

### Step 12 — First prompt to Claude

```
Read CLAUDE.md first, then follow the reading order it specifies. After that, 
read docs/current-task.md and build the landing page exactly as specified.

The Fund Performance card must pull real data from GET /api/v1/funds/summary 
(defined in docs/backend-additions.md). If that endpoint isn't live yet, use 
the fallback behavior specified in the task.
```

Claude will read the orchestrator, follow the reading order, consult the demo, and build the landing page.

### Step 13 — Preview in browser

```bash
npm run dev
```

VS Code will pop up a notification offering to open the forwarded port in your browser. Click it.

---

## Setup — Option B: Merge into your repo locally, then push

If you prefer working locally with git before opening the Codespace:

```bash
# In your existing OFSD frontend repo locally
cd ~/path/to/ofsd-frontend
unzip ~/Downloads/ofsd_claude_kit.zip
mv ofsd_kit/* ofsd_kit/.[!.]* .
rmdir ofsd_kit
cat .gitignore-additions >> .gitignore
rm .gitignore-additions
git add .
git commit -m "Add Claude Code setup kit"
git push
```

Then open a Codespace from the GitHub repo page (Code → Codespaces → Create codespace on main). Everything will be in place from the start.

---

## After the landing page is done

Once Claude finishes the landing page:

1. Review the files it created/modified
2. Test in the browser (`npm run dev`)
3. Check `docs/backend-additions.md` — did Claude add anything new? Flag those to Daniel.
4. Commit and push
5. Update `docs/current-task.md` to the next task (use `docs/build-order.md` for the sequence)
6. Run Claude again: `claude` and tell it *"Read docs/current-task.md and build the next page"*

The cycle repeats: CLAUDE.md stays the same, `current-task.md` changes between tasks, `backend-additions.md` grows over time.

---

## The living docs

Two documents are meant to evolve as you build:

**`docs/current-task.md`** — rewritten for each new page. You or Claude updates it at the start of each task. Use the landing-page version as a template.

**`docs/backend-additions.md`** — grows over time. Claude adds entries when it needs backend work beyond the original dev doc. You (or Claude) update entries' status as Daniel confirms or ships them.

Both are checked into the repo so the history is preserved.

---

## Troubleshooting

**`claude` command not found?**
The devcontainer feature didn't install. Rebuild the container: F1 → "Codespaces: Rebuild Container". Or install manually:
```bash
npm install -g @anthropic-ai/claude-code
```

**Claude isn't reading the context files?**
Be explicit in your first prompt: *"Before writing any code, read these files in order: CLAUDE.md, docs/context.md, docs/design-system.md, docs/api-contract.md, docs/data-model.md, docs/backend-additions.md, docs/build-order.md, docs/current-task.md. Then build what current-task.md specifies."*

**API calls return CORS errors?**
In the Codespace, ports 3000 (frontend) and 4455 (backend) are forwarded as HTTPS URLs with unique subdomains. Update `.env.local` with the correct forwarded backend URL:
```
VITE_API_URL=https://<your-backend-url>-4455.app.github.dev/api/v1
```

**Visual doesn't match the demo?**
Open the demo HTML in one browser tab, your running dev server in another. Inspect and compare. Tell Claude: *"Compare against demos/landing-page.html again and fix the differences."*

**Claude deviates from the spec?**
Start a fresh Claude session and re-emphasize: *"The demo file is the visual contract. Match it pixel-for-pixel. Do not deviate without explicit approval."* Then point it at the specific demo file again.

**Accidentally overwrote something during extraction?**
```bash
git checkout -- <path/to/lost/file>
```
Git has your back as long as the file was committed before the overwrite.
