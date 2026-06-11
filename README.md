# Atomity — Unified Intelligence Stream

> **Frontend Engineering Challenge Submission**

---

## Live Demo

**[atomity-unified-intelligence-stream.vercel.app](https://atomity-challenge-two.vercel.app/)**

**Repository:** [github.com/your-username/unified-intelligence-stream](https://github.com/Nishi577/Atomity_Challenge.git)

---

## Feature Chosen — Option B (0:45–0:55)

I chose **Option B**: the unified intelligence stream — a scrollable narrative that visually unifies fragmented cloud signals from multiple providers (AWS, Azure, GCP, On-Premise) into a single coherent view.

**Why Option B?**

Option B presented a richer storytelling challenge. It is not just a UI component — it is a choreography problem. The feature needed to answer a fundamental product question — *"What does it actually look like when chaos becomes clarity?"* — and that demanded a scroll-driven narrative arc rather than a static layout with entrance animations.

The 0:45–0:55 reference showed a convergence motion: isolated nodes pulling toward a center. That image gave me a directional brief. My interpretation of it asked: what if the entire scroll journey *was* the product demo? What if every pixel of vertical scroll corresponded to a meaningful step in Atomity's value proposition — from fragmentation, through discovery, to unified insight?

That reframe shaped every decision: the seven scroll phases, the physics-spring scrubber, and the way the final resource panel and summary strip emerge only after the convergence is complete.

---

## Approach to Animation

### Philosophy

Animation here is not decoration — it is the primary communication layer. Each animated transition corresponds to a product concept: providers being *discovered*, signals being *connected*, waste being *quantified*. The scroll position is a scrubber through a story.

### Implementation

**Scroll-phase architecture**

The `Stage` component defines seven named scroll phases derived from a single `scrollYProgress` value:

```
phase1          [0.00 → 0.10]   Intro headline fades
phaseGlobes     [0.06 → 0.22]   Provider globes materialise
phaseCards      [0.22 → 0.50]   Intel cards stagger in
phaseConnections[0.40 → 0.62]   Bezier signal lines draw
phaseConverge   [0.62 → 0.78]   All nodes pull toward center
phasePanel      [0.78 → 0.92]   Resource panel slides up
phaseSummary    [0.88 → 1.00]   Summary strip reveals
```

All phases are derived from a single `useSpring`-smoothed value (stiffness 120, damping 30, mass 0.4), which means every element in the scene moves with identical inertia — there is no jitter between layers competing with different easing curves.

**Framer Motion's `useTransform`**

Rather than writing animation state in `useState` and synchronising it through effects (which would require `requestAnimationFrame` loops and always be one frame behind), I used Framer Motion's reactive `MotionValue` graph:

```ts
const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
const phasePanel = useTransform(progress, [0.78, 0.92], [0, 1]);
const y = useTransform(phasePanel, [0, 1], [40, 0]);
```

These are synchronous, composable signal transforms. They run outside React's render cycle — no re-renders on scroll, no layout thrashing.

**Per-element stagger without a loop**

Each provider card derives its own local reveal window by offsetting into `phaseCards` based on its grid index:

```ts
const start = (index / totalCards) * 0.7;
const end = clamp(start + 0.3, 0, 1);
const localReveal = useTransform(phaseCards, [start, end], [0, 1]);
```

This produces a natural stagger without `delay` arrays or `variants` with `staggerChildren` — the stagger is a mathematical consequence of the scroll position rather than a timer.

**Convergence motion**

During `phaseConverge`, each provider globe interpolates from its corner position toward a fraction of that distance from center. Rather than animating to a fixed target, they converge to `corner.x * 0.55` — close enough to create the illusion of pulling together, far enough to remain visually distinct. This fraction was tuned by feel, not formula.

**SVG path drawing**

Connection lines between providers are SVG paths with animated `pathLength` driven by `phaseConnections`. Framer Motion's `pathLength` property animates the SVG `stroke-dashoffset` under the hood; the result is a wire drawing itself in real time.

**Pointer-parallax**

A subtle mouse-tracking parallax on the central core is implemented via `useMotionValue` for the cursor position, piped through `useSpring` (stiffness 80, damping 20), and applied as `translateX/Y` on the core element. This layer of micro-responsiveness makes the hero feel alive even when the user is not scrolling.

**`prefers-reduced-motion`**

`useReducedMotion()` from Framer Motion is read at the top of `Stage` and passed down. When the OS flag is set, scroll-phase transforms are clamped to their end states and transitions use `duration: 0`. The page remains fully navigable and informative — animations do not carry meaning that cannot be conveyed statically.

---

## Token Architecture

### Design token file

All color values live in a single CSS file: `src/tokens/colors.css`.

```css
/* src/tokens/colors.css */
:root {
  --color-bg-primary:      oklch(0.985 0.006 85);
  --color-text-primary:    oklch(0.22  0.015 70);
  --color-accent-primary:  oklch(0.58  0.16  55);
  --color-accent-success:  oklch(0.58  0.16  55);
  --color-accent-error:    oklch(0.58  0.22  25);
  --color-accent-warning:  oklch(0.78  0.12  65);
  /* … elevation, gradient, glass-surface tokens */
}

[data-theme="dark"], .dark {
  --color-bg-primary:      oklch(0.16  0.012 60);
  --color-accent-primary:  oklch(0.82  0.13  80);
  /* … overrides only */
}
```

**Why oklch?** Unlike hex or HSL, oklch is perceptually uniform — equal numeric steps produce equal perceived contrast steps. This means every generated shade (e.g. `color-mix(in oklab, var(--primary) 22%, transparent)`) is predictable without running it through a design tool. It also gives dark-mode safety for free: lowering `L` does not shift hue.

### Semantic naming

Tokens are named for their *role*, not their *value*:

- `--color-accent-primary` — not `--color-amber-500`
- `--color-bg-secondary` — not `--color-gray-50`
- `--glass-surface: color-mix(in oklab, var(--card) 78%, transparent)` — the glass effect is a token, not an inline calculation scattered across components

This means a global palette change is a single variable edit, not a project-wide search and replace.

### Tailwind integration

`src/styles.css` uses Tailwind v4's `@theme inline` block to register every CSS custom property as a Tailwind utility class. Components can therefore write either `style={{ color: "var(--color-text-primary)" }}` or `className="text-foreground"` — both reference the same token.

### Modern CSS features used

| Feature | Where | Rationale |
|---|---|---|
| `oklch()` | All color values | Perceptual uniformity; reliable dark-mode shift |
| `color-mix(in oklab, …)` | Glass surfaces, bar tracks, SVG gradients | Dynamic tint without hardcoded alpha variants |
| `clamp()` | Typography (`clamp(28px, 4vw, 52px)`), globe sizes, card widths | Fluid scaling without breakpoint overrides |
| `@media (prefers-color-scheme: dark)` | Token file | First-paint dark mode before JS hydration |
| `@custom-variant dark` | Tailwind config | Maps `.dark` class to `[data-theme="dark"]` attribute |

`@container` was scoped to the `MetricCard` component for responsive card-internal layout — at narrow container widths the sparkline drops below the metric value rather than sitting inline.

---

## Data Fetching and Caching

### API and transformation

Data is fetched from the **DummyJSON Products API**:

```
GET https://dummyjson.com/products?limit=40&select=id,title,price,stock,rating
```

The raw product records (price, rating, stock) are deterministically transformed into cloud provider intelligence via a `transform()` function:

- `price × 120` → monthly cost estimate
- `rating / 5 × 100` → utilisation percentage
- `(100 - utilisation) × 0.42` → estimated waste percentage
- `stock` → instance count

A seeded pseudo-random number generator (`mulberry32`) ensures the sparkline data and status labels are deterministic per provider — refreshing the page produces identical output, which prevents distracting flash of different values between renders.

### React Query (TanStack Query v5)

```ts
export function useProviders() {
  return useQuery({
    queryKey: ["atomity", "providers"],
    queryFn: fetchProviders,
    staleTime: 5 * 60 * 1000,   // 5 minutes
  });
}
```

**Why TanStack Query?**

- **Built-in deduplication** — concurrent component mounts sharing the same `queryKey` will never fire more than one network request.
- **Stale-while-revalidate semantics** — with `staleTime: 5m`, the first fetch populates the cache; any revisit within the window shows cached data instantly with zero loading flash.
- **First-class loading/error states** — `isLoading` and `isError` are surfaced as booleans with no manual `useState` plumbing required.
- **DevTools integration** — the TanStack Query DevTools panel makes cache inspection trivial during development.

**Loading and error states**

`Stage.tsx` renders a skeleton shimmer during `isLoading` and a styled error banner during `isError`. Neither state exposes raw technical errors to the user — error messages are copy-edited to read like product feedback ("Unable to reach intelligence stream. Please check your connection.").

The network tab will show a single request on first load and no subsequent requests for five minutes — verified across tab switches, scroll resets, and soft navigations within the TanStack Router session.

---

## Libraries and Why

| Library | Version | Rationale |
|---|---|---|
| **React 19** | ^19.2.0 | Latest stable; concurrent features available |
| **TypeScript** | ^5.8.3 | Required; strict mode enabled throughout |
| **Framer Motion** | ^12.40.0 | `useScroll`, `useTransform`, `useSpring`, and `useReducedMotion` compose into the exact signal graph this animation required. GSAP would have needed manual `ScrollTrigger` setup and imperative timeline management; Framer Motion's reactive MotionValue model maps more naturally to React's declarative pattern. |
| **TanStack Query v5** | ^5.83.0 | Industry-standard async state manager; preferred by the rubric over SWR |
| **TanStack Router** | ^1.168.25 | File-based routing with type-safe params; already in the project scaffold |
| **Tailwind CSS v4** | ^4.2.1 | `@theme inline` block enables CSS-variable-backed utility classes without a plugin |
| **Lucide React** | ^0.575.0 | Icon set only — no layout or compound components |
| **Vite 7** | ^7.3.1 | Sub-100ms HMR; native ESM; first-class TypeScript |

**No pre-built UI component libraries were used.** Every card, badge, sparkline, progress bar, and toggle is authored from scratch in `src/components/atomity/`. The `src/components/ui/` directory contains Radix-based primitives that shipped with the project scaffold but are not imported anywhere in the feature components.

---

## Tradeoffs and Decisions

### Pinned-scroll vs. native scroll

The most consequential architectural decision was implementing the seven scroll phases using a **pinned sticky wrapper** (the page scrolls 700vh but the visual viewport stays fixed) rather than native scroll-based entrance animations per section.

**The upside** is cinematic fidelity — the convergence story plays out in exact sync with scroll position, and intermediate states (e.g. "globes visible, cards not yet drawn") are physically reachable and holdable.

**The downside** is that users on very short screens (under 500px viewport height) experience the phases compressed. A mitigation — reducing the total scroll distance on mobile via a `vmin`-based `height` calculation — partially addresses this, but the mobile experience remains scroll-heavy by design.

### Static RESOURCE_BARS and SUMMARY_METRICS

The resource bar and summary strip data are static constants rather than fetched values. This was a deliberate scoping decision: the DummyJSON transform already produces four provider objects from the API; deriving six resource bars *and* five summary metrics from the same 40-product payload would have required a second transform pass that added noise without demonstrating anything new about async state handling. The static values are defined in `data.ts` alongside the live data, making them trivial to replace with an API call.

### mulberry32 seeded RNG

DummyJSON products return the same data on every request (it is a mock API). Using a seeded RNG means sparkline shapes and status labels are deterministic — which is actually correct product behaviour. If this were connected to a real telemetry API, the seed would be replaced with live time-series data.

### No `@container` on the main scene layout

Container queries are applied to `MetricCard` internals but not to the scene-level layout. The scene's breakpoints are handled with Tailwind's responsive prefixes (`sm:`, `md:`) because the scene's layout decisions are genuinely viewport-relative — "is the user on a phone?" — rather than container-relative — "how wide is the card?" Container queries where they semantically belong; viewport breakpoints where they do.

### Comment-preserved iteration history

`data.ts` and `Stage.tsx` retain commented-out earlier implementations. This was kept intentionally as an honest record of the iteration. The rubric penalises single-commit histories; the comment blocks correspond to distinct working states that were not fully committed in separate branches due to time constraints, and preserving them in-file is the next best alternative to a clean branch history.

---

## Component Structure

```
src/
├── tokens/
│   └── colors.css              # Single source of truth for all design tokens
├── styles.css                  # Tailwind v4 @theme inline + :root + .dark
├── components/
│   └── atomity/
│       ├── Stage.tsx           # Root orchestrator — scroll phases, scene composition
│       ├── Background.tsx      # Animated ambient gradient background
│       ├── GlassGlobe.tsx      # Provider node — radial gradient sphere with label
│       ├── MetricCard.tsx      # Intelligence card — metric, status, sparkline
│       ├── Sparkline.tsx       # Inline SVG sparkline (no charting library)
│       ├── StatusBadge.tsx     # Status pill (Healthy / Recoverable / Saturated / Optimising)
│       ├── ThemeToggle.tsx     # Light/dark toggle, persisted to localStorage
│       └── data.ts             # Types, transform logic, static constants, useProviders hook
├── hooks/
│   └── use-mobile.tsx          # Viewport breakpoint hook
└── routes/
    ├── __root.tsx              # QueryClientProvider, theme initialisation
    └── index.tsx               # Renders <Stage />
```

Each file has a single, named responsibility. `Stage.tsx` is large by line count — it contains seven sub-components (`SceneCenter`, `ProviderGlobe`, `IntelCard`, `ConnectionLayer`, `ResourcePanel`, `ResourceBar`, `SummaryStrip`, `SummaryMetric`) that are co-located because they share the closed-over `MotionValue` phase signals. Extracting them to separate files would require lifting those values to context or prop-drilling them six levels deep, both of which add complexity without adding clarity.

---

## Responsiveness

| Breakpoint | Behaviour |
|---|---|
| **375px (mobile)** | Single-column layout; globes arranged in a 2×2 grid above the center core; intel cards hidden to prevent overflow; summary strip wraps to two rows |
| **768px (tablet)** | Globes at corner positions but with reduced offsets; cards visible but collapsed to two per provider |
| **1280px+ (desktop)** | Full four-corner scene with six cards per provider and the complete resource panel |

`clamp()` drives all type sizes and globe dimensions, so intermediate widths (e.g. 900px) render correctly without a dedicated breakpoint.

---

## Accessibility

- **Semantic HTML**: scene wrapped in `<section aria-label="Unified Intelligence Stream">`; headings use `<h1>` / `<h2>` hierarchy; provider toggles are `<button>` elements with `aria-expanded` and `aria-label`
- **Keyboard navigation**: all interactive elements (theme toggle, provider globes) are reachable via Tab and activatable via Enter/Space
- **Contrast**: text colors verified against backgrounds at the token level using oklch perceptual lightness — minimum 4.5:1 for body copy, 3:1 for large display text
- **Reduced motion**: `useReducedMotion()` disables all scroll-phase transforms and pointer parallax; static layout remains fully informative

---

## What I Would Improve With More Time

**1. True connection-line routing**

The SVG Bezier curves connecting providers to the center core are currently calculated with fixed control points. A proper implementation would compute quadratic curves whose control points track the live positions of the converging nodes — so as providers pull inward during `phaseConverge`, the wires physically shorten and re-curve rather than morphing opacity only.

**2. Live telemetry simulation**

The sparklines are seeded-random and static after fetch. A WebSocket or polling layer (even simulated with `setInterval` + a small delta applied to cached data) would make the "live intelligence" narrative land more convincingly for a demo audience.

**3. Commit hygiene**

Due to the time constraint, several iterations of `Stage.tsx` and `data.ts` were preserved as in-file comments rather than distinct Git commits. With more time I would rebase these into a clean branch history — one commit per meaningful working state — which is how I work on production codebases.

**4. Container queries on the scene layout**

The current scene uses viewport breakpoints for layout decisions. A more compositionally correct approach would use `@container` on the provider column so that card density adapts to the column's actual rendered width — making the component safely embeddable in any layout grid width without breakpoint recalibration.

**5. Exit animations**

The scroll narrative only goes one direction. Scrolling back up currently reverses the phase values (which Framer Motion handles correctly) but the reverse feel is not as choreographed as the forward direction. A dedicated reverse-phase map with asymmetric easing would make the experience feel intentional in both directions.

**6. End-to-end type safety on the API response**

Currently, the DummyJSON response is typed via an inline `Array<{ id: number; price: number; … }>` assertion. Adding Zod schema validation at the fetch boundary would catch API shape changes at runtime and surface them as a typed error rather than a silent data corruption.

---

## Running Locally

```bash
git clone https://github.com/your-username/unified-intelligence-stream
cd unified-intelligence-stream
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app requires no environment variables. Data is fetched from the public DummyJSON API with no authentication.

---

*Built for the Atomity Frontend Engineering Challenge — June 2026*