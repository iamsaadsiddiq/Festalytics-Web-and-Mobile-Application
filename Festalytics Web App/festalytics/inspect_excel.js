import pkg from 'xlsx';
const { readFile, utils } = pkg;
import fs from 'fs';

const excelPath = 'Marriage Halls - Training ready data.xlsx';
const workbook = readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = utils.sheet_to_json(worksheet);

console.log('Columns:', Object.keys(data[0] || {}));
console.log('First Row:', data[0]);
