import '../App.css';

function Row({ id, amount, start, end, endDate, onDelete, onInputChange }) {
  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, ''); // Solo permitir números y puntos
    onInputChange(id, 'amount', value);
  };

  const handleStartDateChange = (e) => {
    const value = e.target.value;
    if (new Date(value) > new Date(endDate)) {
      alert("La fecha de inicio debe ser anterior a la fecha de fin.");
    } else {
      onInputChange(id, 'start', value);
    }
  };

  return (
      <div className="Row">
        <input
            type={'text'}
            id={`amount-${id}`}
            value={amount}
            onChange={handleAmountChange}
        />
        <input
            type={'date'}
            id={`start-${id}`}
            value={start}
            onChange={handleStartDateChange}
        />
        <input
            type={'date'}
            id={`end-${id}`}
            value={end}
            readOnly
        />
        <input
            type={'text'}
            id={`payment-total-${id}`}
            disabled={true}
        />
        <button onClick={onDelete}><i className="fa-solid fa-trash-can"></i></button>
      </div>
  );
}

export default Row;
