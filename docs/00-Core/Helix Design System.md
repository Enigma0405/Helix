# Helix Design System (HELIX-DOC-007)

**Document ID:** HELIX-DOC-007

## Typography
* **Primary Font:** Inter (Clean, readable at small sizes for high information density).
* **Monospace Font:** JetBrains Mono (For logs, audit trails, and raw evidence data).
* **Scale:** 
  * Header: 24px (Bold)
  * Subheader: 16px (Semi-Bold)
  * Body: 14px (Regular)
  * Metadata/Tags: 12px (Medium)

## Color tokens
* **Background (Dark Mode):** #0D0D12
* **Surface (Glassmorphism):** rgba(255, 255, 255, 0.05) with 12px blur
* **Primary Accent:** #3B82F6 (Blue for AI actions)
* **Confidence High:** #10B981 (Green)
* **Confidence Medium:** #F59E0B (Amber)
* **Confidence Low/Risk:** #EF4444 (Red)
* **Text Primary:** #F9FAFB
* **Text Secondary:** #9CA3AF

## Spacing scale
* **Base Unit:** 4px
* **Density:** High (8px/16px padding defaults to reduce scrolling and keep decisions in view).

## Component library
*Core elements built for the workspace-centric model, prioritizing fast scanning and low cognitive load.*

## Tables
* **Style:** Borderless, compact rows (32px height), sticky headers.
* **Interactions:** Hover row highlights, one-click copy for cell data, inline status badges.

## Cards
* **Style:** 1px subtle border (#27272A), 8px border-radius, glassmorphic backgrounds.
* **States:** Default, Hover (subtle lift), Selected (Primary border), Disabled.

## Timeline components
* **Orientation:** Horizontal (scrubbable) and Vertical (event feed).
* **Nodes:** Distinct shapes for System Alarms, Human Actions, AI inferences, and Missing Evidence.

## Evidence cards
* **Structure:** Source Icon + Title + Timestamp + Confidence Badge.
* **Actions:** "View Source", "Verify", "Flag as Contradictory".

## Graph node styles
* **Entities:** Circular nodes (Equipment, Operator, SOP).
* **Edges:** Solid lines for verified links, dashed lines for AI-inferred relationships.
* **Selection:** Glowing ring effect around active node, fading out unconnected nodes.

## Runtime widgets
* **AI Status:** Pulsing indicator (Processing, Waiting, Blocked).
* **Next Best Action:** Prominent floating action button with estimated confidence increase.

## Icons
* **Family:** Lucide (or similar minimalist set) with 1.5px stroke width.
* **Usage:** Always paired with tooltips; consistent alignment with text.

## Motion tokens
* **Transitions:** 200ms ease-in-out (snappy, not sluggish).
* **AI Activity:** Subtle, continuous pulsing (ease-in-out, 1500ms cycle).
* **Graph Layout:** Spring physics for natural settling (stiffness: 170, damping: 26).

## Accessibility tokens
* **Contrast:** Minimum 4.5:1 for text, 3:1 for graphical elements.
* **Focus:** 2px solid primary ring offset by 2px.
* **Screen Readers:** Hidden descriptive spans for complex graph and timeline views.

## Figma-ready design specifications
*All tokens and components map 1:1 with the central Figma component library. No ad-hoc styles permitted in implementation.*
