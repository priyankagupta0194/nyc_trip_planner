(function(){
  const P = 'nyc2026_';
  const get = (key, fallback=null) => {
    try { const v = localStorage.getItem(P+key); return v === null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  };
  const set = (key, value) => localStorage.setItem(P+key, JSON.stringify(value));
  const remove = key => localStorage.removeItem(P+key);
  const allKeys = () => Object.keys(localStorage).filter(k=>k.startsWith(P));

  window.TripStore = {
    get, set, remove,
    status(id){ return get('status_'+id, 'pending'); },
    setStatus(id, status){ set('status_'+id, status); },
    note(id){ return get('note_'+id, ''); },
    setNote(id, note){ set('note_'+id, note); },
    selectedRestaurant(mealId){ return get('meal_'+mealId, null); },
    setSelectedRestaurant(mealId, restaurantId){ set('meal_'+mealId, restaurantId); },
    customRestaurants(){ return get('custom_restaurants', []); },
    setCustomRestaurants(items){ set('custom_restaurants', items); },
    customStops(){ return get('custom_stops', []); },
    setCustomStops(items){ set('custom_stops', items); },
    listState(){ return get('list_state', {name:'Trip Checklist', items:[]}); },
    setListState(state){ set('list_state', state); },
    export(){
      const out = {};
      allKeys().forEach(k=>{ out[k] = localStorage.getItem(k); });
      return out;
    },
    import(obj){
      Object.entries(obj || {}).forEach(([k,v])=>{ if(k.startsWith(P) && typeof v === 'string') localStorage.setItem(k,v); });
    },
    resetDynamic(){
      allKeys().forEach(k=>{
        if(!k.endsWith('auth')) localStorage.removeItem(k);
      });
    }
  };
})();
