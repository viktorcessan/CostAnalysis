# Calculator Section Layout Documentation

## Overall Structure
The calculator section is a full-width container with padding and consists of three main vertical sections:
1. Model Selection Cards
2. Calculator Form
3. Results Display

## 1. Model Selection Cards

### Container
- Grid layout with 2 columns
- Gap between cards: 1.5rem (24px)
- Full width with horizontal padding
- Margin bottom: 2rem (32px)

### Individual Cards
- Dimensions: Equal width, aspect ratio ~2:1
- Background: White (active: Gradient indigo-600 to indigo-700)
- Border radius: 1rem (16px)
- Shadow: lg (active: xl)
- Padding: 2rem (32px)
- Scale transform on hover and active states

#### Card Content Structure
```
┌─────────────────────────────────┐
│ ┌─────┐                    [✓]  │
│ │Icon │ Model Title            │
│ └─────┘                         │
│                                 │
│ Description text                │
│ Multiple lines possible         │
└─────────────────────��───────────┘
```

#### Card States
1. **Inactive**
   - White background
   - Gray text
   - Light shadow
   - Hover: Scale 1.02

2. **Active**
   - Gradient background (indigo)
   - White text
   - Deeper shadow
   - Scale 1.05
   - Checkmark icon in top-right

## 2. Calculator Form

### Solution Tabs Container
- Horizontal flex layout
- Gap between tabs: 0.5rem (8px)
- Margin bottom: 0.75rem (12px)

### Solution Tabs
- Equal width (flex: 1)
- Padding: 0.5rem 1rem (8px 16px)
- Border radius: 0.5rem (8px)
- Background: White
- Border: 1px solid (active: indigo-500)

#### Tab States
1. **Inactive**
   - White background
   - Gray border
   - Black text
   - Hover: Light gray background

2. **Active**
   - Light indigo background
   - Indigo border
   - Indigo text

### Input Fields Grid
- Grid layout: 2 columns on mobile, 4 columns on desktop
- Gap between fields: 0.5rem (8px)
- Padding: 1rem (16px)

### Individual Input Field Container
```
┌────────────────────────────────┐
│ Label Text           [?]       │
│ [Numerical Input]             │
│ ─────────────────             │
│ [     Slider     ]             │
└────────────────��───────────────┘
```

#### Field Components
1. **Label Row**
   - Label text (truncated if too long)
   - Tooltip icon button
   - Font: Medium weight, 0.875rem (14px)

2. **Number Input**
   - Width: Based on max value
   - Right-aligned text
   - Currency prefix when applicable
   - Border radius: 0.375rem (6px)
   - Border color: gray-200 (hover/focus: indigo)

3. **Slider**
   - Full width
   - Height: 0.25rem (4px)
   - Custom thumb style
   - Background: gray-200
   - Active track: indigo-600

## 3. Results Display

### Summary Cards Row
- Grid layout: 3 equal columns
- Gap between cards: 1.5rem (24px)
- Margin bottom: 2rem (32px)

### Individual Summary Card
```
┌────────────────────────────┐
│ Metric Title              │
│ $123,456                  │
└────────────────────────────┘
```
- Background: gray-50
- Border radius: 0.75rem (12px)
- Padding: 1.5rem (24px)
- Title: Gray-600, 0.875rem (14px)
- Value: Bold, colored based on type
  - Savings: Green-600
  - Break-even: Indigo-600
  - Investment: Gray-600

### Chart Section
- Height: 20rem (320px)
- Margin bottom: 2rem (32px)

#### Chart Controls
- Centered button group
- Gap between buttons: 1rem (16px)
- Margin bottom: 1.5rem (24px)

#### Chart Types
1. **Cumulative Costs**
   - Line chart
   - Two lines: Baseline and Solution
   - Break-even point annotation
   - Area fill below lines

2. **Monthly Costs**
   - Bar chart
   - Grouped bars
   - Baseline vs Solution comparison

3. **Monthly Savings**
   - Line chart
   - Single line with area fill
   - Color changes based on positive/negative

### Sensitivity Analysis
- Three cards in a row (desktop)
- Stack vertically on mobile
- Gap between cards: 1.5rem (24px)

#### Sensitivity Card
```
┌────────────────────────────┐
│ Scenario Title            │
│ Description text          │
│                          │
│ Monthly Savings: $XXX     │
│ Total Savings: $XXX       │
│ Break-even: XX months     │
└────────────────────────────┘
```
- Background color based on scenario
  - Pessimistic: Light red
  - Base: Light indigo
  - Optimistic: Light green
- Border radius: 0.75rem (12px)
- Padding: 1.5rem (24px)

### Export Controls
- Flex row, right-aligned
- Gap between buttons: 1rem (16px)
- Margin top: 1.5rem (24px)

#### Export Buttons
- Padding: 0.5rem 1rem (8px 16px)
- Border radius: 0.5rem (8px)
- Icon + Text layout
- Excel: Green background
- PDF: Red background

## Responsive Behavior

### Mobile (< 640px)
- Single column layouts
- Full-width inputs
- Stacked cards
- Simplified charts
- Scrollable tables

### Tablet (640px - 1024px)
- Two-column grid for inputs
- Side-by-side cards where appropriate
- Maintained chart height
- Responsive padding and margins

### Desktop (> 1024px)
- Four-column grid for inputs
- Full three-column layout for cards
- Larger chart display
- Optimal spacing and padding

## Interactive Elements

### Tooltips
- Show on hover/focus
- Light background
- Arrow pointer
- Max width: 20rem (320px)
- Fade in/out animation

### Form Validation
- Real-time validation
- Red border for errors
- Error messages below fields
- Shake animation for invalid submissions

### Animations
- Smooth transitions for tab changes
- Fade in for new results
- Chart animations
- Hover state transitions

## Typography & Sizing Specifications

### Global Font Settings
- Font Family: Inter, system-ui, sans-serif
- Base Font Size: 16px (1rem)
- Line Height: 1.5
- Font Smoothing: antialiased

### Text Sizes by Section

#### 1. Model Selection Cards
- Model Title: 24px (1.5rem), font-bold
- Description: 16px (1rem), font-normal, text-gray-600
- Icon Size: 24px (1.5rem)

#### 2. Calculator Form

##### Solution Tabs
- Tab Text: 14px (0.875rem), font-medium
- Tab Description: 12px (0.75rem), font-normal, text-gray-600

##### Input Fields
- Label Text: 14px (0.875rem), font-medium
- Input Values: 14px (0.875rem), font-mono
- Helper Text: 12px (0.75rem), text-gray-500
- Tooltip Text: 12px (0.75rem)
- Error Messages: 12px (0.75rem), text-red-600

#### 3. Results Display

##### Summary Cards
- Metric Title: 14px (0.875rem), font-medium, text-gray-600
- Value: 24px (1.5rem), font-bold
- Secondary Text: 12px (0.75rem), text-gray-500

##### Charts
- Chart Title: 16px (1rem), font-semibold
- Axis Labels: 12px (0.75rem), text-gray-600
- Legend Text: 12px (0.75rem)
- Tooltip Text: 14px (0.875rem)

##### Sensitivity Analysis
- Card Title: 16px (1rem), font-semibold
- Description: 14px (0.875rem)
- Metrics: 14px (0.875rem), font-medium
- Values: 18px (1.125rem), font-semibold

##### Export Buttons
- Button Text: 14px (0.875rem), font-medium
- Icon Size: 20px (1.25rem)

### Component Dimensions

#### Model Selection Cards
- Min Height: 160px
- Icon Container: 48px × 48px
- Icon Background: 40px × 40px
- Checkmark Icon: 20px × 20px

#### Calculator Form
- Form Container Max Width: 1280px
- Input Field Height: 40px
- Number Input Width: Varies by max value
  - 4 digits: 64px
  - 5 digits: 80px
  - 6 digits: 96px
  - 7+ digits: 112px
- Slider Track Height: 4px
- Slider Thumb: 16px × 16px
- Tooltip Icon: 20px × 20px

#### Results Display
- Summary Card Min Height: 100px
- Chart Container Height: 320px
- Chart Controls Height: 40px
- Sensitivity Card Min Height: 200px
- Export Button Height: 40px

### Spacing Hierarchy

#### Vertical Spacing
- Section Spacing: 32px (2rem)
- Component Group Spacing: 24px (1.5rem)
- Related Element Spacing: 16px (1rem)
- Tight Element Spacing: 8px (0.5rem)

#### Horizontal Spacing
- Container Padding: 24px (1.5rem)
- Card Padding: 24px (1.5rem)
- Input Field Padding: 12px (0.75rem)
- Button Padding: 16px 24px (1rem 1.5rem)

### Border Specifications
- Card Borders: 1px solid
- Input Borders: 1px solid
- Focus Ring Width: 2px
- Border Radius Hierarchy:
  - Large Components (Cards): 16px (1rem)
  - Medium Components (Inputs): 8px (0.5rem)
  - Small Components (Buttons): 6px (0.375rem)

### Shadow Specifications
```css
/* Card Shadow */
box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);

/* Hover Shadow */
box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

/* Input Focus Ring */
ring-offset-2 ring-2 ring-indigo-500;
```

### Color Values
```css
/* Brand Colors */
--color-indigo-600: #4F46E5;
--color-indigo-700: #4338CA;
--color-indigo-50: #EEF2FF;

/* Text Colors */
--color-gray-900: #111827;
--color-gray-700: #374151;
--color-gray-600: #4B5563;
--color-gray-500: #6B7280;

/* Status Colors */
--color-green-600: #059669;
--color-red-600: #DC2626;
--color-yellow-500: #F59E0B;

/* Background Colors */
--color-white: #FFFFFF;
--color-gray-50: #F9FAFB;
--color-gray-100: #F3F4F6;

/* Border Colors */
--color-gray-200: #E5E7EB;
--color-gray-300: #D1D5DB;
```

### Z-Index Stacking
```css
/* Z-index hierarchy */
--z-index-base: 0;
--z-index-dropdown: 10;
--z-index-sticky: 20;
--z-index-fixed: 30;
--z-index-modal-backdrop: 40;
--z-index-modal: 50;
--z-index-popover: 60;
--z-index-tooltip: 70;
```

This layout documentation provides a comprehensive blueprint for recreating the calculator section with exact specifications for spacing, sizing, and interactive behaviors. 