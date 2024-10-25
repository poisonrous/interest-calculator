const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Configurar CORS
app.use(cors());
app.use(bodyParser.json());

let interestData = [];

const url = 'https://clientebancario.bde.es/pcb/es/menu-horizontal/productosservici/relacionados/tiposinteres/guia-textual/tiposinteresrefe/Tabla_tipos_de_interes_legal.html';

const fetchData = async () => {
  try {
    const response = await axios(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const meses = {
      'enero': '01',
      'febrero': '02',
      'marzo': '03',
      'abril': '04',
      'mayo': '05',
      'junio': '06',
      'julio': '07',
      'agosto': '08',
      'septiembre': '09',
      'octubre': '10',
      'noviembre': '11',
      'diciembre': '12'
    };
    $('table tbody tr').each(function(index, element) {
      const row = {};
      let year, start, end, interest;
      $(element).find('td').each(function(tdIndex) {
        let text = $(this).text().trim();
        text = text.replace(/Abre en ventana nueva/, '');
        const matchedYear = text.match(/\d{4}/);
        if (matchedYear) {
          year = matchedYear[0];
          if (tdIndex === 0) {
            if (text.includes('hasta')) {
              const mes = text.match(/hasta (\w+)/)[1];
              const mesNum = meses[mes.toLowerCase()];
              start = `${year}-01-01`;
              end = `${year}-${mesNum}-31`;
            } else if (text.includes('desde')) {
              const mes = text.match(/desde (\w+)/)[1];
              const mesNum = meses[mes.toLowerCase()];
              start = `${year}-${mesNum}-01`;
              end = `${year}-12-31`;
            } else {
              start = `${year}-01-01`;
              end = `${year}-12-31`;
            }
            row.start = start;
            row.end = end;
          }
        } else {
          interest = parseFloat(text.replace(',', '.')).toFixed(4) / 100;
          row.interest = interest;
        }
      });
      if (row.start && row.end && typeof row.interest !== 'undefined') {
        interestData.push(row);
      }
    });
    console.log('Datos de interés:', interestData);
  } catch (error) {
    console.log('Error al conectar con el servidor:', error.message);
  }
};

fetchData();

app.post('/api/calculate', (req, res) => {
  const { amount, startDate, endDate } = req.body;

  const interest = calculateInterest(amount, new Date(startDate), new Date(endDate));
  res.json({ interest });
});

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function calculateDaysBetweenDates(startDate, endDate) {
  return Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
}

function calculateInterest(amount, startDate, endDate) {
  console.log(amount);
  console.log(startDate);
  console.log(endDate);
  let totalInterest = 0;
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const rate = interestData.find(rate => {
      const rateStart = new Date(rate.start);
      const rateEnd = new Date(rate.end);
      return currentDate >= rateStart && currentDate <= rateEnd;
    });

    if (rate) {
      const periodStart = currentDate;
      const periodEnd = new Date(Math.min(new Date(rate.end).getTime(), endDate.getTime()));
      const daysInPeriod = calculateDaysBetweenDates(periodStart, periodEnd);
      const year = periodStart.getUTCFullYear();
      const daysInYear = isLeapYear(year) ? 366 : 365;
      const dailyInterest = rate.interest / daysInYear;
      const periodInterest = (amount * daysInPeriod * dailyInterest);

      console.log(`Period: ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`);
      console.log(`Days in period: ${daysInPeriod}`);
      console.log(`Interest rate: ${rate.interest}`);
      console.log(`Days in year: ${daysInYear}`);
      console.log(`Daily Interest: ${dailyInterest}`);
      console.log(`Corrected Interest for period: ${periodInterest.toFixed(10)}`);
      console.log(`Year for period: ${year}`);

      totalInterest += parseFloat(periodInterest.toFixed(2));

      currentDate = new Date(periodEnd);
      currentDate.setDate(currentDate.getDate() + 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  console.log(`Total Interest: ${totalInterest.toFixed(2)}`);
  return totalInterest.toFixed(2);
}

app.listen(port, () => {
  console.log(`Backend escuchando en el puerto ${port}`);
});
