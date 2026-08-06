import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = './Marriage Halls - Training ready data.xlsx';

try {
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length > 0) {
        const areas = [...new Set(data.map(row => row.area || row.Area).filter(Boolean))].sort();
        console.log('AREAS_START');
        console.log(JSON.stringify(areas, null, 2));
        console.log('AREAS_END');
    } else {
        console.log('No data found in excel file');
    }
} catch (error) {
    console.error('Error reading excel file:', error);
}
