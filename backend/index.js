const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios'); // Usar axios nuevamente
const cheerio = require('cheerio');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

// Configurar CORS
const allowedOrigins = ['https://interest-calculator-olive-six.vercel.app', 'https://interest-calculator-7th04eufm-poisonrous-projects.vercel.app'];
app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'La política de CORS para este sitio no permite el acceso desde el origen especificado.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));
app.use(bodyParser.json());

let interestData = [
      { start: '2024-01-01', end: '2024-12-31', interest: 0.0325 },
      { start: '2023-01-01', end: '2023-12-31', interest: 0.0325 },
      { start: '2022-01-01', end: '2022-12-31', interest: 0.03 },
      { start: '2021-01-01', end: '2021-12-31', interest: 0.03 },
      { start: '2020-01-01', end: '2020-12-31', interest: 0.03 },
      { start: '2019-01-01', end: '2019-12-31', interest: 0.03 },
      { start: '2018-01-01', end: '2018-12-31', interest: 0.03 },
      { start: '2017-01-01', end: '2017-12-31', interest: 0.03 },
      { start: '2016-01-01', end: '2016-12-31', interest: 0.03 },
      { start: '2015-01-01', end: '2015-12-31', interest: 0.035 },
      { start: '2014-01-01', end: '2014-12-31', interest: 0.04 },
      { start: '2013-01-01', end: '2013-12-31', interest: 0.04 },
      { start: '2012-01-01', end: '2012-12-31', interest: 0.04 },
      { start: '2011-01-01', end: '2011-12-31', interest: 0.04 },
      { start: '2010-01-01', end: '2010-12-31', interest: 0.04 },
      { start: '2009-01-01', end: '2009-03-31', interest: 0.055 },
      { start: '2009-04-01', end: '2009-12-31', interest: 0.04 },
      { start: '2008-01-01', end: '2008-12-31', interest: 0.055 },
      { start: '2007-01-01', end: '2007-12-31', interest: 0.05 },
      { start: '2006-01-01', end: '2006-12-31', interest: 0.04 },
      { start: '2005-01-01', end: '2005-12-31', interest: 0.04 },
      { start: '2004-01-01', end: '2004-12-31', interest: 0.0375 },
      { start: '2003-01-01', end: '2003-12-31', interest: 0.0425 },
      { start: '2002-01-01', end: '2002-12-31', interest: 0.0425 },
      { start: '2001-01-01', end: '2001-12-31', interest: 0.055 },
      { start: '2000-01-01', end: '2000-12-31', interest: 0.0425 },
      { start: '1999-01-01', end: '1999-12-31', interest: 0.0425 },
      { start: '1998-01-01', end: '1998-12-31', interest: 0.055 },
      { start: '1997-01-01', end: '1997-12-31', interest: 0.075 },
      { start: '1996-01-01', end: '1996-12-31', interest: 0.09 },
      { start: '1995-01-01', end: '1995-12-31', interest: 0.09 }
    ];
const url = 'https://clientebancario.bde.es/pcb/es/menu-horizontal/productosservici/relacionados/tiposinteres/guia-textual/tiposinteresrefe/Tabla_tipos_de_interes_legal.html';

const fetchData = async () => {
  console.log('Inicio del fetchData'); // Log inicial para verificar si se llama la función
  try {
    const response = await axios.get(url);
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
    console.log('Datos de interés cargados:', interestData.length, 'entradas'); // Log adicional
  } catch (error) {
    console.log('Error al conectar con el servidor:', error.message);
  }
};

fetchData()
    .then(() => console.log('fetchData ejecutado correctamente')) // Verificación de ejecución
    .catch(error => console.log('Error en fetchData:', error.message));

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

      console.log(`Período: ${periodStart.toISOString().split('T')[0]} a ${periodEnd.toISOString().split('T')[0]}`);
      console.log(`Días en el período: ${daysInPeriod}`);
      console.log(`Tasa de interés: ${rate.interest}`);
      console.log(`Días en el año: ${daysInYear}`);
      console.log(`Interés diario: ${dailyInterest}`);
      console.log(`Interés corregido para el período: ${periodInterest.toFixed(10)}`);
      console.log(`Año del período: ${year}`);

      totalInterest += parseFloat(periodInterest.toFixed(2));
      currentDate = new Date(periodEnd);
      currentDate.setDate(currentDate.getDate() + 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  console.log(`Interés total: ${totalInterest.toFixed(2)}`);
  return totalInterest.toFixed(2);
}

app.listen(port, () => {
  console.log(`Backend escuchando en el puerto ${port}`);
});
