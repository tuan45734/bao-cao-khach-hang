/**
 * Đồng bộ dữ liệu Mobiwork -> data/kh.js, data/nh-{month}-2026.js, data/nh-all.js
 *
 * Chạy: node scripts/sync-mobiwork-data.js
 * Tùy chọn:
 *   --month=5 --year=2026
 *   --bills-only | --customers-only | --merge-only
 *   --bill-json=path   (nếu OpenAPI Bill lỗi auth, export JSON từ Postman rồi trỏ file này)
 *
 * Biến môi trường (tùy chọn):
 *   MOBIWORK_BASIC_AUTH  - Basic base64 (mặc định: admin5@acbt.com)
 *   MOBIWORK_OPENAPI_AUTH - Basic cho openapi.mobiwork.vn (nếu khác DMS)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';
import { CATEGORY_MAP, PRODUCT_MAP } from './product-catalog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');

/** DMS (RecordsV2, Routes) — admin5@acbt.com */
const DEFAULT_DMS_AUTH =
  'YWRtaW41QGFjYnQuY29tOmFjZjY4MTljNmNiZjJlMGZkNGE2Njg5MjQ5NjAzODFi';
/** OpenAPI Bill — tài khoản OpenAPI riêng (xem lay_du_lieu_sp/config.js) */
const DEFAULT_OPENAPI_AUTH =
  'NjlhZTZlNmM4YTY0NjVmNDFlNTNhZmI0OjFuYzFnc3J1N2p2Ym10eTdncGV5NWk=';
const ORG_ID = '67eb9cf392d9028035624d91';
const CUSTOMER_FORM_ID = '67eb9cf392d9028035624d98';

const DMS_BASE = 'https://api.mobiwork.vn:4014';
const OPENAPI_BASE = 'https://openapi.mobiwork.vn';

const CUSTOMER_BODY = {
  objfind: {},
  objorder: { createdDate: -1 },
  objdrop: {
    titlekd: 0,
    syncDate: 0,
    'settings.inventory': 0,
    'settings.addNew': 0,
    'settings.lien_he': 0,
    'settings.lat': 0,
    'settings.long': 0,
    'settings.payment': 0,
    project: 0,
    assignTo: 0,
    orgid: 0,
    clientid: 0,
    form: 0,
    repeatableData: 0,
  },
};

function parseArgs(argv) {
  const opts = {
    month: 5,
    year: 2026,
    billsOnly: false,
    customersOnly: false,
    mergeOnly: false,
    billJson: null,
  };
  for (const arg of argv) {
    if (arg.startsWith('--month=')) opts.month = Number(arg.split('=')[1]);
    else if (arg.startsWith('--year=')) opts.year = Number(arg.split('=')[1]);
    else if (arg === '--bills-only') opts.billsOnly = true;
    else if (arg === '--customers-only') opts.customersOnly = true;
    else if (arg === '--merge-only') opts.mergeOnly = true;
    else if (arg.startsWith('--bill-json=')) opts.billJson = arg.slice('--bill-json='.length);
  }
  return opts;
}

function authHeader(kind = 'dms') {
  const raw =
    kind === 'openapi'
      ? process.env.MOBIWORK_OPENAPI_AUTH || DEFAULT_OPENAPI_AUTH
      : process.env.MOBIWORK_DMS_AUTH ||
        process.env.MOBIWORK_BASIC_AUTH ||
        DEFAULT_DMS_AUTH;
  const token = raw.startsWith('Basic ') ? raw.slice(6) : raw;
  return { Authorization: `Basic ${token}` };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function formatBillDate(year, month, day) {
  return `${day}/${month}/${year}`;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Không parse JSON (${res.status}): ${text.slice(0, 300)}`);
  }
  if (!res.ok && data?.message) {
    throw new Error(`${res.status}: ${data.message}`);
  }
  return { status: res.status, data, text };
}

function formatDateVN(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function emailToMaNv(email) {
  if (!email) return '';
  const local = email.split('@')[0] || '';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function fieldView(obj, key) {
  const f = obj?.[key];
  if (!f) return '';
  return (f.viewData ?? f.choice_values ?? '').toString().trim();
}

function normalizeImageUrl(url) {
  if (!url) return '';
  return url.replace(/^http:\/\//i, 'https://');
}

async function loadRoutesWithEmail() {
  const byId = new Map();
  const byEmail = new Map();
  const { data } = await fetchJson(
    `${DMS_BASE}/Routes?orgid=${ORG_ID}&next=10000`,
    { headers: authHeader('dms') }
  );
  for (const route of data?.result || []) {
    const email = route?.member?.email;
    const info = {
      npp: route?.group?.name || '',
      ma_nv: emailToMaNv(email),
      ten_nv: route?.member?.name || '',
    };
    byId.set(route._id, info);
    if (email && info.npp) byEmail.set(email, info.npp);
  }
  console.log(`  Đã tải ${byId.size} tuyến (Routes) cho NPP/NV`);
  return { byId, byEmail };
}

function resolveStaff(record, routeById, routeByEmail) {
  const settings = record.settings || {};
  const orderBy = settings.lastOrderBy || settings.lastVisitBy || {};
  const modified = record.modifiedBy || {};
  const assign = record.assignTo || {};
  const created = record.createdBy || {};

  const email =
    orderBy.email || modified.email || assign.email || created.email || '';
  const name =
    orderBy.name || modified.name || assign.name || created.name || '';
  const ma_nv = emailToMaNv(email);
  let npp = routeByEmail.get(email) || '';

  const routeIds = settings?.addNew?.routeid;
  if (Array.isArray(routeIds) && routeIds.length > 0) {
    const routeInfo = routeById.get(routeIds[0]);
    if (routeInfo?.npp) npp = routeInfo.npp;
    if (routeInfo?.ten_nv && !name) return { ...routeInfo, ma_nv: routeInfo.ma_nv || ma_nv };
    if (routeInfo?.ma_nv && !ma_nv) {
      return {
        npp: npp || routeInfo.npp,
        ma_nv: routeInfo.ma_nv,
        ten_nv: name || routeInfo.ten_nv,
      };
    }
  }

  return { npp, ma_nv, ten_nv: name };
}

function transformCustomer(record, routeById, routeByEmail) {
  const d = record.data || {};
  const staff = resolveStaff(record, routeById, routeByEmail);
  const imageList = d.hinh_anh?.image_url;
  const anh = normalizeImageUrl(
    Array.isArray(imageList) && imageList.length ? imageList[0] : ''
  );

  return {
    ngay_tao: formatDateVN(record.createdDate),
    vi_do: String(record.lat ?? ''),
    kinh_do: String(record.long ?? ''),
    ma_kh: fieldView(d, 'ma_khach_hang'),
    loai: fieldView(d, 'loai_khach_hang'),
    kenh: fieldView(d, 'kenh'),
    anh,
    npp: staff.npp,
    ma_nv: staff.ma_nv,
    ten_nv: staff.ten_nv,
  };
}

async function fetchAllCustomers() {
  const { byId: routeById, byEmail: routeByEmail } = await loadRoutesWithEmail();
  const pageSize = 15000;
  let skip = 0;
  const all = [];

  while (true) {
    const url = `${DMS_BASE}/RecordsV2?getGeoJson=0&isCustomerWeb=1&geom2=&datechoice=cdate&fromdate=null&todate=null&next=${pageSize}&skip=${skip}&formID=${CUSTOMER_FORM_ID}`;
    const { data } = await fetchJson(url, {
      method: 'POST',
      headers: { ...authHeader('dms'), 'Content-Type': 'application/json' },
      body: JSON.stringify(CUSTOMER_BODY),
    });

    const batch = data?.result || [];
    if (!batch.length) break;

    for (const rec of batch) {
      if (rec.isDeleted) continue;
      const row = transformCustomer(rec, routeById, routeByEmail);
      if (row.ma_kh) all.push(row);
    }

    console.log(`  Khách hàng: skip=${skip}, +${batch.length} (tổng ${all.length})`);
    if (batch.length < pageSize) break;
    skip += pageSize;
  }

  all.sort((a, b) => a.ma_kh.localeCompare(b.ma_kh, 'vi'));
  return all;
}

function normalizeMaSp(ma) {
  if (!ma) return '';
  const i = ma.indexOf('_');
  return (i > 0 ? ma.slice(0, i) : ma).toUpperCase();
}

function isTraThuongTB(sp) {
  if (!sp) return false;
  const ma = (sp.ma_sp || sp.ma_san_pham || '').toLowerCase();
  const ten = (sp.ten_sp || sp.ten_san_pham || '').toLowerCase();
  if (/trả\s*thưởng|tra\s*thuong|thưởng\s*tb|thuong\s*tb/.test(ten)) return true;
  if (/_t\d+\.|_tb/i.test(ma)) return true;
  return false;
}

function billLineItems(bill) {
  const items = [...(bill.san_pham || []), ...(bill.san_pham_km || [])];
  for (const promo of bill.promotion || []) {
    for (const p of promo.product || []) {
      items.push({
        ma_sp: p.ma_san_pham,
        ten_sp: p.ten_san_pham,
      });
    }
  }
  return items;
}

function buildCategoryMappingFromBills(bills) {
  const mapping = {};

  for (const bill of bills) {
    const maKH = bill.ma_kh;
    if (!maKH) continue;

    for (const sp of billLineItems(bill)) {
      if (isTraThuongTB(sp)) continue;
      const ma = normalizeMaSp(sp.ma_sp || sp.ma_san_pham);
      const category = CATEGORY_MAP.get(ma);
      const productName = PRODUCT_MAP.get(ma);
      if (!category || !productName) continue;

      if (!mapping[category]) mapping[category] = {};
      if (!mapping[category][productName]) mapping[category][productName] = new Set();
      mapping[category][productName].add(maKH);
    }
  }

  const sorted = {};
  for (const cat of Object.keys(mapping).sort((a, b) => a.localeCompare(b, 'vi'))) {
    sorted[cat] = {};
    for (const prod of Object.keys(mapping[cat]).sort((a, b) =>
      a.localeCompare(b, 'vi')
    )) {
      sorted[cat][prod] = [...mapping[cat][prod]].sort((a, b) =>
        a.localeCompare(b, 'vi')
      );
    }
  }
  return sorted;
}

async function fetchBillsFromOpenApi(tuNgay, denNgay) {
  const pageSize = 3000;
  let pageNumber = 1;
  const allBills = [];

  while (true) {
    const qs = new URLSearchParams({
      tu_ngay: tuNgay,
      den_ngay: denNgay,
      kieu_ngay: ' ',
      page_size: String(pageSize),
      page_number: String(pageNumber),
    });
    const url = `${OPENAPI_BASE}/OpenAPI/V1/Bill?${qs}`;
    const { data, text } = await fetchJson(url, {
      headers: { ...authHeader('openapi'), accept: 'application/json' },
    });

    if (data?.status === false) {
      throw new Error(data.message || text);
    }

    const batch = data?.data || [];
    allBills.push(...batch);
    console.log(
      `  Bill trang ${pageNumber}: ${batch.length} hóa đơn (tổng ${allBills.length}/${data?.total ?? '?'})`
    );

    if (!batch.length || batch.length < pageSize) break;
    pageNumber += 1;
    await sleep(120);
    if (pageNumber > 50) break;
  }

  return allBills;
}

function loadBillJson(filePath) {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
  const raw = JSON.parse(fs.readFileSync(abs, 'utf8'));
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  return [];
}

function mergeCategoryMappings(maps) {
  const merged = {};
  for (const map of maps) {
    for (const [category, products] of Object.entries(map)) {
      if (!merged[category]) merged[category] = {};
      for (const [product, codes] of Object.entries(products)) {
        if (!merged[category][product]) merged[category][product] = new Set();
        for (const code of codes) merged[category][product].add(code);
      }
    }
  }
  const result = {};
  for (const cat of Object.keys(merged).sort((a, b) => a.localeCompare(b, 'vi'))) {
    result[cat] = {};
    for (const prod of Object.keys(merged[cat]).sort((a, b) =>
      a.localeCompare(b, 'vi')
    )) {
      result[cat][prod] = [...merged[cat][prod]].sort((a, b) =>
        a.localeCompare(b, 'vi')
      );
    }
  }
  return result;
}

function loadMappingFromJsFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(content, sandbox, { filename: filePath });
  const match = content.match(/window\.(categoryMapping_[^\s=]+)\s*=/);
  if (!match) return null;
  return sandbox.window[match[1]] || null;
}

function serializeCategoryMapping(varName, mapping) {
  const json = JSON.stringify(mapping, null, 2);
  return `window.${varName} =${json};\n`;
}

function serializeCustomers(customers) {
  const lines = customers.map((c) => {
    const o = {
      ngay_tao: c.ngay_tao,
      vi_do: c.vi_do,
      kinh_do: c.kinh_do,
      ma_kh: c.ma_kh,
      loai: c.loai,
      kenh: c.kenh,
      anh: c.anh,
      npp: c.npp,
      ma_nv: c.ma_nv,
      ten_nv: c.ten_nv,
    };
    const inner = Object.entries(o)
      .map(([k, v]) => `"${k}": ${JSON.stringify(v)}`)
      .join(',   ');
    return ` {   ${inner} }`;
  });
  return `window.customersData =[\n${lines.join(',\n')}\n];\n`;
}

const MONTH_FILES = [
  { month: 1, file: 'nh-1-2026.js', var: 'categoryMapping_1_2026' },
  { month: 2, file: 'nh-2-2026.js', var: 'categoryMapping_2_2026' },
  { month: 3, file: 'nh-3-2026.js', var: 'categoryMapping_3_2026' },
  { month: 4, file: 'nh-4-2026.js', var: 'categoryMapping_4_2026' },
  { month: 5, file: 'nh-5-2026.js', var: 'categoryMapping_5_2026' },
];

async function mergeAllMonths() {
  const maps = [];
  for (const { file } of MONTH_FILES) {
    const fp = path.join(DATA_DIR, file);
    if (!fs.existsSync(fp)) {
      console.warn(`  Bỏ qua (không có file): ${file}`);
      continue;
    }
    const map = loadMappingFromJsFile(fp);
    if (map) {
      maps.push(map);
      console.log(`  Đọc ${file}`);
    }
  }
  const merged = mergeCategoryMappings(maps);
  const out = path.join(DATA_DIR, 'nh-all.js');
  fs.writeFileSync(out, serializeCategoryMapping('categoryMapping_all', merged), 'utf8');
  console.log(`✓ Đã ghi ${out}`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const lastDay = new Date(opts.year, opts.month, 0).getDate();
  const tuNgay = formatBillDate(opts.year, opts.month, 1);
  const denNgay = formatBillDate(opts.year, opts.month, lastDay);
  const monthFile = `nh-${opts.month}-${opts.year}.js`;
  const monthVar = `categoryMapping_${opts.month}_${opts.year}`;

  console.log('=== Đồng bộ Mobiwork ===\n');

  if (opts.mergeOnly) {
    console.log('Gộp tất cả tháng -> nh-all.js');
    await mergeAllMonths();
    return;
  }

  let billsOk = false;

  if (!opts.customersOnly) {
    console.log(`\n[1] Ngành hàng tháng ${opts.month}/${opts.year} (${tuNgay} - ${denNgay})`);
    try {
      let bills;
      if (opts.billJson) {
        console.log(`  Đọc Bill từ file: ${opts.billJson}`);
        bills = loadBillJson(opts.billJson);
      } else {
        bills = await fetchBillsFromOpenApi(tuNgay, denNgay);
      }
      const mapping = buildCategoryMappingFromBills(bills);
      const outPath = path.join(DATA_DIR, monthFile);
      fs.writeFileSync(
        outPath,
        serializeCategoryMapping(monthVar, mapping),
        'utf8'
      );
      console.log(
        `✓ ${outPath} (${Object.keys(mapping).length} ngành, ${bills.length} hóa đơn)`
      );
      billsOk = true;
    } catch (err) {
      console.error(`✗ Bill API thất bại: ${err.message}`);
      console.error(
        '  Gợi ý: export JSON từ Postman rồi chạy lại với --bill-json=data/bill-export.json'
      );
      console.error(
        '  OpenAPI Bill dùng MOBIWORK_OPENAPI_AUTH (khác MOBIWORK_DMS_AUTH).'
      );
    }
  }

  if (!opts.billsOnly) {
    console.log('\n[2] Khách hàng (RecordsV2)');
    try {
      const customers = await fetchAllCustomers();
      const khPath = path.join(DATA_DIR, 'kh.js');
      fs.writeFileSync(khPath, serializeCustomers(customers), 'utf8');
      console.log(`✓ ${khPath} (${customers.length} khách hàng)`);
    } catch (err) {
      console.error(`✗ Khách hàng thất bại: ${err.message}`);
      process.exitCode = 1;
    }
  }

  if (billsOk && !opts.customersOnly && !opts.billsOnly) {
    console.log('\n[3] Gộp tháng 1-5 -> nh-all.js');
    await mergeAllMonths();
  } else if (billsOk && opts.billsOnly) {
    console.log('\n[3] Gộp tháng 1-5 -> nh-all.js');
    await mergeAllMonths();
  }

  console.log('\nHoàn tất.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
