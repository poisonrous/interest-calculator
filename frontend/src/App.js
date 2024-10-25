import './App.css';
import Row from "./components/Row";
import FileUpload from "./components/FileUpload";
import { useState } from 'react';
import * as XLSX from 'xlsx';

function App() {
  const [rows, setRows] = useState([{ id: 1, amount: '', start: '', end: '' }]);
  const [endDate, setEndDate] = useState('');
  const [total, setTotal] = useState(0);

  const addRow = () => {
    setRows([...rows, { id: rows.length + 1, amount: '', start: '', end: endDate }]);
  };

  const deleteRow = (id) => {
    if (rows.length > 1) {
      const updatedRows = rows.filter(row => row.id !== id);
      setRows(updatedRows);

      // Recalcular el total después de eliminar una fila
      let newTotal = 0;
      updatedRows.forEach(row => {
        const interest = parseFloat(document.getElementById(`payment-total-${row.id}`).value) || 0;
        newTotal += interest;
      });
      setTotal(parseFloat(newTotal.toFixed(2)));
    } else {
      alert('Debe haber al menos un Row.');
    }
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    const anyInvalidStart = rows.some(row => new Date(row.start) > new Date(newEndDate));
    if (anyInvalidStart) {
      alert('La fecha global de fin no puede ser anterior a ninguna fecha de inicio.');
    } else {
      setEndDate(newEndDate);
      setRows(rows.map(row => ({ ...row, end: newEndDate })));
    }
  };

  const handleInputChange = (id, field, value) => {
    if (field === 'start' && new Date(value) > new Date(endDate)) {
      alert('La fecha de inicio debe ser anterior a la fecha de fin.');
    } else {
      setRows(rows.map(row => (row.id === id ? { ...row, [field]: value } : row)));
    }
  };

  const calculateInterest = () => {
    let newTotal = 0;

    rows.forEach(row => {
      fetch('http://localhost:3001/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: row.amount,
          startDate: row.start,
          endDate: row.end
        })
      })
          .then(response => response.json())
          .then(data => {
            const interest = data.interest;
            document.getElementById(`payment-total-${row.id}`).value = interest;
            newTotal += parseFloat(interest);
            setTotal(parseFloat(newTotal.toFixed(2)));
          })
          .catch(error => {
            console.error(error);
          });
    });
  };

  const handleFileUploaded = (data) => {
    console.log('Datos transformados antes de setRows:', data);
    const newRows = data.map((row, index) => ({
      id: index + 1,
      amount: row.amount,
      start: row.start,
      end: endDate // Usar la fecha de fin seleccionada en el frontend
    }));
    console.log('Filas nuevas:', newRows);
    setRows(newRows);
  };

  const exportToExcel = () => {
    const exportData = rows.map(row => ({
      amount: row.amount,
      start: row.start,
      end: row.end,
      interest: document.getElementById(`payment-total-${row.id}`).value
    }));

    // Añadir una fila con el total al final
    exportData.push({
      amount: '',
      start: '',
      end: '',
      interest: `Total: ${total}`
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Interests');
    XLSX.writeFile(workbook, 'Interests.xlsx');
  };

  return (
      <div className="App">
        <h1>Calcular Interés Anual</h1>
        <div className="calculator">
          <div className="global">
            <h3>Total: {total}</h3>
            <input type={'date'} id={'end-global'} value={endDate} onChange={handleEndDateChange} />
          </div>
          {rows.map(row => (
              <Row
                  key={row.id}
                  id={row.id}
                  amount={row.amount}
                  start={row.start}
                  end={row.end}
                  endDate={endDate}
                  onDelete={() => deleteRow(row.id)}
                  onInputChange={handleInputChange}
              />
          ))}
          <button className={'fullbutton'} onClick={addRow}>Agregar</button>
          <FileUpload onFileUploaded={handleFileUploaded} />
          <button className={'fullbutton action'} onClick={calculateInterest}>Calcular</button>
          <button className={'fullbutton'} onClick={exportToExcel}>Exportar a Excel</button>
        </div>
      </div>
  );
}

export default App;
