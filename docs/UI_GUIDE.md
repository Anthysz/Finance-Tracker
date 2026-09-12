# UI Structure & Navigation Guide

## 📱 Application Flow

```
┌─────────────────────────────────────────┐
│         Landing Page (/)                │
│  ┌───────────────────────────────────┐ │
│  │   Finance Tracker Logo            │ │
│  │   "Track your expenses..."        │ │
│  │                                   │ │
│  │   [Sign in with Google Button]   │ │
│  │                                   │ │
│  │   Requirements:                   │ │
│  │   • Google account               │ │
│  │   • Spreadsheet format info      │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    ↓
          (After Login)
                    ↓
┌─────────────────────────────────────────┐
│     Spreadsheet Selection               │
│  ┌───────────────────────────────────┐ │
│  │  Select Your Spreadsheet          │ │
│  │                                   │ │
│  │  [📄 Budget 2024]                │ │
│  │  [📄 Expenses Jan-March]         │ │
│  │  [📄 Personal Finance]           │ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    ↓
          (After Selection)
                    ↓
┌─────────────────────────────────────────┐
│         Main Application                │
│  ┌───────────────────────────────────┐ │
│  │ [Finance Tracker] [Database] [Sta│ │
│  │                   tistics] [Logout]│ │
│  └───────────────────────────────────┘ │
│                                         │
│  Choose:                                │
│  • Database → View/Add Transactions     │
│  • Statistics → Analytics Dashboard     │
└─────────────────────────────────────────┘
```

## 🗂️ Database Page Layout

```
┌────────────────────────────────────────────────┐
│ [Finance Tracker]  [Database] [Statistics]     │
├────────────────────────────────────────────────┤
│                                                │
│  Database                    [+ Add Entry]     │
│  128 total transactions                        │
│                                                │
│  [🔍 Search by name or date...]               │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ Date ↕ │ Name ↕ │ Amount ↕              │ │
│  ├──────────┼─────────┼──────────────────────┤ │
│  │2024-01-15│Groceries│  -$50.00 (red)      │ │
│  │2024-01-16│Salary   │  +$2000.00 (green)  │ │
│  │2024-01-17│Coffee   │  -$5.50 (red)       │ │
│  │   ...    │   ...   │     ...              │ │
│  └──────────┴─────────┴──────────────────────┘ │
│                                                │
└────────────────────────────────────────────────┘

Add Entry Modal:
┌───────────────────────────┐
│ Add New Entry        [×]  │
├───────────────────────────┤
│ Date: [2024-01-20]       │
│ Name: [Restaurant]       │
│ Amount: [-65.50]         │
│                          │
│ Tip: Use negative for    │
│ expenses                 │
│                          │
│ [Cancel]  [Add Entry]    │
└───────────────────────────┘
```

## 📊 Statistics Page Layout

```
┌────────────────────────────────────────────────┐
│ [Finance Tracker]  [Database] [Statistics]     │
├────────────────────────────────────────────────┤
│                                                │
│  Statistics                                    │
│                                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────┐│
│  │💸       │ │💰       │ │💵       │ │📅    ││
│  │Total    │ │Total    │ │Net      │ │Avg   ││
│  │Expenses │ │Income   │ │Amount   │ │Daily ││
│  │$1,234   │ │$5,000   │ │$3,766   │ │$41   ││
│  └─────────┘ └─────────┘ └─────────┘ └──────┘│
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ Expense Trends  [Daily][Weekly][Monthly] │ │
│  │                                          │ │
│  │      📈 Line Chart                       │ │
│  │   $                                      │ │
│  │   │    /\      /\                        │ │
│  │   │   /  \    /  \    /\                 │ │
│  │   │  /    \  /    \  /  \                │ │
│  │   └─────────────────────────> time       │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────┐ ┌────────────────────┐  │
│  │ Top 10 Expenses  │ │ Category Breakdown │  │
│  │                  │ │                    │  │
│  │  📊 Bar Chart    │ │  🥧 Pie Chart      │  │
│  │  Groceries ████  │ │                    │  │
│  │  Transport ███   │ │     [Various       │  │
│  │  Food      ██    │ │      colored       │  │
│  │  ...             │ │      segments]     │  │
│  └──────────────────┘ └────────────────────┘  │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ Peak Spending Analysis                   │ │
│  │                                          │ │
│  │ [Highest Day]  [Highest Week] [Highest  │ │
│  │  2024-01-15     2024-W03      Month]    │ │
│  │  $234.50        $678.90      2024-01    │ │
│  │                              $1,234.50  │ │
│  └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

## 📱 Mobile View (< 768px)

```
┌──────────────────────┐
│ Finance Tracker      │
├──────────────────────┤
│ [Database][Stats]    │
├──────────────────────┤
│                      │
│ Database             │
│ 128 transactions     │
│                      │
│ [+ Add]              │
│                      │
│ [🔍 Search...]      │
│                      │
│ ┌──────────────────┐│
│ │Date: 2024-01-15  ││
│ │Name: Groceries   ││
│ │Amount: -$50.00   ││
│ ├──────────────────┤│
│ │Date: 2024-01-16  ││
│ │Name: Salary      ││
│ │Amount: +$2000    ││
│ └──────────────────┘│
│                      │
└──────────────────────┘

Statistics (Mobile):
┌──────────────────────┐
│ Statistics           │
├──────────────────────┤
│ ┌──────────────────┐ │
│ │ 💸 Total Expenses│ │
│ │    $1,234.56     │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ 💰 Total Income  │ │
│ │    $5,000.00     │ │
│ └──────────────────┘ │
│                      │
│ (Charts stack        │
│  vertically)         │
└──────────────────────┘
```

## 🎨 Color Scheme

### Main Colors
- **Primary Blue**: `#3b82f6` - Buttons, links, active states
- **Success Green**: `#10b981` - Income amounts
- **Error Red**: `#ef4444` - Expense amounts
- **Gray Scale**: Various shades for text and backgrounds

### Component Colors
- **Background**: `bg-gray-50` - Light gray
- **Cards**: `bg-white` - White with shadow
- **Hover States**: `hover:bg-gray-100` - Subtle gray
- **Active Nav**: `bg-blue-100 text-blue-700`

## 🖱️ Interactive Elements

### Buttons
- **Primary**: Blue background, white text, hover darkens
- **Secondary**: Gray background, dark text, hover lightens
- **Danger**: Red text, red hover background

### Tables
- **Sortable Headers**: Click to sort, arrow icon
- **Row Hover**: Light gray background
- **Responsive**: Horizontal scroll on mobile

### Charts
- **Tooltips**: Show on hover with formatted values
- **Legend**: Color-coded labels
- **Responsive**: Scale to container width

### Modals
- **Dark Overlay**: Semi-transparent black background
- **White Card**: Centered modal with shadow
- **Close Actions**: Cancel button or click outside

## ⌨️ Keyboard Navigation

- Tab through interactive elements
- Enter to submit forms
- Escape to close modals
- Arrow keys in date picker

## 🔄 Loading States

- **Spinner**: Blue rotating circle
- **Text**: "Loading..." messages
- **Disabled**: Buttons during async operations
- **Skeleton**: (Could add for future enhancement)

## ✅ Success States

- **Modal Close**: After successful add
- **Data Refresh**: Automatic after operations
- **Visual Feedback**: Color changes for amounts

## ❌ Error States

- **Alert Dialogs**: For API failures
- **Console Errors**: For debugging
- **Empty States**: "No transactions found"

---

This guide provides a visual reference for understanding the application's structure and user flow.
