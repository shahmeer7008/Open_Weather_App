// server.js
const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(express.static('public'));
app.use(express.json());

const PORT = 3000;

app.post('/getWeather', async (req, res) => {
  const { city } = req.body;
  const apiKey = process.env.API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
                    
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.cod !== 200) {
      return res.status(400).json({ error: data.message || 'City not found' });
    }

    const weather = {
      city: data.name,
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].main,
      humidity: data.main.humidity,
      time: new Date().toLocaleString(),
      lat: data.coord.lat,
      lon: data.coord.lon
    };
     
    // Save to history
    let history = [];
    if (fs.existsSync('weatherHistory.json')) {
      history = JSON.parse(fs.readFileSync('weatherHistory.json'));
    }              
                     
    history.unshift(weather);
    history = history.slice(0, 10); // Keep only last 10 entries   
    fs.writeFileSync('weatherHistory.json', JSON.stringify(history));

    res.json({ 
      current: weather,
      history: history.slice(1) // Return all but current for history
    });        
  } catch (err) {          
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to get history
app.get('/getHistory', (req, res) => {
  try {
    if (fs.existsSync('weatherHistory.json')) {
      const history = JSON.parse(fs.readFileSync('weatherHistory.json'));
      return res.json(history.slice(0, 10)); // Return last 10 entries
    }    
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }                                                                                                      
});   
                         
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});                