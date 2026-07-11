---
name: Sukaspace Precision System
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3f4850'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#707881'
  outline-variant: '#bfc7d2'
  surface-tint: '#006398'
  primary: '#006194'
  on-primary: '#ffffff'
  primary-container: '#007bb9'
  on-primary-container: '#fdfcff'
  inverse-primary: '#93ccff'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#894d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#ac6200'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#ffdcc0'
  tertiary-fixed-dim: '#ffb875'
  on-tertiary-fixed: '#2d1600'
  on-tertiary-fixed-variant: '#6b3b00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  hero-display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.025em
  hero-display-mobile:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  heading-section:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  ui-header:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: '0'
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-gap: 64px
---

## Brand & Style
The design system is engineered for high-utility professional environments, balancing the structured rigor of an enterprise SaaS with the inviting clarity of a premium educational platform. It prioritizes information density and legibility, catering to a target audience of professionals, educators, and serious learners.

The aesthetic follows a **Corporate Minimalist** approach. It is characterized by high-contrast typography, generous whitespace (utility-driven spacing), and a strict adherence to a flat, linear architecture. Inspiration is drawn from technical documentation and high-end productivity tools, ensuring the UI feels like a dependable instrument rather than a decorative interface. The emotional response should be one of "effortless productivity" and "intellectual clarity."

## Colors
The palette is strictly restricted to a professional "Slate and Ocean" theme. Dark mode is intentionally excluded to maintain a paper-like, scholarly atmosphere.

- **Primary (Ocean Blue):** Used for primary actions, active navigation states, and progress indicators.
- **Success (Emerald Green):** Reserved for completion states, achievement badges, and secondary "Call to Action" triggers.
- **Neutrals:** A range of Slate grays provides the structural framework. #0F172A (Slate-900) ensures maximum contrast for readability, while #E2E8F0 (Slate-200) defines the 1px boundaries that separate content modules.
- **Background Strategy:** Surfaces use #FFFFFF to stand out against the #F8FAFC page background, creating a subtle, clean layering effect without relying on heavy shadows.

## Typography
This design system utilizes a Neo-Grotesk stack centered on **Inter**. The typography is the primary driver of hierarchy.

- **Headlines:** Use tight letter-spacing (`tracking-tight`) to give headers a modern, "designed" feel. 
- **Readability:** Body text utilizes a generous line-height (1.5x) to ensure long-form course content remains legible during extended study sessions.
- **Utility:** Use `label-caps` for metadata, small section headers, and "overlines" above main titles.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. Content is centered within a 1280px max-width container on desktop, while maintaining fluid margins on smaller viewports.

- **The 1px Rule:** All containers, cards, and input fields must use a consistent 1px border (#E2E8F0). Do not use varying border widths.
- **Grids:** Use a 12-column grid for dashboards and community feeds.
- **Rhythm:** Spacing follows an 8px base unit. Use `stack-lg` (32px) to separate distinct content blocks (e.g., a video player from its description) and `section-gap` (64px) for vertical padding between major page sections.

## Elevation & Depth
In alignment with the "Flat UI" philosophy, this design system avoids traditional elevation. Depth is communicated through **Tonal Separation** and **Low-Contrast Outlines**.

- **Z-Axis:** Instead of using shadows to lift elements, use the contrast between the #F8FAFC background and #FFFFFF surfaces.
- **Shadows:** Use a single, extremely subtle shadow for interactive components like cards or dropdowns: `0 1px 2px 0 rgba(15, 23, 42, 0.05)`.
- **Hover States:** Elements do not "lift" on hover; instead, borders should darken slightly or the background should shift to a very subtle gray (#F1F5F9).

## Shapes
The design system employs a consistent `rounded-xl` (12px) corner radius for all primary containers, including cards, modal windows, and course thumbnails. 

- **Small Components:** Buttons and input fields should use a slightly reduced radius (8px) to maintain visual harmony with their smaller scale.
- **Consistency:** Rounding is applied to both the container and any internal elements (like top-aligned images) to ensure a nested, professional look.

## Components
Consistent styling for core platform elements:

- **Buttons:** 
  - *Primary:* Solid Ocean Blue (#0284C7) with white text. 
  - *Secondary:* White background, Slate-200 border, Slate-900 text.
  - *Interaction:* Use Framer Motion spring (stiffness: 400, damping: 30) for scale-down effects on tap (e.g., `whileTap={{ scale: 0.98 }}`).
- **Input Fields:** 1px border (#E2E8F0), 8px rounding, and a focus state that uses a 1px Primary Blue border with a 3px soft blue outer halo.
- **Cards:** White background, 1px border, 12px rounding. No heavy shadows. Use for course modules and community posts.
- **Chips/Badges:** Small, semibold text with a light background tint (e.g., Emerald Green at 10% opacity for success badges).
- **Navigation:** Vertical sidebar for "App" views with clear, high-contrast icons and 16px font-size links. Horizontal navigation for "Marketing/Course" landing pages.