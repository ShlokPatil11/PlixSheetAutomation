const SPREADSHEET_ID = "17LzvdnEhp2Vf3Q8sjKVDL2bmXYB3ZimBNIp8PVIaMgw";
const MAX_PREVIEW_ROWS = 100;

// Read-only Google Visualization query adapter. It exposes no mutation method.
export function loadSheetPreview(sheetName) {
  return new Promise((resolve, reject) => {
    const callbackName = `__bpeSheet_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => finish(new Error("The sheet preview timed out.")), 15000);

    function cleanup() {
      window.clearTimeout(timeout);
      script.remove();
      delete window[callbackName];
    }

    function finish(error, value) {
      cleanup();
      if (error) reject(error);
      else resolve(value);
    }

    window[callbackName] = response => {
      if (!response || response.status !== "ok") {
        const message = response?.errors?.[0]?.detailed_message || "Google Sheets returned an unreadable response.";
        return finish(new Error(message));
      }
      const table = response.table || { cols: [], rows: [] };
      const columns = table.cols.map((column, index) => column.label || column.id || `Column ${index + 1}`);
      const rows = table.rows.slice(0, MAX_PREVIEW_ROWS).map(row => columns.map((_, index) => {
        const cell = row.c?.[index];
        if (!cell) return "";
        return cell.f ?? cell.v ?? "";
      }));
      finish(null, { sheetName, columns, rows, truncated: table.rows.length > MAX_PREVIEW_ROWS });
    };

    const query = encodeURIComponent(`select * limit ${MAX_PREVIEW_ROWS + 1}`);
    const handler = encodeURIComponent(`out:json;responseHandler:${callbackName}`);
    script.src = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=${handler}&sheet=${encodeURIComponent(sheetName)}&headers=1&tq=${query}`;
    script.referrerPolicy = "no-referrer";
    script.onerror = () => finish(new Error("The public sheet could not be read."));
    document.head.append(script);
  });
}

