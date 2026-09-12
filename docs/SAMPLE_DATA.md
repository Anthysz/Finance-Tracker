# Sample Google Sheets Data Format

Two sheet layouts are supported:

1. **3 columns**: `Date | Name | Cost` (documented below)
2. **4 columns**: `Date | Category | Name | Cost`

For the **4-column** layout the app shows both the category and the item name, and
treats **positive** amounts as expenses (matching a "Cost" column). For the
**3-column** layout, use negative amounts for expenses and positive for income.

## 3-column layout

## Header Row (Row 1)
| Date       | Name      | Cost    |
|------------|-----------|---------|

## Data Examples (Starting from Row 2)

### Expenses (negative numbers)
- 2024-01-15 | Groceries | -85.50
- 2024-01-16 | Coffee Shop | -12.00
- 2024-01-17 | Gas | -45.00
- 2024-01-18 | Restaurant | -67.25
- 2024-01-19 | Uber | -23.50
- 2024-01-20 | Gym Membership | -50.00
- 2024-01-21 | Books | -34.99
- 2024-01-22 | Movie Tickets | -28.00
- 2024-01-23 | Groceries | -92.15
- 2024-01-24 | Electricity Bill | -120.00

### Income (positive numbers)
- 2024-01-01 | Salary | 3500.00
- 2024-01-15 | Freelance Work | 450.00
- 2024-01-20 | Investment Return | 125.00

## Important Notes

1. **Date Format**: Must be YYYY-MM-DD (e.g., 2024-01-15)
2. **Name**: Any descriptive text (e.g., "Groceries", "Salary", "Coffee")
3. **Cost**: 
   - Use **negative numbers** for expenses (e.g., -50.00)
   - Use **positive numbers** for income (e.g., 2000.00)
   - Decimal points are optional but recommended for cents

## Full Example Sheet

Copy this into your Google Sheet:

```
Date       | Name              | Cost
2024-01-01 | Salary            | 3500.00
2024-01-05 | Groceries         | -120.50
2024-01-06 | Coffee            | -5.75
2024-01-07 | Gas               | -45.00
2024-01-08 | Restaurant        | -65.00
2024-01-10 | Freelance         | 500.00
2024-01-12 | Gym               | -50.00
2024-01-13 | Shopping          | -85.25
2024-01-15 | Utilities         | -150.00
2024-01-16 | Internet          | -60.00
2024-01-18 | Groceries         | -95.80
2024-01-20 | Entertainment     | -40.00
2024-01-22 | Transport         | -30.00
2024-01-25 | Restaurant        | -72.50
2024-01-28 | Groceries         | -110.00
2024-01-30 | Investment Return | 200.00
```

## Tips

- Keep consistent naming for categories (e.g., always use "Groceries" not "grocery" or "Groceries shopping")
- The app will automatically group similar names in the statistics
- You can have multiple entries per day
- Income is optional - you can track expenses only if you prefer
