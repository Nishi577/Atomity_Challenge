# Atomity: Visibility Engine

## Project Overview
Atomity is a high-fidelity frontend engineering prototype demonstrating a unified control plane for cloud infrastructure visibility. It brings together fragmented resource utilization data from multiple providers (AWS, Azure, GCP, On-Premise) into a single pane of glass using advanced scroll-driven animations and data visualization.

## Feature Chosen
**Unified Resource Convergence View**
I implemented the core "convergence" interaction, where disparate data sources are visually pulled together into a consolidated resource utilization panel.

## Why This Feature
This feature allows for a powerful demonstration of product thinking and complex frontend capabilities:
- It solves a real user problem (fragmented infrastructure visibility).
- It breaks away from standard grid/table layouts.
- It pushes the boundaries of web animation by using scroll progress to orchestrate a multi-phase, cinematic interaction rather than simple hover states.

## Animation Approach
The animation architecture is built purely on **Framer Motion**, utilizing scroll-linked physics.

* **Motion Architecture:** I bypassed standard scroll triggers and built a continuous animation timeline using `useScroll` mapped to a spring-dampened `useSpring` progress value.
* **Scroll Interactions:** As the user scrolls, the interface transitions seamlessly through 7 distinct phases (Intro, Globes, Cards, Connections, Convergence, Panel, Summary) without any abrupt jumps.
* **Progressive Disclosure:** Information density increases naturally. Provider globes appear first, followed by detail cards, connection streams, and finally the aggregated analytics panel.
* **Orbital/Globe Interactions:** The initial view features a parallax mouse-tracking environment (`useMotionValue` + `useSpring`) to give the nodes a floating, volumetric feel. Connections are drawn using animated SVG paths (`pathLength` transformation).

## Design Tokens & Styling
* **Token Organization:** Built a robust native CSS variables architecture (`styles.css`) for theming, separating structural colors from functional semantic colors (e.g., `--primary`, `--destructive`, `--muted-foreground`).
* **Styling System:** Tailwind CSS is used strictly for layout and typography, referencing custom CSS variables for colors.
* **Reusable Patterns:** Extracted shared visual treatments like `glass-panel` and `core-sphere` into CSS utility classes to reduce JSX bloat and ensure consistency.

## Data Fetching & Caching
* **Fetching Strategy:** Native `fetch` with dummy data mapped through a deterministic randomizer (`mulberry32`) to simulate stable but realistic server utilization metrics.
* **Caching Approach:** `@tanstack/react-query` manages the data layer, caching the transformed provider intelligence with a 5-minute `staleTime` to prevent unnecessary re-renders during animations.
* **Error Handling & Loading:** Handled asynchronously via React Query's `isLoading` and `isError` flags, rendering localized overlays without breaking the scroll layout.

## Libraries Used
* **Framer Motion:** Chosen over CSS animations for complex interpolation (`useTransform`) between multiple scroll phases and physics-based interactions.
* **@tanstack/react-query:** Solves the problem of async data hydration and caching, allowing the animation timeline to mount independently of the data readiness.
* **Tailwind CSS:** Accelerates layout construction while still deferring to CSS variables for strict design system adherence.
* **TanStack Start/Router:** Provides the foundation for a modern, file-based React application architecture.

## Architecture Decisions
* **Component Structure:** Kept the visual scene tightly coupled within `Stage.tsx` for performance, passing down derived `MotionValue`s to child components instead of re-rendering.
* **State Management:** Avoided global state (Redux/Zustand) completely. The animation state is pure, derived directly from the scroll position, and the data state is managed entirely by React Query.
* **Tradeoffs:** Kept all animation phases within a single scroll wrapper. While this slightly increases component complexity, it guarantees perfect synchronization between elements that standard intersection observers cannot achieve.

## Challenges Encountered
Synchronizing the SVG connection paths with HTML elements across a responsive viewport was difficult. I solved this by mapping the connections within a `0 0 100 100` viewBox with `preserveAspectRatio="none"` and transforming viewport coordinates relatively.

## Future Improvements
* Add WebGL/Three.js for the central sphere to give it true 3D volumetric rendering.
* Implement real-time WebSocket streams for the sparkline data.
* Improve accessibility for screen readers (currently highly visual).

## Setup Instructions

### Local Development
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

### Deployment
Standard deployment via Vercel  hosting platform using the generated `build` directory.
