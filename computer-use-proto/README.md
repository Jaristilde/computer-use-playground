<div align="center">

# OpenAI Computer Use Playground

Interactively prototype workflows that leverage the `computer-use-preview` model. The React front‑end lets you submit a task prompt, inspect the returned `computer_call`, upload a screenshot from your environment, and iterate through actions. An Express backend keeps your API key server-side and relays requests to OpenAI's Responses API.

</div>

## Stack

- **React + Vite (TypeScript)** – UI for prompts, screenshots, and response logs.
- **Express** – lightweight API bridge that signs requests with `OPENAI_API_KEY` and streams the conversation state.
- **OpenAI `computer-use-preview`** – model/tool combination that emits UI actions (`click`, `scroll`, `type`, etc.).

## Project structure

```
computer-use-proto/
├── src/                # React components, hooks, and styles
├── server/index.ts     # Express route `/api/computer-use/step`
├── vite.config.ts      # Includes dev proxy to the server
├── package.json        # Shared scripts for client + server
└── .env                # OPENAI_API_KEY (never commit)
```

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set environment variables**

   Create `.env` in the project root:

   ```bash
   cp ../.env .env   # if your key already lives one directory up
   ```

   Required keys:

   ```
   OPENAI_API_KEY=sk-...
   PORT=4000            # optional, defaults to 4000
   ```

3. **Run the prototype**

   ```bash
   npm run dev
   ```

   This runs both servers via `concurrently`:

   - Vite UI → <http://localhost:5173>
   - Express API → <http://localhost:4000>

## Usage flow

1. Enter a task (e.g., “Check the latest OpenAI news on bing.com”) and start the session. The backend sends the initial prompt and returns the first `computer_call` from OpenAI.
2. Perform the action manually (or via an automation harness) and upload a screenshot of the updated environment. Optionally provide `currentUrl` for better safety checks.
3. Click **Send follow-up step**. The backend forwards the screenshot as `computer_call_output`, along with any `pending_safety_checks` acknowledgements, and returns the next instruction.
4. Repeat until the response contains no additional `computer_call` items.

The UI shows:

- Latest action details (type, coordinates, safety warnings).
- Raw JSON response for debugging.
- Session reset controls and error states.

## Customization ideas

- **Automation**: Replace manual screenshot upload with Playwright/Docker capture that mirrors `handleModelAction` logic.
- **Guardrails**: Add domain allowlists/blocklists and require explicit user confirmation when safety checks fire.
- **History**: Persist the conversation log, screenshot thumbnails, and task metadata for later review.

## MIT License

```
MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
