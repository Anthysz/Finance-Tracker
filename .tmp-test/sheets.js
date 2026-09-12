"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationError = void 0;
exports.fetchSpreadsheetData = fetchSpreadsheetData;
exports.addTransaction = addTransaction;
exports.listSpreadsheets = listSpreadsheets;
exports.calculateStatistics = calculateStatistics;
async function describeApiError(context, response) {
    var _a;
    let detail = '';
    try {
        const body = await response.json();
        if ((_a = body === null || body === void 0 ? void 0 : body.error) === null || _a === void 0 ? void 0 : _a.message) {
            detail = `: ${body.error.message}`;
        }
    }
    catch {
        // Response body was empty or not JSON; the status code is enough.
    }
    return `${context} (HTTP ${response.status}${detail})`;
}
// Thrown when Google rejects the access token (expired or revoked). Callers
// should clear the stored session and send the user back to sign in.
class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
async function assertOk(context, response) {
    if (response.ok)
        return;
    const message = await describeApiError(context, response);
    if (response.status === 401) {
        throw new AuthenticationError(message);
    }
    throw new Error(message);
}
const API_TIMEOUT_MS = 20000;
// fetch() has no default timeout. A blocked or stalled request would otherwise
// leave the UI spinning forever, so abort after a bounded wait.
async function fetchWithTimeout(url, init = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    try {
        return await fetch(url, { ...init, signal: controller.signal });
    }
    catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error(`Google did not respond within ${Math.round(API_TIMEOUT_MS / 1000)}s. ` +
                'Check your internet connection, and make sure no browser extension ' +
                'or firewall is blocking googleapis.com.');
        }
        throw error;
    }
    finally {
        clearTimeout(timer);
    }
}
function parseAmount(value) {
    if (!value)
        return 0;
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
}
// The app stores expenses as negative cost and income as positive. The sheet
// uses the opposite convention for its "Cost" column (positive = expense), so
// the sign is flipped at the sheet boundary.
function sheetAmountToCost(value, fourColumn) {
    const amount = parseAmount(value);
    return fourColumn ? -amount : amount;
}
function costToSheetAmount(cost, fourColumn) {
    return fourColumn ? -cost : cost;
}
// Supported sheet layouts:
//   3 columns: Date | Name | Cost
//   4 columns: Date | Category | Name | Cost
function mapRow(row, fourColumn) {
    const date = (row[0] || '').trim();
    const category = fourColumn ? (row[1] || '').trim() : '';
    const name = ((fourColumn ? row[2] : row[1]) || '').trim();
    const cost = sheetAmountToCost(fourColumn ? row[3] : row[2], fourColumn);
    if (!date || (!name && !category))
        return null;
    return { date, category, name, cost };
}
async function fetchSpreadsheetData(accessToken, spreadsheetId) {
    const response = await fetchWithTimeout(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A2:D`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    await assertOk('Failed to fetch spreadsheet data', response);
    const data = await response.json();
    const rows = data.values || [];
    // If any row fills a 4th column the sheet uses the Category column layout.
    const fourColumn = rows.some((row) => ((row === null || row === void 0 ? void 0 : row.length) || 0) >= 4);
    return rows
        .map((row) => mapRow(row || [], fourColumn))
        .filter((t) => t !== null);
}
async function addTransaction(accessToken, spreadsheetId, transaction, fourColumn) {
    const sheetCost = costToSheetAmount(transaction.cost, fourColumn);
    const values = fourColumn
        ? [[transaction.date, transaction.category, transaction.name, sheetCost]]
        : [[transaction.date, transaction.name, sheetCost]];
    const response = await fetchWithTimeout(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:D:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
    });
    await assertOk('Failed to add transaction', response);
}
async function listSpreadsheets(accessToken) {
    const response = await fetchWithTimeout(`https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&fields=files(id,name)&pageSize=100&orderBy=name`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    await assertOk('Failed to fetch spreadsheets', response);
    return response.json();
}
function calculateStatistics(transactions) {
    const expenses = transactions.filter((t) => t.cost < 0);
    const income = transactions.filter((t) => t.cost > 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.cost), 0);
    const totalIncome = income.reduce((sum, t) => sum + t.cost, 0);
    const netAmount = totalIncome - totalExpenses;
    const dailyMap = new Map();
    const weeklyMap = new Map();
    const monthlyMap = new Map();
    const quarterMap = new Map();
    const itemMap = new Map();
    const categoryMap = new Map();
    expenses.forEach((t) => {
        const date = new Date(t.date);
        const dateStr = t.date;
        const weekStr = getWeekString(date);
        const monthStr = date.toISOString().slice(0, 7);
        dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + Math.abs(t.cost));
        weeklyMap.set(weekStr, (weeklyMap.get(weekStr) || 0) + Math.abs(t.cost));
        monthlyMap.set(monthStr, (monthlyMap.get(monthStr) || 0) + Math.abs(t.cost));
        const quarterStr = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
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
function getWeekString(date) {
    const year = date.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}
