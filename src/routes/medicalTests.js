// /src/routes/medicalTests.js
const express = require('express');
const multer  = require('multer');
const XLSX    = require('xlsx');
const MedicalTest = require('../models/MedicalTest');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

function parseSheet(sheet) {
  const rows     = XLSX.utils.sheet_to_json(sheet, { header:1, blankrows:false });
  const hdrIdx   = rows.findIndex(r=>r.includes('Exam No') && r.includes('Exam Name'));
  if (hdrIdx<0) return [];

  const headers = rows[hdrIdx].map(h=>h?.toString().trim());
  const meta    = rows[hdrIdx-1]||[];
  let examType='', departmentName='';
  meta.forEach(cell=>{
    const s=cell?.toString();
    if (s?.startsWith('Exam Type'))       examType = s.split(':')[1]?.trim();
    if (s?.startsWith('Department Name'))  departmentName = s.split(':')[1]?.trim();
  });

  const data=[];
  rows.slice(hdrIdx+1).forEach(row=>{
    if (!row.length) return;
    const obj={ examType, departmentName };
    headers.forEach((h,j)=>{
      const v=row[j];
      switch(h){
        case 'Exam No':       obj.examNo       = Number(v); break;
        case 'Exam Name':     obj.examName     = v;           break;
        case 'Short Name':    obj.shortName    = v;           break;
        case 'Active Status': obj.active       = String(v).toLowerCase()==='active'; break;
        case 'Rate':          obj.rate         = Number(v);   break;
        case 'Delivery Hour': obj.deliveryHour = v;           break;
      }
    });
    if (obj.examNo!=null && obj.examName) data.push(obj);
  });
  return data;
}

// Upload & upsert
router.post('/upload', upload.single('file'), async (req,res)=>{
  if (!req.file) return res.status(400).json({ error:'No file sent.' });
  let tests=[];
  try {
    const wb = XLSX.read(req.file.buffer, { type:'buffer', sheetStubs:true });
    wb.SheetNames.forEach(name=>{
      tests.push(...parseSheet(wb.Sheets[name]));
    });
  } catch (e) {
    return res.status(400).json({ error:'Parse failed', details:e.message });
  }
  await MedicalTest.deleteMany({});
  const ins = await MedicalTest.insertMany(tests);
  res.json({ inserted: ins.length });
});

// List all
router.get('/', async (_req,res)=>{
  const all = await MedicalTest.find().sort({ examNo:1 });
  res.json(all);
});

// Download as csv|tsv|ods
router.get('/download', async (req,res)=>{
  const fmt = req.query.format || 'csv';
  const all = await MedicalTest.find().lean();
  const data = all.map(d=>({
    'Exam No': d.examNo,
    'Exam Name': d.examName,
    'Short Name': d.shortName,
    'Active Status': d.active?'Active':'Inactive',
    'Rate': d.rate,
    'Delivery Hour': d.deliveryHour,
    'Department Name': d.departmentName,
    'Exam Type': d.examType
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data, { skipHeader:false });
  XLSX.utils.book_append_sheet(wb, ws, 'Medical Tests');

  const bookType = fmt==='tsv'?'csv':fmt;
  const opts = { bookType, type:'buffer', ...(fmt==='tsv'&&{FS:'\t'}) };
  const buf = XLSX.write(wb, opts);
  const mime = { csv:'text/csv', tsv:'text/tab-separated-values', ods:'application/vnd.oasis.opendocument.spreadsheet' }[fmt]||'application/octet-stream';

  res.setHeader('Content-Disposition', `attachment; filename="medical-tests.${fmt}"`);
  res.setHeader('Content-Type', mime);
  res.send(buf);
});

// Update one
router.put('/:id', async (req,res)=>{
  const upd = await MedicalTest.findByIdAndUpdate(req.params.id, req.body, { new:true });
  if (!upd) return res.status(404).json({ error:'Not found' });
  res.json(upd);
});

module.exports = router;