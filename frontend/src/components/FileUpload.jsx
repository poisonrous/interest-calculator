import React from 'react';
import * as XLSX from 'xlsx';
import '../App.css'
function FileUpload({ onFileUploaded }) {
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);

        // Transformar los datos al formato deseado
        const transformedData = json.map(row => {
          const excelDate = row.Fecha;
          const jsDate = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
          const formattedDate = jsDate.toISOString().split('T')[0];

          return {
            amount: row.Intereses,
            start: formattedDate
          };
        });

        onFileUploaded(transformedData);
      };
      reader.readAsBinaryString(file);
    }
  };

  return (
      <div className="file-upload">
        <input type="file" accept=".xlsx, .xls" id="file" onChange={handleFileUpload} />
        <label htmlFor="file" className="custom-file-upload">
          Subir archivo
        </label>
      </div>
  );
}

export default FileUpload;
