(function(){
  const CACHE_KEY = 'weather_cache_v1';
  const CACHE_TTL = 1000 * 60 * 30;
  const wmo = code => {
    if(code === 0) return {icon:'☀️', label:'Clear'};
    if([1,2].includes(code)) return {icon:'🌤️', label:'Partly cloudy'};
    if(code === 3) return {icon:'☁️', label:'Cloudy'};
    if([45,48].includes(code)) return {icon:'🌫️', label:'Fog'};
    if([51,53,55,56,57].includes(code)) return {icon:'🌦️', label:'Drizzle'};
    if([61,63,65,66,67,80,81,82].includes(code)) return {icon:'🌧️', label:'Rain'};
    if([71,73,75,77,85,86].includes(code)) return {icon:'🌨️', label:'Snow'};
    if([95,96,99].includes(code)) return {icon:'⛈️', label:'Thunderstorm'};
    return {icon:'🌡️', label:'Weather'};
  };

  function cacheGet(){
    try { return JSON.parse(localStorage.getItem('nyc2026_'+CACHE_KEY)); } catch { return null; }
  }
  function cacheSet(data){ localStorage.setItem('nyc2026_'+CACHE_KEY, JSON.stringify({ts:Date.now(), data})); }

  async function fetchForecast(force=false){
    const cached = cacheGet();
    if(!force && cached && Date.now()-cached.ts < CACHE_TTL) return {data:cached.data, cached:false, ts:cached.ts};
    const c = NYC_DATA.trip.weather;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.latitude}&longitude=${c.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&hourly=temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m&timezone=America%2FNew_York&forecast_days=16`;
    try{
      const r = await fetch(url, {cache:'no-store'});
      if(!r.ok) throw new Error('weather fetch failed');
      const data = await r.json();
      cacheSet(data);
      return {data, cached:false, ts:Date.now()};
    }catch(e){
      if(cached) return {data:cached.data, cached:true, ts:cached.ts};
      throw e;
    }
  }

  function dailyFor(data, date){
    const i = data?.daily?.time?.indexOf(date);
    if(i == null || i < 0) return null;
    const meta = wmo(data.daily.weather_code[i]);
    return { date, ...meta, max:Math.round(data.daily.temperature_2m_max[i]), min:Math.round(data.daily.temperature_2m_min[i]), rain:data.daily.precipitation_probability_max[i] };
  }

  function hourlyFor(data, date, time){
    if(!data?.hourly?.time || !time || !/^\d{2}:\d{2}$/.test(time)) return null;
    const target = `${date}T${time.slice(0,2)}:00`;
    let i = data.hourly.time.indexOf(target);
    if(i < 0){
      const prefix = `${date}T${time.slice(0,2)}`;
      i = data.hourly.time.findIndex(x=>x.startsWith(prefix));
    }
    if(i < 0) return null;
    const meta = wmo(data.hourly.weather_code[i]);
    return { ...meta, temp:Math.round(data.hourly.temperature_2m[i]), feels:Math.round(data.hourly.apparent_temperature[i]), rain:data.hourly.precipitation_probability[i], wind:Math.round(data.hourly.wind_speed_10m[i]) };
  }

  window.TripWeather = { fetchForecast, dailyFor, hourlyFor, wmo, cacheGet };
})();
