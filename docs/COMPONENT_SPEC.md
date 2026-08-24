# TechUI Component Improvement Spec

**Purpose:** This document is the authoritative spec for sub-agents improving TechUI components.
Read it fully before touching any file.

---

## 1. The North Star (What We're Building)

TechUI makes software engineering concepts **visually obvious** to beginners. A person who has never heard the term "DNS lookup" or "circuit breaker" should be able to open the component and understand what it does within 5 seconds — not from reading, but from looking.

The **Rate Limiter** (Image #3) is the gold standard. Study it:
- Big, obvious token counter (number + color block)
- One action button: "Make Request"
- Progress bar that changes instantly
- Simple plain-English caption
- No technical jargon on first look

Every other component should aim for the same clarity.

---

## 2. Global Design System (NEVER deviate from these)

### 2.1 Card Structure — every component uses this layout

```
┌─────────────────────────────────────────────┐
│ [Icon] Title              [badge]  [action] │  ← header: h-12, px-4, border-b
├─────────────────────────────────────────────┤
│  1-2 sentence plain English description     │  ← optional, text-sm text-zinc-500 px-4 py-2
├─────────────────────────────────────────────┤
│                                             │
│   MAIN VISUAL AREA — FIXED HEIGHT          │  ← NEVER change height on interaction
│   (min 200px, pick one height, keep it)    │
│                                             │
├─────────────────────────────────────────────┤
│  [status/result text]    [Primary Button]   │  ← footer: px-4 py-3, border-t
└─────────────────────────────────────────────┘
```

### 2.2 Visual design tokens

```tsx
// Outer card
"rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden"

// Section header label (ROUTES, PARAMETERS, etc.)
"text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500"

// Section divider
"border-t border-zinc-100 dark:border-zinc-800"

// Primary action button
"bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"

// Status: success
"bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"

// Status: error
"bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"

// Status: warning/pending  
"bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"

// Status: info
"bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
```

### 2.3 Icon mapping — use lucide-react

| Concept | Icon |
|---|---|
| Client / Browser | `Monitor` or `Laptop` |
| Mobile client | `Smartphone` |
| API Server / Backend | `Server` |
| Database (SQL) | `Database` |
| Cache (Redis) | `Zap` |
| Queue / Message | `Mail` |
| Load Balancer | `GitBranch` |
| CDN | `Globe` |
| Auth / Shield | `Shield` |
| Kafka / Streaming | `Radio` |
| Worker / CPU | `Cpu` |
| Cloud / Lambda | `Cloud` |
| Container / Docker | `Box` |
| Kubernetes | `Layers` |
| Security / Lock | `Lock` |
| Key | `Key` |
| Circuit Breaker | `Zap` (when closed), `ZapOff` (when open) |
| Webhook | `Webhook` (or `ArrowUpRight`) |
| GraphQL | `Braces` |
| DNS | `Globe` |
| Network | `Network` |
| User / Person | `User` |
| Success | `CheckCircle` |
| Error | `XCircle` |
| Warning | `AlertCircle` |
| Clock / Time | `Clock` |
| Arrow right | `ArrowRight` |
| Refresh/Retry | `RefreshCw` |

### 2.4 Animation rules — THIS IS CRITICAL

```tsx
// Standard state change (button clicks, status updates)
transition-all duration-500

// Important visual change (circuit breaker, connection established)  
transition-all duration-700

// Alive/active pulse indicators
animate-pulse (use sparingly — only 1 per component)

// Message traveling along a wire/line — use CSS keyframes
// Example: message bubble moving from left to right
@keyframes travel {
  from { transform: translateX(0); opacity: 1; }
  to   { transform: translateX(100%); opacity: 0; }
}
// Duration: 800ms minimum

// Step reveals (showing one step at a time in flows)
// Each step appears with: transition-opacity duration-500
// Delay between auto-steps: 1200ms minimum (NOT 300ms — that's too fast)
```

**Anti-patterns to fix in every component:**
- `transition-all duration-150` → change to `duration-500` minimum
- `setTimeout(fn, 300)` → change to `setTimeout(fn, 1000)` minimum for visible steps
- Any state change that causes layout shift (height change) → prevent with `min-h-[...]`

### 2.5 Section borders — visual separation

Use actual borders, not just whitespace:
```tsx
// Section within a card:
<div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3">

// Sub-panel (like parameters vs response):
<div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">

// Inline code/value display:
<div className="bg-zinc-100 dark:bg-zinc-800 rounded-md px-2.5 py-1 font-mono text-xs">
```

Never separate sections with only uppercase text labels and 12px of gap — always add a background or border.

### 2.6 Height stability rule

**Critical**: Use `min-h-[XXXpx]` on the main visual area. When the user clicks "Next", "Simulate", etc., the card height MUST NOT change. Use:
```tsx
<div className="min-h-[220px] flex flex-col justify-center">
  {/* content that changes */}
</div>
```

---

## 3. Component-by-Component Specs

### 3.1 HTTP Endpoint (api/HttpEndpoint.tsx)
**Status: Keep, improve borders and sections**

**Problems from image:**
- Parameters and response panels lack clear visual separation
- No hover state on parameter rows
- Response status tabs don't feel clickable enough

**Changes:**
- Wrap the parameters panel in `bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-200 dark:border-zinc-700`
- Wrap the response panel in same
- Add left-border accent per param type: path=`border-l-2 border-l-blue-400`, query=`border-l-2 border-l-violet-400`, header=`border-l-2 border-l-zinc-400`
- Response status tabs: add `rounded-md px-2 py-0.5` styling, selected tab gets `bg-emerald-100 dark:bg-emerald-900 text-emerald-700` (green for 2xx), `bg-amber-100 text-amber-700` (4xx), `bg-red-100 text-red-700` (5xx)
- Add `"required"` badge as a colored pill, not just red text

---

### 3.2 Webhook Event (api/WebhookEvent.tsx)
**Status: COMPLETE REDESIGN**

**Problems from image:**
- Green header tells you nothing about what a webhook IS
- Collapsed "Headers" and "Payload" sections give no visual context
- A beginner sees: title + green badge + a cryptographic string = completely lost

**New design — show it as a delivery flow:**

```
┌────────────────────────────────────────────────────┐
│ 🪝 Webhook Event                    ● DELIVERED    │
│ payment.succeeded                        POST      │
├────────────────────────────────────────────────────┤
│                                                    │
│  [Server] ──────────POST──────────► [Your API]    │
│  Stripe          payment.succeeded    /webhooks    │
│                                                    │
│  ✓ Signature verified   t=1716239022              │
│                                                    │
├────────────────────────────────────────────────────┤
│  PAYLOAD                                           │
│  ┌───────────────────────────────────────────┐    │
│  │ { "type": "payment.succeeded",            │    │
│  │   "data": { "amount": 4999, "currency":  │    │
│  │     "usd", "status": "succeeded" } }      │    │
│  └───────────────────────────────────────────┘    │
├────────────────────────────────────────────────────┤
│  Response: 200 OK  ·  124ms          Retry 1/3    │
└────────────────────────────────────────────────────┘
```

**Implementation:**
- Header: event name + status badge (DELIVERED=emerald, RETRYING=amber, FAILED=red)
- Middle: SVG or flexbox showing sender→receiver with animated dashed arrow (CSS animation `stroke-dashoffset`)
- Signature section: show `✓ Verified` in green or `✗ Invalid` in red (never show raw crypto string)
- Payload: always expanded, syntax-highlighted JSON, scrollable if long, fixed height container
- Footer: response code badge + latency + attempt counter
- Remove the collapsible "Headers" section entirely — not needed

---

### 3.3 Rate Limiter (api/RateLimiter.tsx)
**Status: Keep, minor improvements only**

**Keep everything. Only add:**
- A small row of request history dots (last 8 requests as green/red dots with opacity fade on older ones)
- When `tokens === 0`: the bucket color changes to red (`bg-red-500`) with a brief shake animation (`animate-[shake_0.3s]`)
- Token refill: show a subtle green flash on the counter when a token is restored

---

### 3.4 GraphQL Query (api/GraphQLQuery.tsx)
**Status: Keep structure, fix spacing and add visual run button**

**Problems:**
- Code in the Query tab has no proper padding inside the code block
- No clear "Run" call-to-action
- Spacing between header and tabs too tight

**Changes:**
- Add `p-4` padding inside the code view panel
- Move "Run Query" button to be prominent: inside the Query tab view, bottom-right, styled as primary button
- When response arrives, animate it appearing (fade in `duration-500`)
- Add color-coded operation type: QUERY=blue, MUTATION=amber, SUBSCRIPTION=violet badge next to the operation name
- Variables tab: show a clean key-value editor not raw JSON
- Response tab: proper JSON syntax highlight with colored keys/strings

---

### 3.5 Pagination Pattern (api/PaginationPattern.tsx)
**Status: COMPLETE REDESIGN — most confusing component**

**Problems:**
- Pros/cons wall of text means nothing to a beginner
- Raw JSON scrolling is overwhelming
- No visual representation of WHAT pagination IS

**New design — visual page flipper:**

```
┌─────────────────────────────────────────────────┐
│ 📄 Pagination                    [offset] [cursor] [keyset] │
├─────────────────────────────────────────────────┤
│ "Fetch results in chunks, not all at once"      │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│  │ #1   │ │ #2   │ │ #3   │ │ #4   │ │ #5   │ │  ← item cards
│  │Alice │ │ Bob  │ │Carol │ │Dave  │ │ Eve  │ │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ │
│                                                 │
│         ← Prev    Page 1 of 5    Next →         │
│                                                 │
├─────────────────────────────────────────────────┤
│ GET /users?limit=5&offset=0                     │ ← updates live
│ ✓ offset     ✗ cursor available     ✗ keyset   │ ← comparison row
└─────────────────────────────────────────────────┘
```

**Implementation:**
- Three strategy tabs at top: Offset / Cursor / Keyset
- Main area: 5 "item cards" (user avatars with name) in a row — fixed height
- Page navigation: Prev/Next buttons that animate items sliding out left, new items sliding in right (`transform translateX` with `transition duration-500`)
- Below the items: the actual API call that would be made (updates live as you navigate)
- Comparison row: shows which strategies support "jump to any page", "stable on inserts", etc. as ✓/✗ icons — NOT a pros/cons text wall
- Cursor/keyset: show a highlighted cursor value that changes as you navigate

---

### 3.6 API Gateway (api/ApiGateway.tsx)
**Status: REDESIGN — show traffic flow not just a table**

**Problems:**
- Just a table of routes with middleware badges — no visual flow
- Clicking a route and seeing "Click a route to simulate a request" at the bottom is unhelpful

**New design — traffic flow diagram:**

```
┌──────────────────────────────────────────────────────┐
│ ⊕ API Gateway                     api.example.com   │
├────────────────────────────────────────────────────  │
│                                                      │
│  [Client]                                            │
│     │                                                │
│     ▼                                                │
│  ┌──────────────┐   /api/users  →  [Users Service]  │
│  │  API Gateway │   /api/orders →  [Orders Service] │
│  │              │   /api/products→ [Products Svc]   │
│  └──────────────┘                                    │
│                                                      │
│  Middleware on /api/users: 🔒 Auth  ⚡ Rate Limit   │
│                                                      │
├──────────────────────────────────────────────────────┤
│ [Select route ▾]              [Send Request →]       │
└──────────────────────────────────────────────────────┘
```

**Implementation:**
- Left side: Client icon (`Monitor`) → Gateway box (center, larger, border)
- Right side: service boxes for each route, connected with lines
- Each route line shows middleware icons inline
- Clicking "Send Request": animate a dot traveling Client → Gateway → Service, color changes per middleware pass (green=auth passed, red=rate limited)
- Show response status in bottom bar after animation completes
- Dropdown to select which route to simulate

---

### 3.7 WebSocket Connection (api/WebSocketConnection.tsx)
**Status: COMPLETE REDESIGN**

**Problems:**
- Showing raw HTTP upgrade headers as text is meaningless to beginners
- No visual showing two-way communication

**New design — chat interface:**

```
┌──────────────────────────────────────────────────┐
│ ⚡ WebSocket Connection          ● Connected      │ 
│ wss://api.example.com/ws                         │
├──────────────────────────────────────────────────┤
│  [Client]                    [Server]            │
│  ─────────────────────────────────────────────  │
│                                                  │
│  ● Hello from client ────────────────►          │  ← right-align bubbles from client
│                         ◄──── Pong! ●           │  ← left-align from server
│  ● {"type":"subscribe","topic":"prices"} ──►    │
│                  ◄── {"price":42.50} ●          │
│                  ◄── {"price":42.61} ●          │
│                                                  │
├──────────────────────────────────────────────────┤
│ [Type a message...]              [Send] [Connect]│
└──────────────────────────────────────────────────┘
```

**Implementation:**
- Before connecting: gray "Closed" indicator, show a brief explanation + Connect button
- Clicking Connect: animate a brief "Handshaking..." state (1s with spinner) → then Connected (green pulse dot)
- Once connected: chat interface with message bubbles
  - Client messages: right side, dark background bubbles  
  - Server messages: left side, zinc bubbles, auto-arrive after 400ms delay
- Server auto-responds with contextual messages (e.g., if user sends "ping" server replies "pong")
- Message log scrolls, max 8 messages visible
- The HTTP upgrade details: moved to a tiny collapsible "How WebSockets connect" below

---

### 3.8 Architecture Diagram (architecture/ArchitectureDiagram.tsx)
**Status: Keep structure, add interactivity and improve connections**

**Problems:**
- Connections don't animate (static arrows)
- No click-to-detail on nodes
- Works only as a linear flow, grid layout is underutilized

**Changes:**
- Animate connection arrows: use `stroke-dasharray` + CSS animation to make dashes flow in arrow direction (shows traffic direction)
- Click on any node: show a small tooltip/popover with the node's full details (type, sublabel, status, description)
- Node border color by type:
  - client → `border-blue-300 dark:border-blue-700`
  - service → `border-emerald-300 dark:border-emerald-700`
  - database → `border-amber-300 dark:border-amber-700`
  - cache → `border-violet-300 dark:border-violet-700`
  - gateway → `border-zinc-400`
  - loadbalancer → `border-cyan-300`
- Active status dot: `animate-pulse` with color matching node type
- Grid layout: properly center nodes in a 2D grid, not just left-aligned

---

### 3.9 State Machine (architecture/StateMachine.tsx)
**Status: DEPRECATE — remove from registry**

User feedback: "I don't know why we have state machine component like why we having it I think it's unnecessary."

**Action:** Remove the `"state-machine"` entry from `src/registry/index.ts` and remove its import from `LivePreview.tsx`. Keep the file but don't register it. This concept is covered better by the Sequence Diagram and ER Diagram.

---

### 3.10 Database Table (database/DatabaseTable.tsx)
**Status: Good, targeted improvements**

**Problems:**
- No row hover highlighting
- Boolean values shown as text "true"/"false" (not visually obvious)
- PK/FK column indicators could be clearer

**Changes:**
- Row hover: `hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-default` on `<tr>`
- Boolean values: replace text with `<span className="text-emerald-600 font-medium">✓ true</span>` and `<span className="text-red-500 font-medium">✗ false</span>`
- PK row: add `border-l-2 border-l-amber-400` on the entire row
- FK indicator: show a small `→ tablename.column` in zinc-400 next to the column name
- null values: show as `<span className="text-zinc-400 italic">null</span>`
- Add column hover: highlight entire column (via JS state) when header is hovered

---

### 3.11 ER Diagram (database/ERDiagram.tsx)
**Status: CRITICAL FIX — add relationship lines**

**Problems:**
- Tables shown as floating cards with NO visual lines connecting them
- FK columns say "FK" but there's nothing showing what they link to
- This makes the "E-R" part of ER Diagram meaningless

**Changes:**
- Render as an SVG overlay that draws lines between FK columns and their referenced PK columns
- Line style: curved bezier path, 2px stroke, colored per relationship pair (each FK→PK pair gets a unique color from a small palette)
- Arrowhead: small triangle at the FK end (many side), filled circle at the PK end (one side) → crow's foot notation simplified
- When user clicks a table: highlight only that table's relationships (dim others to opacity-30)
- When user clicks a FK column row: highlight just that one line in blue
- Lines must re-render when layout changes (use `useEffect` with ResizeObserver or simple ref-based calculation)

**Implementation approach:**
```
1. After component mounts, use refs to get pixel positions of each FK/PK cell
2. Calculate bezier control points: start at right edge of source table, end at left edge of target table
3. Render as <svg> absolutely positioned over the whole component
4. Each path: stroke-dasharray animated on mount (draws itself in over 600ms)
```

---

### 3.12 Sequence Diagram (architecture/SequenceDiagram.tsx)
**Status: Keep, reduce height, slow down animation**

**Problems (from user):**
- Height too tall — shrink default examples
- Animation plays too fast

**Changes:**
- Reduce `defaultProps` message list to max 5-6 messages (not 7-10)
- Change auto-play delay between messages from current value to `1200ms`
- Participant lane headers: add icons based on type (`Monitor` for client, `Server` for server, `Database` for database, `Zap` for service/cache)
- Message arrows: thicker line (2px), better arrowheads
- Active step highlight: the current message arrow gets a `bg-blue-50 dark:bg-blue-950` highlight bar

---

### 3.13 Load Balancer (architecture/LoadBalancer.tsx)
**Status: Good structure, fix icons**

**Problems:**
- Backend boxes don't have icons that indicate what they are (servers? clients?)
- No icon showing what connects to the LB (browser? mobile?)

**Changes:**
- Add `Monitor` icon for "client" traffic source at top of the diagram
- Each backend: add `Server` icon inside the backend box
- Healthy backend: green `Server` icon
- Unhealthy backend: red `Server` icon with `ZapOff` overlay
- Draining backend: amber `Server` icon
- Algorithm badge: color it per algo (round-robin=blue, weighted=violet, least-conn=emerald, ip-hash=amber)
- Request animation: when "Send Request" fires, animate a dot from the top client icon → gateway → one backend (proper route based on algorithm)

---

### 3.14 OAuth Flow (auth/OAuthFlow.tsx)
**Status: REDESIGN — fix height instability, slow down, improve visuals**

**Problems:**
- Card height changes dramatically between steps (1/5 vs 3/5)
- Transitions are instant (no animation between steps)
- Technical HTTP request details shown raw without context

**New design:**
- **Fixed height card** — use `min-h-[420px]` on the main area, never change
- Participants shown as icons at top (not just text labels):
  - Browser: `Monitor` icon
  - Auth Server: `Shield` icon
  - Your App: `Server` icon
  - Resource API: `Database` icon
- The arrow for each step: animated using CSS `stroke-dashoffset` that draws from source to target over `800ms`
- Between steps: `1500ms` delay if auto-playing, clear manual Next/Back buttons
- Code block: fixed height `h-28 overflow-y-auto`, always shows step-specific request/response
- Plain English label ABOVE the code block: "Your app redirects the browser to the auth server login page"
- Progress dots at bottom: filled circles, smooth transition

---

### 3.15 DNS Lookup (networking/DnsLookup.tsx)
**Status: REDESIGN — visual resolver chain with icons**

**Problems:**
- All text, numbered list — dry and technical
- No visual separation between query and response phases
- No icons to make the resolver types immediately recognizable

**New design — visual hop diagram:**

```
┌──────────────────────────────────────────────────────────────┐
│ 🌐 DNS Lookup                            A record  [Resolve] │
│ api.example.com                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ [💻 App] → [🖥 Stub] → [🔄 Recursive] → [🌍 Root]         │
│                                         → [.com NS]         │  
│                                         → [Auth NS]         │
│                                                              │
│  Step 3/7: Recursive Resolver asks Root Nameserver          │
│  "Who handles .com domains?"                                 │
│  ← Answer: a.gtld-servers.net                               │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  ✓ Resolved: 93.184.216.34          TTL: 300s   39ms total │
└──────────────────────────────────────────────────────────────┘
```

**Implementation:**
- Top visual: horizontal chain of icon+label boxes connected by arrows
- Currently-active hop: highlighted box (blue border + background)
- Arrows between hops: animated dot traveling along the line (query=blue dot going right, response=green dot going left)
- Step text area: fixed height, shows plain-English explanation + the actual query/answer in a small code block
- "Resolve" button: starts the animation sequence, each hop takes `1200ms`
- Final result banner: appears at bottom with green background

---

### 3.16 TLS Handshake (networking/TlsHandshake.tsx)
**Status: SIMPLIFY — remove raw technical parameters**

**Problems:**
- Shows raw cipher suite strings (`TLS_AES_128_GCM_SHA256`) that mean nothing to beginners
- Too many steps with no visual hierarchy
- No icons, all text

**New design — simplified 4-step visual:**

```
Step 1: Say Hello
  [Browser] ──"I speak TLS 1.3, here's my ciphers"──► [Server]

Step 2: Share Keys  
  [Browser] ◄──"Here's my cert, let's use X25519"── [Server]

Step 3: Verify
  [Browser] verifies cert is from a trusted CA → ✓

Step 4: Encrypted!
  [Browser] ◄══ Encrypted channel ══► [Server]
  🔒 Connection secure
```

**Implementation:**
- 4 steps only (not 8)
- Each step: large icon on left (Handshake → Key → ShieldCheck → Lock), plain English description
- The technical details (cipher suite, SNI, etc.) collapsed into "Technical details →" expandable section per step
- Step 3 (Verify): show a certificate visual — small card with issuer name + expiry
- Step 4: animate the channel becoming green + locked
- Icons between Client/Server: animate the arrow drawing itself left-to-right or right-to-left

---

### 3.17 HTTP Headers (networking/HttpHeaders.tsx)
**Status: Redesign — clear two-panel layout**

**Problems:**
- Expand arrows (chevrons) on every individual header add clutter
- The category tags on the right are small and easy to miss

**New design:**
- Two panels side by side: REQUEST (blue left border) | RESPONSE (green left border)
- Category filter pills at top of each panel: `auth` `content` `cache` `security` `custom`
- Clicking a category pill: dims all headers except that category (`opacity-40`)
- Headers: no expand arrows — show value inline, truncated with a `...` if too long, hover to see full value as tooltip
- Security headers: show a `🔒` icon prefix
- Important headers (Content-Type, Authorization, Cache-Control): slightly bolder text

---

### 3.18 Request Lifecycle (networking/RequestLifecycle.tsx)
**Status: REDESIGN — fix height instability, add icons per step**

**Problems:**
- Large text content area changes height between steps
- Step buttons are small numbered circles — not clear enough
- No icons to identify step purpose at a glance

**New design:**
- Top bar: the full URL being requested (fixed)
- Pipeline: 6 boxes in a row with icons — DNS(`Globe`) → TCP(`Cable`) → TLS(`Lock`) → HTTP(`ArrowUpRight`) → Server(`Server`) → Response(`CheckCircle`)
- Clicking a box: that box highlights, bottom panel shows fixed-height explanation
- Bottom explanation panel: `min-h-[160px]` — NEVER changes height
- Auto-play mode: advance through steps with `1200ms` delay, animate the active box
- Show timing badges on each step: "~30ms" shown below each box

---

### 3.19 Cloud Function (cloud/CloudFunction.tsx)
**Status: ADD INTERACTIVITY — it's currently a static info card**

**Problems:**
- Shows metrics but nothing happens — no way to "see" the function run
- Cold start is a key concept but there's no animation showing it

**New design — add "Invoke" button with execution visualization:**

```
┌──────────────────────────────────────────────────────┐
│ ⚡ process-payment  [AWS Lambda] ✓ success  [Invoke] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ Execution Timeline                            │   │
│  │ ████████████░░░░░░░░░░░░░░  142ms / 30s      │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Cold Start  ▓▓▓░░░░  → Warm execution  ▓▓░░░░     │
│              ~748ms              ~142ms             │
│                                                      │
│  Duration    Memory     Invocations   Error Rate    │
│  142ms       512 MB     48,291        0.0%          │
│                                                      │
├──────────────────────────────────────────────────────┤
│  Trigger: [HTTP] → [Lambda] → [Response]            │
└──────────────────────────────────────────────────────┘
```

**Implementation:**
- "Invoke" button: triggers an animation:
  - If first invocation: cold start animation (bar fills slowly to 748ms, then execution fills in 142ms)
  - Subsequent invocations: just the execution bar animation
  - Result shown at bottom: success=green or error=red
- Trigger flow: `[HTTP Client icon] → arrow → [Lambda icon] → arrow → [Response icon]`
- Arrow animates a dot traveling source → lambda → response
- Stats update after each invocation (invocations counter increments)

---

### 3.20 Docker Container (containers/DockerContainer.tsx)
**Status: ADD VISUAL HIERARCHY — make it beginner-friendly**

**Problems:**
- Pure info card with no visual hierarchy — looks like a settings page
- Beginners don't understand what ports/volumes mean

**Changes:**
- Add a clear visual: container box (dashed border) containing the process name + image
- Port mappings: show as `[8080] → [8080]` with an arrow, labeled "host → container"
- Volume mappings: show as folder icon + path
- CPU/Memory: animated progress bars (not text percentages)
- Status: Running=green pulsing dot, Stopped=gray dot, Exiting=amber dot
- Add a brief tooltip on hover for technical terms: "Ports" → "How the container exposes services to the outside world"

---

### 3.21 Kubernetes Pod (containers/KubernetesPod.tsx)
**Status: ADD VISUAL — show containers inside the pod**

**Problems:**
- No visual showing that a pod contains containers
- Resource limits shown as text, not as visual bars

**New design:**
- Show a large "Pod" box (dashed border, larger)
- Inside it: each container shown as a smaller box with its icon, name, image
- Container state: colored left border (running=emerald, waiting=amber, terminated=red)
- CPU/Memory: progress bar (used/limit) with colored fill (green<50%, amber<80%, red>80%)
- Labels: shown as colored pills in a pill group
- Pod IP and Node: shown with `Network` and `Server` icons respectively

---

### 3.22 Kubernetes Deployment (containers/KubernetesDeployment.tsx)
**Status: MAKE ROLLING UPDATE VISUAL**

**Problems:**
- The hierarchy is good but rolling update animation is unclear

**Changes:**
- Show pods as actual pod icons in a row
- Rolling update: animate old pods fading out left-to-right while new pods fade in
- Use `transition-opacity duration-700` and staggered delays (`delay-[0ms]`, `delay-[200ms]`, etc.)
- Add a progress bar showing "2/3 replicas updated"
- Add a clear "Rolling Update" vs "Recreate" explanation banner at the top

---

### 3.23 Kafka Topic (distributed/KafkaTopic.tsx)
**Status: REDESIGN — make partitions more visual**

**Problems from image:**
- Offset numbers (`@1000`, `@1001`) as tiny boxes mean nothing to a beginner
- Consumer groups show just a dot and "up to date" — too abstract

**New design:**
- Producer shown with `Radio` icon on the left, animated broadcast rings when producing
- Partitions: show as horizontal lanes (not boxes of numbers), each lane is a scrolling conveyor belt
- New messages: appear as colored pills sliding into the lane from the left, existing messages shift right and fade out
- Consumer group position: shown as a "reading head" pointer on each partition lane
- Lag: shown as gap between the write head and read head (visual gap, colored amber if lagging)
- Consumer "consume" action: moves the reading head forward with animation
- Keep the "+ Produce" button — it's good

---

### 3.24 Cache Visualizer (distributed/CacheVisualizer.tsx)
**Status: ADD HIT/MISS ANIMATION**

**Problems from image:**
- Good structure but no visual feedback when you GET a key
- TTL values don't feel real-time

**Changes:**
- GET action: when a key is accessed, it flashes green (HIT) or red+fills with new value (MISS)
- HIT flash: `ring-2 ring-emerald-400` + brief scale-up `scale-105` + back to normal, `duration-500`
- MISS: the slot briefly shows "MISS" in red, then animates the new value filling in
- LRU eviction: when a new entry is added and cache is full, the least-recently-used row slides out left and the new one slides in from the right
- TTL countdown: show a thin progress bar under each key that depletes over the TTL duration (use `useEffect` interval)
- Hit count badge: update in real-time with a brief `scale-110` animation

---

### 3.25 Circuit Breaker (distributed/CircuitBreaker.tsx)
**Status: Add clearer state transition animation**

**Problems:**
- State change (Closed → Open → Half-Open) needs a more dramatic visual
- Beginners don't understand what "Closed" vs "Open" means for a circuit breaker

**Changes:**
- Add a literal circuit breaker icon visual: connected wires that "break" when Open
- Closed state: green connected circuit (wires touching) → `CheckCircle` styled
- Open state: red broken circuit (gap in wires) → `ZapOff` styled with red glow
- Half-Open: amber circuit with dashed line
- State transition animation: `duration-700` with a "breaking" visual effect
- Add a one-line explainer: "Closed = requests pass through. Open = all requests blocked. Half-Open = testing if service recovered."
- Keep the simulate button and failure counter

---

### 3.26 Retry Policy (distributed/RetryPolicy.tsx)
**Status: REDESIGN — vertical timeline, not horizontal blocks**

**Problems from image:**
- Horizontal attempt blocks don't clearly show the wait time concept
- The blocks take up too much horizontal space and wrap on narrow screens

**New design — vertical timeline:**

```
● Attempt 1 → ✗ Failed (5xx)
│   ⏱ Wait 0.5s
● Attempt 2 → ✗ Failed (timeout)  
│   ⏱ Wait 1.0s
● Attempt 3 → ✓ Success!
```

**Implementation:**
- Vertical list of attempt rows
- Each attempt row: circle indicator (gray=pending, blue=in-progress spinning, green=success, red=failed) + label + result
- Between attempts: a horizontal line showing the wait duration (line length proportional to wait time)
- Simulate button: plays each attempt in sequence with realistic delays (not real-time — just 600ms per visual step)
- Final status banner at bottom (green success / red exhausted)
- Keep the strategy/backoff settings row

---

### 3.27 Data Pipeline (distributed/DataPipeline.tsx)
**Status: ADD ANIMATED DATA FLOW**

**Problems:**
- "Cringe" per user — too static, no sense of data flowing

**New design:**
- Horizontal stages: Source → Transform → Sink (with icons)
- Data flows as animated "records" (small colored pills) traveling through the stages
- Each stage: shown as a box with an icon and label
  - Source: `Database` icon
  - Transform: `Settings` or `Filter` icon
  - Sink: `Server` icon
- When "Run" is clicked: records animate flowing through, count increments
- Show throughput (records/sec) as a live-updating number
- Failed records: show as red pills that exit to a "Dead Letter" box below the main flow

---

### 3.28 Event Bus (distributed/EventBus.tsx)
**Status: ADD ANIMATED MESSAGE TRAVEL**

**Problems from image:**
- Three columns (publishers, topics, subscribers) — static, no animation
- Clicking an event badge does nothing visually clear

**Changes:**
- When user clicks an event badge on a publisher:
  1. The event badge pulses (scale-110, 200ms)
  2. An animated dot travels from the publisher box → topic (center, 600ms)
  3. Relevant subscriber boxes that are subscribed to that topic: their borders light up green + pulse
  4. A small "received" toast appears on each matching subscriber
- Use `requestAnimationFrame` or CSS animation for dot travel
- Lines connecting publishers → topics → subscribers: show as SVG paths that highlight during travel
- Non-matching subscribers: dim to opacity-40 during the animation

---

### 3.29 Service Mesh (distributed/ServiceMesh.tsx)
**Status: REDESIGN — add icons, make connections visual**

**Problems from image:**
- Service boxes are plain white rectangles with text — no icons
- "proxy ×2" means nothing to a beginner
- No visual connections between services (lines/arrows)
- Flow section at bottom is just text

**New design:**
- Each service: rounded card with a `Server` or `Cpu` icon + name + status dot
- Draw SVG lines connecting services that have traffic between them
- Line thickness proportional to RPS
- Animated dots traveling along lines showing live traffic
- Sidecar proxy: shown as a small `Shield` icon badge on each service card corner
- mTLS indicator: line color changes to gold/yellow + lock icon badge when mTLS active
- "Send traffic" button: sends an animated packet through a highlighted path
- Unhealthy service: red border + `XCircle` icon + connected lines turn dashed red

---

### 3.30 Queue Visualizer (distributed/QueueVisualizer.tsx)
**Status: Keep, improve visuals**

User loves this. Small improvements:
- Producer: show `Server` icon labeled with `producerLabel`
- Consumer: show `Cpu` icon labeled with `consumerLabel`
- Messages in queue: show as cards with a small icon (envelope/`Mail`) and a brief message preview
- When producing: animate the new message sliding into the back of the queue
- When consuming: animate the front message sliding out toward the consumer icon
- Add a capacity indicator bar showing how full the queue is

---

### 3.31 CI/CD Pipeline (devtools/CiPipeline.tsx)
**Status: Add icons per stage type**

**Changes:**
- Install stage: `Package` icon
- Test stage: `TestTube` icon (or `CheckSquare`)
- Build stage: `Hammer` icon (or `Wrench`)
- Deploy stage: `Rocket` icon
- Each step result: ✓ (green), ✗ (red), ⟳ (amber spinning), ⧖ (gray pending)
- Failed step: show the log with a red left-border panel, monospace text
- Overall pipeline: show a horizontal progress indicator at the top

---

### 3.32 Comparison Table (ui/ComparisonTable.tsx)
**Status: Fix visual appearance**

**Problems (user says "looks shit"):**
- Likely too much whitespace or wrong color usage

**Changes:**
- Header row: `bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900` (inverted colors, bold)
- Feature rows: alternate `bg-white` / `bg-zinc-50` for readability
- ✓ values: `text-emerald-600 font-semibold`
- ✗ values: `text-zinc-300 dark:text-zinc-600`
- Partial: `text-amber-500`
- Winner column: add a subtle `ring-2 ring-blue-200 dark:ring-blue-800` around the best column

---

### 3.33 AI Components (ModelCard, PromptTemplate, TokenCounter)
**Status: IMPROVE significantly**

User says: "The AI/ML ones are really bad and right now we have very limited components"

#### ModelCard:
- Add an actual model diagram: show the architecture (transformer blocks, layers) as a simple visual
- Add benchmark comparison bars (accuracy vs. others)
- Context window: show as a visual ruler with the filled portion

#### PromptTemplate:
- System/User/Assistant blocks: color-code them distinctly (system=violet, user=blue, assistant=emerald)
- Variables: highlight `{{variable_name}}` in amber inside the prompt text
- "Fill variables" mode: show input fields inline
- Copy button prominent

#### TokenCounter:
- Color-code tokens visually (each token gets a different background color in the text)
- Context window meter: show as a progress bar with danger zones (>80%=amber, >95%=red)
- Cost estimate: show per-model comparison

---

## 4. Components to Remove

Remove from registry (they add noise without value in current form):
1. `state-machine` — remove from registry; concept covered by sequence diagram
2. `request-lifecycle` — keep but rebuild per spec above
3. `http-headers` — keep but redesign per spec above

---

## 5. Components to Add (New)

These concepts are missing and would make TechUI much more complete:

### 5.1 `cors-policy` (api category)
Show browser → server with CORS preflight flow. Visual: Browser sends OPTIONS, server replies with headers, then actual request allowed/blocked.

### 5.2 `jwt-flow` (auth category) 
Show the full JWT lifecycle: issue → transmit → verify — as an animated flow connecting 3 boxes (Auth Server → Client → API Server). Different from the current JWT Viewer which just decodes tokens.

### 5.3 `database-index` (database category)
Show a table scan vs index lookup. Side by side: sequential scan (cursor moving through all rows) vs B-tree index (jumping directly to the row). Animate the scan.

### 5.4 `connection-pool` (database category)
Show N database connections shared among M application instances. Visual: pool box in center with connection slots; requests queue up when all slots are busy.

### 5.5 `cdn-edge` (cloud category)
World map (simple SVG) showing CDN edge nodes. Click a region → request animates to nearest edge → cache hit (fast, green) or miss → origin (slower, amber).

### 5.6 `ab-test` (ui category)
Show traffic split: 50% see version A, 50% see version B. Visual: users icon → splitter → two variant boxes with different UIs. Show conversion rates updating.

---

## 6. Execution Plan for Sub-Agents

### How to run improvements in parallel

Split work into 5 independent batches. Each batch touches different component files:

**Batch A — API components** (1 sub-agent):
- `api/WebhookEvent.tsx` (redesign)
- `api/PaginationPattern.tsx` (redesign)
- `api/ApiGateway.tsx` (redesign)
- `api/WebSocketConnection.tsx` (redesign)
- `api/GraphQLQuery.tsx` (spacing + run button)
- `api/HttpEndpoint.tsx` (borders)

**Batch B — Architecture + Database** (1 sub-agent):
- `database/ERDiagram.tsx` (CRITICAL: add relationship lines)
- `database/DatabaseTable.tsx` (hover, boolean icons)
- `architecture/ArchitectureDiagram.tsx` (animated arrows, click-to-detail)
- `architecture/LoadBalancer.tsx` (proper icons)
- `architecture/SequenceDiagram.tsx` (height + speed)
- Remove `architecture/StateMachine` from registry

**Batch C — Networking** (1 sub-agent):
- `networking/DnsLookup.tsx` (visual hop diagram)
- `networking/TlsHandshake.tsx` (simplify to 4 steps)
- `networking/HttpHeaders.tsx` (two-panel redesign)
- `networking/RequestLifecycle.tsx` (fix height, add icons)

**Batch D — Distributed systems** (1 sub-agent):
- `distributed/KafkaTopic.tsx` (visual lanes)
- `distributed/CacheVisualizer.tsx` (hit/miss animation)
- `distributed/RetryPolicy.tsx` (vertical timeline)
- `distributed/EventBus.tsx` (animated message travel)
- `distributed/DataPipeline.tsx` (animated records)
- `distributed/ServiceMesh.tsx` (icons, SVG connections)
- `distributed/QueueVisualizer.tsx` (icons, message cards)

**Batch E — Cloud + Containers + Auth + AI** (1 sub-agent):
- `cloud/CloudFunction.tsx` (add invoke + animation)
- `containers/DockerContainer.tsx` (visual hierarchy)
- `containers/KubernetesPod.tsx` (show containers inside pod visually)
- `auth/OAuthFlow.tsx` (fix height, slow down)
- `auth/ApiKey.tsx` (simplify)
- `ai/ModelCard.tsx`, `ai/PromptTemplate.tsx`, `ai/TokenCounter.tsx` (improve all three)

---

## 7. How Each Sub-Agent Should Work

### Before writing any code:
1. Read the target component file fully
2. Read the Zod schema to understand what props exist
3. Read the registry entry in `src/registry/index.ts` for `defaultProps` and `examples`
4. Understand the existing structure before replacing it

### While writing:
- Follow the design system in Section 2 strictly
- Use `transition-all duration-500` (minimum) for any state change
- Never allow height to change during interaction — add `min-h-[...]`
- Always use lucide-react icons (they're already installed)
- Dark mode: use Tailwind `dark:` variants, never inline styles for colors
- No new dependencies — use what's already in the project

### After writing:
- Verify the Zod schema still matches all props used in the component
- Verify `defaultProps` in the registry entry showcases the new design well
- Verify `examples` array has 2-3 good examples that demonstrate different states
- Run `npm run build` to check for TypeScript errors

### Code quality rules:
- No comments explaining WHAT the code does
- No `console.log` left in
- Max file length: 500 lines — if longer, extract small pure sub-components within same file
- Use `useState`, `useEffect`, `useRef`, `useMemo` from React — no external state libraries

---

## 8. Testing Each Component

The "beginner test" — before submitting:
1. Look at the component for 3 seconds without reading any text. Can you tell what it represents?
2. Is there exactly ONE obvious interactive action (button/click target)?
3. Does clicking that action produce a satisfying, visible change?
4. Is the transition smooth and not instant?
5. Does the card height stay the same throughout interaction?
6. Are there proper icons that hint at the concept (not just text)?

If any answer is "no" — revise before submitting.
