export interface Transaction {
  date: string;
  category: string;
  name: string;
  cost: number;
  /** 1-based sheet row, used to update an existing entry. */
  row?: number;
  /** When set, the entry is hidden from statistics; the text is the reason. */
  hiddenReason?: string;
}

export interface Statistics {
  totalExpenses: number;
  totalIncome: number;
  netAmount: number;
  dailyExpenses: { date: string; total: number }[];
  weeklyExpenses: { week: string; total: number }[];
  monthlyExpenses: { month: string; total: number }[];
  quarterlyExpenses: { quarter: string; total: number }[];
  topExpenses: { name: string; total: number }[];
  categoryBreakdown: { name: string; count: number; total: number }[];
}

async function describeApiError(
  context: string,
  response: Response
): Promise<string> {
  let detail = '';
  try {
    const body = await response.json();
    if (body?.error?.message) {
      detail = `: ${body.error.message}`;
    }
  } catch {
    // Response body was empty or not JSON; the status code is enough.
  }
  return `${context} (HTTP ${response.status}${detail})`;
}

// Thrown when Google rejects the access token (expired or revoked). Callers
// should clear the stored session and send the user back to sign in.
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

async function assertOk(context: string, response: Response): Promise<void> {
  if (response.ok) return;
  const message = await describeApiError(context, response);
  if (response.status === 401) {
    throw new AuthenticationError(message);
  }
  throw new Error(message);
}

const API_TIMEOUT_MS = 20000;

// fetch() has no default timeout. A blocked or stalled request would otherwise
// leave the UI spinning forever, so abort after a bounded wait.
async function fetchWithTimeout(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(
        `Google did not respond within ${Math.round(API_TIMEOUT_MS / 1000)}s. ` +
          'Check your internet connection, and make sure no browser extension ' +
          'or firewall is blocking googleapis.com.'
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function isNumericCell(value: unknown): boolean {
  if (typeof value === 'number') return true;
  if (typeof value !== 'string') return false;
  // Text with more than a currency prefix (e.g. "Rp") is a label, not a cost.
  const letters = (value.match(/[a-zA-Z]/g) || []).length;
  if (letters > 2) return false;
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return cleaned !== '' && Number.isFinite(parseFloat(cleaned));
}

function parseAmount(value: string | undefined): number {
  if (!value) return 0;
  const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

// The app stores expenses as negative cost and income as positive. The sheet
// uses the opposite convention for its "Cost" column (positive = expense), so
// the sign is flipped at the sheet boundary.
function sheetAmountToCost(value: string | undefined, fourColumn: boolean): number {
  const amount = parseAmount(value);
  return fourColumn ? -amount : amount;
}

function costToSheetAmount(cost: number, fourColumn: boolean): number {
  return fourColumn ? -cost : cost;
}

// Supported sheet layouts:
//   3 columns: Date | Name | Cost
//   4 columns: Date | Category | Name | Cost
function mapRow(
  row: string[],
  fourColumn: boolean,
  rowNumber: number
): Transaction | null {
  const date = (row[0] || '').trim();
  const category = fourColumn ? (row[1] || '').trim() : '';
  const name = ((fourColumn ? row[2] : row[1]) || '').trim();
  const cost = sheetAmountToCost(fourColumn ? row[3] : row[2], fourColumn);
  // The hidden reason lives in the column after the data (E for 4-column
  // sheets, D for 3-column sheets). Non-empty means the entry is hidden.
  const hiddenReason =
    String((fourColumn ? row[4] : row[3]) ?? '').trim() || undefined;

  if (!date || (!name && !category)) return null;

  return { date, category, name, cost, row: rowNumber, hiddenReason };
}

export async function fetchSpreadsheetData(
  accessToken: string,
  spreadsheetId: string
): Promise<Transaction[]> {
  const response = await fetchWithTimeout(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A2:E`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  await assertOk('Failed to fetch spreadsheet data', response);

  const data = await response.json();
  const rows: string[][] = data.values || [];
  // The cost is the numeric column: D for the 4-column layout, C for 3-column.
  // The hidden-reason column (E or D) is text, so it never looks like a cost.
  const fourColumn = rows.some((row) => isNumericCell(row?.[3]));

  return rows
    .map((row, index) => mapRow(row || [], fourColumn, index + 2))
    .filter((t): t is Transaction => t !== null);
}

export async function addTransaction(
  accessToken: string,
  spreadsheetId: string,
  transaction: Transaction,
  fourColumn: boolean
): Promise<void> {
  const sheetCost = costToSheetAmount(transaction.cost, fourColumn);
  const values = fourColumn
    ? [[transaction.date, transaction.category, transaction.name, sheetCost]]
    : [[transaction.date, transaction.name, sheetCost]];

  const response = await fetchWithTimeout(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:D:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    }
  );

  await assertOk('Failed to add transaction', response);
}

export async function updateTransaction(
  accessToken: string,
  spreadsheetId: string,
  transaction: Transaction,
  fourColumn: boolean
): Promise<void> {
  if (!transaction.row) {
    throw new Error('Cannot update an entry without a sheet row.');
  }

  const sheetCost = costToSheetAmount(transaction.cost, fourColumn);
  const values = fourColumn
    ? [[transaction.date, transaction.category, transaction.name, sheetCost]]
    : [[transaction.date, transaction.name, sheetCost]];
  const lastColumn = fourColumn ? 'D' : 'C';
  const range = `A${transaction.row}:${lastColumn}${transaction.row}`;

  const response = await fetchWithTimeout(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    }
  );

  await assertOk('Failed to update transaction', response);
}

// Hidden entries are stored in the sheet so they survive reloads and follow the
// row when the sheet is sorted or edited. The column is E for the 4-column
// layout and D for the 3-column layout.
export async function setEntryHidden(
  accessToken: string,
  spreadsheetId: string,
  fourColumn: boolean,
  row: number,
  reason: string
): Promise<void> {
  const column = fourColumn ? 'E' : 'D';
  const response = await fetchWithTimeout(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${column}${row}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [[reason]] }),
    }
  );

  await assertOk('Failed to update hidden state', response);
}

export async function setEntriesHidden(
  accessToken: string,
  spreadsheetId: string,
  fourColumn: boolean,
  updates: { row: number; reason: string }[]
): Promise<void> {
  if (updates.length === 0) return;
  const column = fourColumn ? 'E' : 'D';

  const response = await fetchWithTimeout(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: updates.map((update) => ({
          range: `${column}${update.row}`,
          values: [[update.reason]],
        })),
      }),
    }
  );

  await assertOk('Failed to update hidden state', response);
}

export async function listSpreadsheets(accessToken: string) {
  const response = await fetchWithTimeout(
    `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&fields=files(id,name)&pageSize=100&orderBy=name`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  await assertOk('Failed to fetch spreadsheets', response);

  return response.json();
}

export function calculateStatistics(
  transactions: Transaction[],
  includeIncome = true
): Statistics {
  // Without income, every non-zero entry is treated as spending regardless of
  // the sign that was stored for it.
  const expenses = includeIncome
    ? transactions.filter((t) => t.cost < 0)
    : transactions.filter((t) => t.cost !== 0);
  const income = includeIncome ? transactions.filter((t) => t.cost > 0) : [];

  const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.cost), 0);
  const totalIncome = income.reduce((sum, t) => sum + t.cost, 0);
  const netAmount = totalIncome - totalExpenses;

  const dailyMap = new Map<string, number>();
  const weeklyMap = new Map<string, number>();
  const monthlyMap = new Map<string, number>();
  const quarterMap = new Map<string, number>();
  const itemMap = new Map<string, { count: number; total: number }>();
  const categoryMap = new Map<string, { count: number; total: number }>();

  expenses.forEach((t) => {
    const date = new Date(t.date);
    const dateStr = t.date;
    const weekStr = getWeekString(date);
    const monthStr = date.toISOString().slice(0, 7);

    dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + Math.abs(t.cost));
    weeklyMap.set(weekStr, (weeklyMap.get(weekStr) || 0) + Math.abs(t.cost));
    monthlyMap.set(monthStr, (monthlyMap.get(monthStr) || 0) + Math.abs(t.cost));
    const quarterStr = getQuarterString(date);
    quarterMap.set(quarterStr, (quarterMap.get(quarterStr) || 0) + Math.abs(t.cost));

    const item = itemMap.get(t.name) || { count: 0, total: 0 };
    itemMap.set(t.name, {
      count: item.count + 1,
      total: item.total + Math.abs(t.cost),
    });

    const categoryLabel = t.category || t.name;
    const category = categoryMap.get(categoryLabel) || { count: 0, total: 0 };
    categoryMap.set(categoryLabel, {
      count: category.count + 1,
      total: category.total + Math.abs(t.cost),
    });
  });

  const dailyExpenses = Array.from(dailyMap.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const weeklyExpenses = Array.from(weeklyMap.entries())
    .map(([week, total]) => ({ week, total }))
    .sort((a, b) => a.week.localeCompare(b.week));

  const monthlyExpenses = Array.from(monthlyMap.entries())
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const quarterlyExpenses = Array.from(quarterMap.entries())
    .map(([quarter, total]) => ({ quarter, total }))
    .sort((a, b) => a.quarter.localeCompare(b.quarter));

  const topExpenses = Array.from(itemMap.entries())
    .map(([name, data]) => ({ name, total: data.total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([name, data]) => ({ name, count: data.count, total: data.total }))
    .sort((a, b) => b.total - a.total);

  return {
    totalExpenses,
    totalIncome,
    netAmount,
    dailyExpenses,
    weeklyExpenses,
    monthlyExpenses,
    quarterlyExpenses,
    topExpenses,
    categoryBreakdown,
  };
}

export function getQuarterString(date: Date): string {
  return `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
}

export function getWeekString(date: Date): string {
  const year = date.getFullYear();
  const firstDayOfYear = new Date(year, 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}
