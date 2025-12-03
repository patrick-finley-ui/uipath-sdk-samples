# UiPath Brand Style Guidelines

## Overview
This document defines the UiPath brand implementation for the Invoice Processing Application. All UI components, colors, typography, and visual elements should adhere to these guidelines to maintain consistent UiPath brand identity.

---

## Logo & Brand Identity

### Logo Location
- **Primary Logo File:** `c:/Users/patrick.finley/Downloads/uipath-logo-png_seeklogo-618304.png`
- **Usage:** Display UiPath logo on login screen, app header, and loading states where appropriate

### Logo Usage Guidelines
- Maintain clear space around logo (minimum padding: 16px)
- Never distort, rotate, or modify logo colors
- Ensure logo is visible against backgrounds (use appropriate color variant)
- Minimum size: 120px width for primary logo display

---

## Color System

### Primary Brand Colors

#### UiPath Orange (Primary)
- **Hex:** `#FA4616`
- **RGB:** `rgb(250, 70, 22)`
- **Tailwind:** `uipath-orange` (custom)
- **Usage:** Primary buttons, primary CTAs, brand accents, loading spinners, active states, focus rings, links

#### UiPath Orange Variants
- **Light:** `#FF6B3D` - Hover states, lighter accents
- **Dark:** `#E03D0F` - Active/pressed states, darker accents
- **Subtle:** `#FFF4F1` - Backgrounds, subtle highlights

### Semantic Colors

#### Success/Approved (Green)
- **Primary:** `#16A34A` (green-600)
- **Background:** `#DCFCE7` (green-100)
- **Border:** `#BBF7D0` (green-200)
- **Text:** `#166534` (green-800)
- **Usage:** Approved status, paid status, success messages, positive metrics

#### Error/Rejected (Red)
- **Primary:** `#DC2626` (red-600)
- **Background:** `#FEE2E2` (red-100)
- **Border:** `#FECACA` (red-200)
- **Text:** `#991B1B` (red-800)
- **Usage:** Rejected status, error messages, destructive actions

#### Warning/Pending (Yellow)
- **Primary:** `#CA8A04` (yellow-600)
- **Background:** `#FEF3C7` (yellow-100)
- **Border:** `#FDE68A` (yellow-200)
- **Text:** `#854D0E` (yellow-800)
- **Usage:** Pending review status, warning messages, attention needed

#### Information (Blue)
- **Primary:** `#2563EB` (blue-600)
- **Background:** `#DBEAFE` (blue-100)
- **Border:** `#BFDBFE` (blue-200)
- **Text:** `#1E40AF` (blue-800)
- **Usage:** Information messages, processing status, neutral notifications

### Neutral Colors

#### Grays (UI Elements)
- **Gray 50:** `#F9FAFB` - Page backgrounds
- **Gray 100:** `#F3F4F6` - Card backgrounds, subtle backgrounds
- **Gray 200:** `#E5E7EB` - Borders, dividers
- **Gray 300:** `#D1D5DB` - Disabled borders, placeholder text
- **Gray 400:** `#9CA3AF` - Secondary icons, muted text
- **Gray 500:** `#6B7280` - Secondary text
- **Gray 600:** `#4B5563` - Body text
- **Gray 700:** `#374151` - Emphasis text
- **Gray 800:** `#1F2937` - Headings, primary text
- **Gray 900:** `#111827` - Maximum contrast text

---

## Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
```

**Note:** Consider integrating a brand-specific font when official UiPath typography guidelines are available.

### Type Scale

#### Headings
- **H1 (Page Title):** 2.25rem (36px), font-bold, text-gray-900
- **H2 (Section Title):** 1.5rem (24px), font-bold, text-gray-900
- **H3 (Subsection):** 1.25rem (20px), font-semibold, text-gray-900
- **H4 (Card Title):** 1rem (16px), font-semibold, text-gray-700

#### Body Text
- **Large Body:** 1rem (16px), font-normal, text-gray-600
- **Body:** 0.875rem (14px), font-normal, text-gray-600
- **Small:** 0.75rem (12px), font-normal, text-gray-500
- **Extra Small:** 0.625rem (10px), font-normal, text-gray-400

#### Font Weights
- **Regular:** 400 (body text, descriptions)
- **Medium:** 500 (labels, emphasized text)
- **Semibold:** 600 (subheadings, important labels)
- **Bold:** 700 (headings, primary emphasis)

---

## Component Patterns

### Buttons

#### Primary Button
- **Background:** UiPath Orange (#FA4616)
- **Text:** White
- **Hover:** UiPath Orange Light (#FF6B3D)
- **Active:** UiPath Orange Dark (#E03D0F)
- **Disabled:** Gray-300 background, Gray-400 text
- **Padding:** py-3 px-4 (12px vertical, 16px horizontal)
- **Border Radius:** 0.5rem (8px)
- **Font:** font-semibold

#### Secondary Button
- **Background:** Transparent
- **Text:** UiPath Orange
- **Border:** 1px solid UiPath Orange
- **Hover:** UiPath Orange Subtle background
- **Active:** UiPath Orange Light background

#### Tertiary/Text Button
- **Background:** Transparent
- **Text:** Gray-700
- **Hover:** Gray-100 background
- **Active:** Gray-200 background

### Loading Spinners
- **Color:** UiPath Orange (#FA4616)
- **Size:**
  - Small: h-4 w-4 (16px)
  - Medium: h-8 w-8 (32px)
  - Large: h-12 w-12 (48px)
- **Border:** border-b-2
- **Animation:** animate-spin

### Status Badges
- **Structure:** Pill-shaped with border
- **Padding:** px-2 py-1
- **Font:** text-xs font-semibold
- **Border Radius:** rounded-full
- **Colors:** Use semantic color system (see Semantic Colors above)

### Cards
- **Background:** White
- **Border:** 1px solid Gray-200
- **Border Radius:** 0.5rem (8px)
- **Padding:** p-6 (24px)
- **Shadow:** shadow-md (on hover: shadow-lg)
- **Hover Transition:** transition-shadow duration-200

### Metric Cards
- **Structure:** Card with icon, title, value, description
- **Icon Background:** Circular with semantic color
- **Icon Size:** w-8 h-8 (32px)
- **Value Typography:** text-3xl font-bold text-gray-900
- **Title:** text-sm font-medium with semantic color
- **Description:** text-xs text-gray-500

### Forms

#### Input Fields
- **Border:** 1px solid Gray-300
- **Border Radius:** 0.5rem (8px)
- **Padding:** px-4 py-2
- **Focus State:**
  - Ring: ring-2 ring-uipath-orange
  - Border: border-transparent
- **Placeholder:** text-gray-400
- **Error State:** border-red-300, ring-red-500

#### Select Dropdowns
- Same styling as input fields
- Add dropdown icon on right

#### Search Input
- Include search icon (magnifying glass) on left
- Include clear button (X) on right when text is present

### Tables

#### Header
- **Background:** Gray-50
- **Text:** text-xs font-medium text-gray-500 uppercase tracking-wider
- **Padding:** px-6 py-3
- **Border Bottom:** 1px solid Gray-200

#### Rows
- **Background:** White
- **Hover:** Gray-50
- **Border Bottom:** 1px solid Gray-200
- **Padding:** px-6 py-4

#### Sortable Headers
- **Cursor:** cursor-pointer
- **Hover:** bg-gray-100
- **Active Sort:** Icon in UiPath Orange
- **Inactive Sort:** Icon in Gray-400

---

## Spacing System

### Standard Spacing Scale (Tailwind)
- **xs:** 0.25rem (4px)
- **sm:** 0.5rem (8px)
- **md:** 1rem (16px)
- **lg:** 1.5rem (24px)
- **xl:** 2rem (32px)
- **2xl:** 2.5rem (40px)

### Component Spacing
- **Page Padding:** p-6 (24px)
- **Section Gap:** space-y-6 (24px vertical)
- **Card Internal Padding:** p-6 (24px)
- **Form Field Gap:** space-y-4 (16px vertical)
- **Button Gap:** gap-2 (8px between icon and text)

---

## Elevation & Shadows

### Shadow Scale
- **sm:** `shadow-sm` - Subtle card elevation
- **md:** `shadow-md` - Standard card elevation
- **lg:** `shadow-lg` - Elevated/hover state
- **xl:** `shadow-xl` - Modal, dialog, prominent elements
- **2xl:** `shadow-2xl` - Maximum elevation

### Usage
- **Cards:** shadow-md, hover:shadow-lg
- **Buttons:** shadow-md
- **Modals/Dialogs:** shadow-xl
- **Dropdowns:** shadow-lg

---

## Icons

### Icon Library
- Using Heroicons (outline style primary, solid for emphasis)
- **Size Scale:**
  - Small: w-4 h-4 (16px)
  - Medium: w-5 h-5 (20px)
  - Large: w-6 h-6 (24px)
  - XL: w-8 h-8 (32px)

### Icon Colors
- **Primary Actions:** UiPath Orange
- **Secondary:** Gray-600
- **Muted:** Gray-400
- **Status Icons:** Use semantic colors

### Stroke Width
- Standard: strokeWidth={2}
- Delicate: strokeWidth={1.5}

---

## Animation & Transitions

### Standard Transitions
```css
transition-colors duration-200
transition-shadow duration-200
transition-transform duration-200
```

### Loading States
- Spinner animation: `animate-spin`
- Pulse for skeleton screens: `animate-pulse`
- Fade in: opacity transition

### Hover States
- Buttons: Color change + subtle shadow increase
- Cards: Shadow increase
- Links: Color change to darker variant

---

## Accessibility Guidelines

### Color Contrast
- **Text on White Background:** Minimum AA compliance (4.5:1)
- **Large Text (18px+):** Minimum 3:1 ratio
- **UI Components:** Minimum 3:1 against background

### Focus States
- **Visible Focus Ring:** All interactive elements must have visible focus
- **Focus Color:** UiPath Orange ring-2
- **Focus Offset:** Use `focus-visible:ring-offset-2` for clarity

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Logical tab order
- Enter/Space activation for buttons

### ARIA Labels
- Provide descriptive labels for screen readers
- Use `aria-label` for icon-only buttons
- Use `aria-sort` for sortable table headers
- Use `role` attributes appropriately

---

## Responsive Design

### Breakpoints (Tailwind Default)
- **sm:** 640px
- **md:** 768px
- **lg:** 1024px
- **xl:** 1280px
- **2xl:** 1536px

### Mobile-First Approach
- Design for mobile first, enhance for larger screens
- Ensure touch targets are minimum 44x44px on mobile
- Stack elements vertically on mobile, use grid on desktop
- Hide non-essential content on small screens

### Common Patterns
- **Metric Cards:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **Forms:** Stack on mobile, two-column on desktop
- **Tables:** Horizontal scroll on mobile

---

## Implementation Checklist

### When Creating New Components

- [ ] Use UiPath Orange for primary actions/brand elements
- [ ] Use semantic colors for status indicators
- [ ] Include hover and focus states
- [ ] Add loading states with brand-colored spinners
- [ ] Ensure keyboard accessibility
- [ ] Test on mobile, tablet, and desktop viewports
- [ ] Verify color contrast meets WCAG AA standards
- [ ] Add appropriate ARIA labels for screen readers
- [ ] Use consistent spacing from spacing scale
- [ ] Apply appropriate shadow elevation

---

## Resources

### Brand Assets
- **Logo File:** `c:/Users/patrick.finley/Downloads/uipath-logo-png_seeklogo-618304.png`
- **Icon Library:** Heroicons (https://heroicons.com/)
- **Color Picker:** Use exact hex codes specified in this document

### Documentation
- **Tailwind CSS:** https://tailwindcss.com/docs
- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **UiPath Official:** https://www.uipath.com/ (for latest brand updates)

### Tools
- **Color Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **Accessibility Testing:** Browser DevTools, axe DevTools extension

---

## Version History

- **v1.0** - Initial brand guidelines document created based on UiPath brand research and invoice app implementation

---

## Notes

- This document should be updated when official UiPath design system documentation becomes available
- For questions about brand usage, consult official UiPath brand guidelines at brandguidelines.uipath.com
- When in doubt, prioritize clarity and accessibility over strict aesthetic adherence
