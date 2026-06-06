// ══════════════════════════════════════════════════════════════════════════
//  GastosPro — Google Apps Script
//  Pega este código en script.google.com e implementa como Aplicación Web
//  Reemplaza TU_SHEET_ID con el ID de tu Google Sheet
// ══════════════════════════════════════════════════════════════════════════

const SHEET_ID   = 'TU_SHEET_ID';   // ← Reemplaza esto
const SHEET_NAME = 'Gastos';

// Cabeceras de la hoja
const HEADERS = ['ID','Fecha','Descripción','Categoría','Monto','Tipo','Método','Notas','Creado'];

function getSheet() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  let sheet   = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    // Formato de cabeceras
    const head = sheet.getRange(1, 1, 1, HEADERS.length);
    head.setBackground('#2d6a4f').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setFrozenRows(1);
    // Ancho de columnas
    sheet.setColumnWidth(1, 120);  // ID
    sheet.setColumnWidth(2, 100);  // Fecha
    sheet.setColumnWidth(3, 220);  // Descripción
    sheet.setColumnWidth(4, 130);  // Categoría
    sheet.setColumnWidth(5, 100);  // Monto
    sheet.setColumnWidth(6, 110);  // Tipo
    sheet.setColumnWidth(7, 140);  // Método
    sheet.setColumnWidth(8, 200);  // Notas
    sheet.setColumnWidth(9, 160);  // Creado
  }
  return sheet;
}

// ── GET: lee todos los gastos ──────────────────────────────────────────────
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  if (action === 'get') {
    return handleGet();
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'GastosPro API funcionando' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleGet() {
  try {
    const sheet  = getSheet();
    const data   = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return jsonResponse({ rows: [] });
    }
    const rows = data.slice(1).map(r => ({
      id:       r[0] ? r[0].toString() : '',
      date:     r[1] ? Utilities.formatDate(new Date(r[1]), 'America/Lima', 'yyyy-MM-dd') : '',
      desc:     r[2] || '',
      category: r[3] || '',
      amount:   parseFloat(r[4]) || 0,
      tipo:     r[5] || '',
      method:   r[6] || '',
      notes:    r[7] || '',
    })).filter(r => r.id);
    return jsonResponse({ rows });
  } catch(err) {
    return jsonResponse({ error: err.message }, true);
  }
}

// ── POST: añade un nuevo gasto ────────────────────────────────────────────
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === 'add') {
      return handleAdd(body);
    }
    if (action === 'delete') {
      return handleDelete(body.id);
    }
    return jsonResponse({ error: 'Acción no reconocida' }, true);
  } catch(err) {
    return jsonResponse({ error: err.message }, true);
  }
}

function handleAdd(g) {
  const sheet = getSheet();
  const row = [
    g.id || Date.now().toString(),
    g.date,
    g.desc,
    g.category,
    parseFloat(g.amount),
    g.tipo || '',
    g.method || '',
    g.notes || '',
    new Date().toLocaleString('es-PE')
  ];
  sheet.appendRow(row);

  // Formatear la fila recién añadida
  const lastRow = sheet.getLastRow();
  const ci = getCatColor(g.category);
  sheet.getRange(lastRow, 4).setBackground(ci.bg).setFontColor(ci.color);
  sheet.getRange(lastRow, 5).setNumberFormat('S/ #,##0.00');

  return jsonResponse({ status: 'added', id: row[0] });
}

function handleDelete(id) {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] && data[i][0].toString() === id.toString()) {
      sheet.deleteRow(i + 1);
      return jsonResponse({ status: 'deleted' });
    }
  }
  return jsonResponse({ error: 'No encontrado' }, true);
}

// ── HELPERS ───────────────────────────────────────────────────────────────
function jsonResponse(obj, isError) {
  const output = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

function getCatColor(cat) {
  const map = {
    'Alimentación':     { color: '#155724', bg: '#d4edda' },
    'Transporte':       { color: '#0c3574', bg: '#cce5ff' },
    'Vivienda':         { color: '#4a1566', bg: '#e8daef' },
    'Salud':            { color: '#7b1414', bg: '#f8d7da' },
    'Educación':        { color: '#0d5651', bg: '#d1ecf1' },
    'Entretenimiento':  { color: '#7a3700', bg: '#ffeeba' },
    'Ropa':             { color: '#7b1547', bg: '#ffd6e7' },
    'Servicios':        { color: '#0d3d6b', bg: '#d1ecf1' },
    'Ahorro':           { color: '#155724', bg: '#d4edda' },
    'Otros':            { color: '#383d41', bg: '#e2e3e5' },
  };
  return map[cat] || { color: '#383d41', bg: '#e2e3e5' };
}
