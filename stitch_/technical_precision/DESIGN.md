---
name: Technical Precision
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#424752'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#727784'
  outline-variant: '#c2c6d4'
  surface-tint: '#115cb9'
  primary: '#003f87'
  on-primary: '#ffffff'
  primary-container: '#0056b3'
  on-primary-container: '#bbd0ff'
  inverse-primary: '#acc7ff'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fc'
  on-secondary-container: '#57657a'
  tertiary: '#722b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#983c00'
  on-tertiary-container: '#ffc2a7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e2ff'
  primary-fixed-dim: '#acc7ff'
  on-primary-fixed: '#001a40'
  on-primary-fixed-variant: '#004491'
  secondary-fixed: '#d5e3fc'
  secondary-fixed-dim: '#b9c7df'
  on-secondary-fixed: '#0d1c2e'
  on-secondary-fixed-variant: '#3a485b'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb694'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  code-mono:
    fontFamily: monospace
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
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
  unit: 4px
  container-padding: 24px
  grid-gutter: 12px
  row-height-dense: 32px
  row-height-standard: 44px
---

## Brand & Style

This design system is engineered for power users who prioritize technical specifications over marketing fluff. The brand personality is clinical, authoritative, and precise, mirroring the experience of using a high-end Integrated Development Environment (IDE) or an industrial CAD application. 

The aesthetic follows a **Corporate / Modern** approach with a heavy lean toward **Minimalism**. By stripping away decorative elements, the system ensures that complex compatibility data and hardware specs remain the primary focus. The emotional response is one of confidence and reliability—users should feel they are using a professional diagnostic instrument rather than a retail storefront. High information density is achieved through tight vertical rhythm and reduced padding, allowing for comprehensive overviews of complex builds without excessive scrolling.

## Colors

The palette is centered on a high-contrast light mode that maximizes legibility. The primary action color, **Action Blue (#0056B3)**, is reserved for interactive elements and critical path indications. 

- **Functional Accents**: Compatibility states use a rigorous traffic-light system. Success (Green) indicates confirmed compatibility, Warning (Amber) indicates potential physical clearance issues or BIOS requirements, and Error (Red) indicates hard incompatibilities (e.g., socket mismatch).
- **Neutral Scales**: We utilize a range of "Slate" grays to differentiate between interface layers. Backgrounds are kept at the lightest tint to ensure the data grids remain the most prominent visual element.
- **Data Visualization**: Secondary colors are muted to ensure they do not compete with the primary blue action state.

## Typography

This design system utilizes **Inter** exclusively to leverage its exceptional legibility in high-density layouts. 

- **Scale**: The typographic scale is compact. We favor 14px as the standard body size, with 13px used for secondary data tables.
- **Hierarchy**: Distinction is created through weight rather than size. Use SemiBold (600) for headers and labels to anchor the eye without wasting vertical space.
- **Technical Readability**: For specific technical strings (e.g., SKU numbers, BIOS versions, or Serial IDs), use the `code-mono` style to provide a distinct visual "texture" that differentiates hardware IDs from descriptive text.

## Layout & Spacing

The layout utilizes a **Fixed Grid** for the main configuration canvas to ensure consistent alignment of hardware categories, while the data-rich component libraries utilize a **Fluid Grid** to maximize information density on wide-screen professional monitors.

- **4px Base Unit**: All margins and padding must be multiples of 4px.
- **Density**: Use "Compact" spacing for data grids—minimize cell padding to 8px horizontally and 4px vertically. 
- **Grid Structure**: A 12-column system is used for the main dashboard. Component selection sidebars should occupy 3-4 columns, leaving the remaining space for the comparison and compatibility engine.

## Elevation & Depth

To maintain a "Pro-tool" feel, this design system avoids heavy shadows and skeuomorphism. Depth is communicated through **Tonal Layers** and **Low-contrast Outlines**.

- **Surfaces**: The primary canvas is the lowest layer (#F8FAFC). Floating panels or modals use a pure white surface (#FFFFFF) with a 1px border (#E2E8F0).
- **Dividers**: Use subtle 1px lines rather than gaps to separate data points. This reinforces the "grid" feel common in technical documentation.
- **Interactions**: On-hover states for grid rows should use a subtle tint change (#F1F5F9) rather than an elevation lift. This keeps the interface feeling stable and "grounded."

## Shapes

The shape language is strictly **Rounded (0.5rem)**. This level of rounding softens the interface while maintaining the structured, professional look required of a technical tool. 

- **Components**: Buttons, input fields, and checkboxes all share the base `rounded` (8px) radius.
- **Status Indicators**: Status "pills" for compatibility should also use the 8px radius rather than a full pill shape, maintaining a more professional, "tabular" aesthetic.
- **Data Selection**: Highlighting in data grids should have 0px radius to ensure the selection looks like a continuous block of data.

## Components

- **Functional Data Grids**: The core of the system. Rows must be sortable and filterable. Use sticky headers for long spec lists. Include a "Compare" checkbox column.
- **Buttons**:
    - **Primary**: Solid Action Blue (#0056B3) with white text. No gradients. Uses the system standard 8px rounding.
    - **Secondary**: 1px border (#CBD5E1) with slate text.
    - **Ghost**: For low-priority actions within data rows.
- **Compatibility Badges**: Small, square-ish badges with icon prefixes (Checkmark, Alert, X). The background should be a desaturated version of the status color with high-contrast text.
- **Input Fields**: Minimalist. 1px border. On focus, the border changes to Action Blue with a 0px offset, 2px spread light blue glow.
- **Hardware Cards**: Not "cards" in the consumer sense. These are high-density list items containing SKU, Price, Compatibility Status, and 3-4 core specs (e.g., TDP, Clock Speed) in a multi-column layout.
- **Specification Tooltips**: Used extensively to show detailed sub-specs without cluttering the main grid. Use a dark neutral background (#1E293B) for maximum contrast against the light UI.