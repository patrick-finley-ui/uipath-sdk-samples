# Loan Application Review - Action App

A modern loan application review form built with React, Vite, and Tailwind CSS. This Action App integrates with UiPath orchestrator to allow reviewers to approve or reject loan applications with access to applicant history and supporting documents stored in Data Fabric.

## Features

- 📝 Review loan applications with all relevant details
- 📊 View applicant's historical loan data from Data Fabric
- 📄 View attached PDF documents directly in the interface
- ✅ Approve or reject applications with validation
- 🎨 Modern, responsive UI built with Tailwind CSS

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **UiPath SDK** - Integration with UiPath platform
- **React-PDF** - PDF document viewing

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

---

## 🎨 Customizing Styles with Tailwind CSS

This application uses **Tailwind CSS** plus custom CSS for enhanced visual effects - a hybrid approach that gives you the best of both worlds! As a Sales Engineer, you can easily customize this form's appearance.

### Design Approach

- **Tailwind CSS**: Used for 95% of styling (colors, spacing, layout, typography)
- **Custom CSS** (`FormStyles.css`): Used for gradients, shadows, and smooth transitions that make the UI pop

This hybrid approach means you get:
✅ Easy customization via Tailwind classes
✅ Beautiful gradients and effects without complex CSS
✅ Professional, polished look out of the box

### What is Tailwind CSS?

Tailwind CSS allows you to style elements by adding utility classes directly to HTML elements. Instead of writing CSS like:

```css
.button {
  background-color: blue;
  padding: 16px;
  border-radius: 8px;
}
```

You simply add classes:
```jsx
<button className="bg-blue-600 px-4 py-2 rounded-lg">
```

### Quick Styling Reference

#### Colors
Change any element's color by modifying its class:

```jsx
// Text colors
text-slate-700    // Dark gray text
text-blue-600     // Blue text
text-red-600      // Red text

// Background colors
bg-white          // White background
bg-blue-600       // Blue background
bg-gray-100       // Light gray background

// Border colors
border-gray-300   // Gray border
```

**Available colors**: slate, gray, red, orange, yellow, green, blue, indigo, purple, pink
**Available shades**: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900

#### Spacing (Padding & Margin)

```jsx
p-4      // Padding all sides: 1rem
px-6     // Padding left & right: 1.5rem
py-3     // Padding top & bottom: 0.75rem
pt-2     // Padding top: 0.5rem

m-4      // Margin all sides: 1rem
mx-auto  // Margin left & right: auto (center)
mt-8     // Margin top: 2rem
```

**Scale**: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64, 96

#### Typography

```jsx
text-sm      // Small text (0.875rem)
text-base    // Base text (1rem)
text-lg      // Large text (1.125rem)
text-xl      // Extra large (1.25rem)
text-2xl     // 2x large (1.5rem)
text-3xl     // 3x large (1.875rem)

font-normal  // Normal weight
font-medium  // Medium weight
font-semibold // Semi-bold
font-bold    // Bold
```

#### Layout

```jsx
flex              // Display: flex
items-center      // Align items vertically centered
justify-between   // Space between flex items
gap-4            // Gap between flex/grid items

grid             // Display: grid
grid-cols-2      // 2 column grid
```

#### Borders & Corners

```jsx
rounded          // Border radius: 0.25rem
rounded-lg       // Border radius: 0.5rem
rounded-full     // Border radius: 9999px (circle)

border          // 1px border
border-2        // 2px border
border-t        // Top border only
```

#### Responsive Design

Add breakpoint prefixes to make styles responsive:

```jsx
// Mobile-first approach
className="text-sm md:text-base lg:text-lg"
// Small on mobile, base on tablet, large on desktop

className="p-4 md:p-6 lg:p-8"
// Less padding on mobile, more on larger screens
```

**Breakpoints**:
- `sm:` - 640px and up
- `md:` - 768px and up
- `lg:` - 1024px and up
- `xl:` - 1280px and up

### Common Customization Examples

#### Change Button Colors

The buttons use **gradient CSS classes** defined in `FormStyles.css`. To change colors:

**Option 1: Modify the gradient in FormStyles.css:**
```css
/* In src/components/FormStyles.css */
.accept-button-gradient {
  background: linear-gradient(135deg, #16a34a, #15803d); /* Change to green */
  box-shadow: 0 2px 8px rgba(22, 163, 74, 0.25);
}
```

**Option 2: Replace with solid Tailwind colors in Form.tsx (line ~420):**
```jsx
// Replace gradient with solid color:
// OLD:
className="accept-button-gradient"
// NEW:
className="bg-green-600 hover:bg-green-700"
```

#### Change Form Background

Find the main form container (around line 269):

```jsx
// Change from white to light gray:
// OLD:
className="bg-white rounded-2xl"
// NEW:
className="bg-slate-50 rounded-2xl"
```

#### Adjust Spacing

```jsx
// Make form fields closer together:
// OLD:
<div className="mb-6">
// NEW:
<div className="mb-4">

// Add more padding to the form:
// OLD:
className="p-10"
// NEW:
className="p-12"
```

#### Change Tab Active Color

The tab buttons use a custom UiPath blue color. Find the tabs (around line 293):

```jsx
// Change from UiPath blue to green:
// OLD:
className="text-uipath-blue border-b-uipath-blue"
// NEW:
className="text-green-600 border-b-green-600"
```

#### Modify Input Field Styles

```jsx
// Make inputs larger:
// OLD:
className="px-4 py-2.5"
// NEW:
className="px-6 py-3"

// Change input border color:
// OLD:
className="border-slate-300"
// NEW:
className="border-blue-300"
```

### Custom UiPath Colors

This project includes custom UiPath brand colors defined in `tailwind.config.js`:

- `uipath-blue` - #0067DF
- `uipath-orange` - #FA4616

Use them like any other Tailwind color:
```jsx
className="bg-uipath-blue text-white"
className="border-uipath-orange"
```

### Need Help?

**Tailwind Documentation**: https://tailwindcss.com/docs
**Cheat Sheet**: https://nerdcave.com/tailwind-cheat-sheet
**Color Reference**: https://tailwindcss.com/docs/customizing-colors

**Pro Tip**: The Form component (`src/components/Form.tsx`) has detailed comments at the top explaining Tailwind basics!

---

## Project Structure

```
loan-app-dF-doc-input/
├── src/
│   ├── components/
│   │   ├── Form.tsx          # Main form component (with Tailwind classes)
│   │   └── utils.ts          # Utility functions
│   ├── assets/               # Images and static files
│   ├── uipath.ts            # UiPath SDK initialization
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── index.css            # Tailwind directives & global styles
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
├── vite.config.ts           # Vite configuration
└── package.json
```

## Integration with UiPath

This Action App integrates with:
- **Action Center**: Receives task data and completes tasks
- **Orchestrator Buckets**: Retrieves PDF documents from storage
- **Data Fabric**: Queries applicant loan history from entities

The form automatically initializes when opened in Action Center and receives:
- Applicant details
- Loan information
- Document storage references
- Authentication tokens

## License

This is a sample application provided by UiPath for demonstration purposes.
