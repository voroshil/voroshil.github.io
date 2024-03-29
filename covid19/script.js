
var allTotalCountries = Object.keys(totalCountries).concat("Total");
var model = {}
var config = loadConfig()
var manualDate = moment().format("YYYY-M-D")
var countries = [];
var dds = [];
var totals = {"Total": []};
var current = {};
var currentTotal = {};
const countryId = c => c.replace(/[ ,`\'\(\)]/g,"")
var dates = [];
var totalDates = []


/* ' */
const width = 300
const height = 180
const largeWidth = 700
const largeHeight = 360

// Used globals: names, europe
function createModel(rawData){
  let m = {
    countries: {}
  }

  Object.keys(rawData).forEach( c => {
    const id = countryId(c);
    m.countries[id] = {
      id: id,
      country: c,
      name: names[c] === undefined ? c : names[c],
      isTotal: false,
      isEurope: false,
      history: rawData[c],
      latest: rawData[c].length-1,
      manual : {},
    };
  });
  europe.forEach(c => {
    const id = countryId(c);
    m.countries[id].isEurope = true;
  });

  const totalFilter = c => !c.isTotal
  const europeFilter = c => (!c.isTotal && c.isEurope)
  const mtotals = {
    "Total": rebuildModelTotals(m, totalFilter),
    "Europe": rebuildModelTotals(m, europeFilter)
  }
  Object.keys(mtotals).forEach( c => {
    m.countries[c] = {
      id: countryId(c),
      country: c,
      name: names[c] === undefined ? c : names[c],
      isTotal: true,
      isEurope: false,
      history: mtotals[c],
      latest: mtotals[c].length-1,
      manual : {},
    }
  });

  Object.keys(m.countries).forEach( c => {
    updateDiff(m.countries[c].history[0])
    for(var i=1; i<m.countries[c].history.length; i++){
      updateDiff(m.countries[c].history[i], m.countries[c].history[i-1]);
    }
  });

  console.log(m.countries["Total"]);
  return m;
}
function rebuildModelTotals(m, filter){
  let res = [];

  Object.keys(m.countries).forEach(c => {
    if (filter(m.countries[c])){
      const hist = m.countries[c].history;
      for(var i=0; i<hist.length; i++){
        if (res.length <= i){
          res.push(Object.assign({}, hist[i]));
        }else{
          res[i].confirmed += hist[i].confirmed;
          res[i].recovered += hist[i].recovered;
          res[i].deaths += hist[i].deaths;
        }
      }
    }
  });
  return res;
}
function loadConfig(){
  let res = Object.assign({}, defaultConfig);
  try{
    const cfgJson = localStorage[configPrefix]
    if (cfgJson !== undefined){
      cfg = JSON.parse(cfgJson);
      res = Object.assign(defaultConfig, cfg);
    }
  }catch(e){
  }
  return res;
}
function saveConfig(newConfig){
  localStorage[configPrefix] = JSON.stringify(newConfig);
}
function configToForm(c){
  let el = document.getElementById("settingsMaxThreshold")
  if (el !== null){
    el.value = c.maxThreshold;
  }
  el = document.getElementById("settingsPeriodThreshold")
  if (el !== null){
    el.value = c.periodThreshold;
  }
  el = document.getElementById("settingsShowHorizontal")
  if (el !== null){
    el.checked = c.showHorizontal;
  }
  el = document.getElementById("settingsDynamicThreshold")
  if (el !== null){
    el.value = c.dynamicThreshold;
  }
  el = document.getElementById("settingsThresholdCountry")
  if (el !== null){
    el.value = c.thresholdCountry;
  }
  el = document.getElementById("settingsActiveAbsoluteTrue")
  if (el !== null){
    el.checked = c.activeAbsolute;
  }
  el = document.getElementById("settingsActiveAbsoluteFalse")
  if (el !== null){
    el.checked = !c.activeAbsolute;
  }
}
function formToConfig(){
  let newConfig = {};

  let el = document.getElementById("settingsMaxThreshold")
  if (el !== null){
    newConfig.maxThreshold = +el.value;
  }
  el = document.getElementById("settingsPeriodThreshold")
  if (el !== null){
    newConfig.periodThreshold = +el.value;
  }
  el = document.getElementById("settingsShowHorizontal")
  if (el !== null){
    newConfig.showHorizontal = el.checked;
  }
  el = document.getElementById("settingsDynamicThreshold")
  if (el !== null){
    newConfig.dynamicThreshold = +el.value;
  }
  el = document.getElementById("settingsThresholdCountry")
  if (el !== null){
    newConfig.thresholdCountry = el.value;
  }
  el = document.getElementById("settingsActiveAbsoluteTrue")
  if (el !== null){
    newConfig.activeAbsolute = el.checked;
  }
  return newConfig;
}


function updateConfig(){
  const newConfig = Object.assign(config, formToConfig());
  saveConfig(newConfig);
  displayData();
}
function createDates(data){
  let v = Object.values(data)[0];
  let res = v.map(t => moment(t.date, "YYYY-M-D").unix())
  res.sort((a,b) => {
      if (a > b)
        return -1;
      if (a < b)
        return 1;
      return 0;
  });
  return res;
}

function createDateTotal(data, dateIndex, desiredCountries){
  var total = {
    date: undefined,
    confirmed: 0,
    recovered: 0,
    deaths: 0
  };
  let first = true;
  desiredCountries.forEach(c => {
    let v = data[c]
    if (first && (v === undefined || v[dateIndex] == undefined)){
      console.log(c);
      return
    }else if (first && (v === undefined || isNaN(v[dateIndex].confirmed))){
      console.log(v[dateIndex]);
      first = false;
    }
    total.date = v[dateIndex].date;
    total.confirmed += v[dateIndex].confirmed;
    total.recovered += v[dateIndex].recovered;
    total.deaths += v[dateIndex].deaths;
  });

  return total;
}
function createAllTotal(data, desiredCountries){
  res = [];
  if (desiredCountries === undefined){
    desiredCountries = Object.keys(data)
  }
  if (desiredCountries.length > 0){
  firstCountry = desiredCountries[0];
  for(var i=0; i<data[firstCountry].length; i++){
    res.push(createDateTotal(data, i, desiredCountries));
  }
  }
  return res;
}
function updateDiff(c,p){
  c.unix = moment(c.date, "YYYY-M-D").unix()
  c.closed = +c.deaths + c.recovered;
  c.active = +c.confirmed - c.closed;
  c.somethingRate = c.confirmed !== 0 ? c.deaths / c.confirmed : 0;
  c.deathRate = c.closed !== 0 ? c.deaths / c.closed : 0;
  c.deathsRateLag = c.recoveredLag > 0 ? c.deaths / (c.recoveredLag + c.deaths) : undefined

  c.recoveryRate = c.closed !== 0 ? c.recovered / c.closed : 0;
  c.deathsEstimated = Math.round(c.active * c.deathRate);
  if (p !== undefined){
    c.confirmedDiff = +c.confirmed - p.confirmed;
    c.recoveredDiff = +c.recovered - p.recovered;
    c.deathsDiff    = +c.deaths - p.deaths;
    c.somethingRateDiff = c.somethingRate - p.somethingRate;
    c.deathRateDiff = c.deathRate - p.deathRate;
    c.recoveryRateDiff = c.recoveryRate - p.recoveryRate;
    c.deathsEstimatedDiff = c.deathsEstimated - p.deathsEstimated;
  }else{
    c.confirmedDiff = 0;
    c.recoveredDiff = 0;
    c.deathsDiff = 0;
    c.somethingRateDiff = 0;
    c.deathRateDiff = 0;
    c.recoveryRateDiff = 0;
    c.deathsEstimatedDiff = 0;
  }

  c.closedDiff = +c.deathsDiff + c.recoveredDiff;
  c.activeDiff = +c.confirmedDiff - c.closedDiff;
}
function preprocess(data){
  Object.entries(data).forEach(entry => {
    let prev = undefined
    for(var i=Math.max(entry[1].length-config.recoveryShift, 0); i<entry[1].length; i++){
      entry[1][i].recoveredLag = undefined;
    }
    for(var i=0; i<entry[1].length-config.recoveryShift; i++){
      entry[1][i].recoveredLag = entry[1][i+14].recovered;
    }
    for(var i=8; i<entry[1].length; i++){
      const v1_c = entry[1][i-4].confirmed - entry[1][i-8].confirmed;
      const v2_c = entry[1][i-0].confirmed - entry[1][i-4].confirmed;

      const v1 = v1_c;
      const v2 = v2_c;
      if (v1 > 0)
        entry[1][i].rt = v2 / v1;
      else
        entry[1][i].rt = Infinity ;
    }

    entry[1].forEach(d => {
      d.name = entry[0];
      d.code = names[entry[0]] !== undefined ? names[entry[0]] : entry[0]
      updateDiff(d, prev);
      prev = d
    });
    
  });
}

function checkUpdate(){
  fetch("https://pomber.github.io/covid19/timeseries.json", {method: 'HEAD'})
  .then(response => {
    lastModifiedStr = response.headers.get('last-modified')
    if (lastModifiedStr !== undefined && lastModifiedStr !== null){
      el = document.getElementById("lastFileUpdate")
      if (el !== null){
        el.innerHTML = moment(lastModifiedStr).format("DD.MM.YYYY HH:MM");
      }
    }
  });

}

function needUpdate(oldData, newData){
  return false;
//  return oldData["Germany"].length < newData["Germany"].length
}

function loadData(){
  fetch("https://pomber.github.io/covid19/timeseries.json")
  .then(response => response.json())
  .then(d => {
    if (needUpdate(data, d)){
      data = d
      displayData();
    }
  });
}

function buildCountries(stat, threshold) {
    let countries = [];
    Object.keys(stat).forEach(c => {
      if (stat[c].confirmed > threshold)
          countries.push(c);
    });
    countries.sort((a,b) => {
      if (stat[a].confirmed > stat[b].confirmed)
        return -1;
      if (stat[a].confirmed < stat[b].confirmed)
        return 1;
      return 0;
    });
    return countries;
}

function createCurrentCountry(nowDate, countryId, country_data){
  res = Object.assign({isValid: false}, country_data, {date: nowDate});

  try{
    currentValue = localStorage[currentPrefix+countryId];
    if (currentValue !== undefined){
      currentValue = JSON.parse(currentValue);
      res = Object.assign(res, currentValue);
      res.isValid = true
    }
  }catch(e){
  }
  updateDiff(res, country_data)
  return res;
}
function createCurrent(data){
  let res = {}
  Object.entries(data).forEach(entry => {
    const id = countryId(entry[0]);
    country_data = entry[1]
    res[entry[0]] = createCurrentCountry(manualDate, id, country_data[country_data.length-1]);
  });
  return res;
}
function convertData(data){
  var dates = {}
  Object.entries(data).forEach(entry  => {
      country = entry[0]
      country_data = entry[1]
      country_data.forEach(dd => {
          if (dates[dd.unix] === undefined){
            dates[dd.unix] = {}
          }
          dates[dd.unix][country] = dd;
      })
  });
  return dates;
}

function getColoredDiff(v, cp, cm){
    if (v > 0)
      return`<br/><span class="${cp}">+${v.toLocaleString()}</span>`;
    else if (v < 0)
      return`<br/><span class="${cm}">${v.toLocaleString()}</span>`;
    else
      return "";
}

function outputBetterStatHtmlTable(rowIdPrefix, stat, countries, isTotal){
  const rows = countries.map(c => {
      return {
        isTotal: isTotal,
        id: countryId(c),
        name: stat[c].code,
        confirmed: stat[c].confirmed.toLocaleString(),
        recovered: stat[c].recovered.toLocaleString(),
        deaths: stat[c].deaths.toLocaleString(),
        active: stat[c].active.toLocaleString(),
        deathRate: (100 * stat[c].deathRate).toFixed(1),
        somethingRate: (100 * stat[c].somethingRate).toFixed(1),
        deathsEstimated: stat[c].deathsEstimated.toLocaleString(),
        confirmedDiff: getColoredDiff(stat[c].confirmedDiff, "diff-red", "diff-green"),
        recoveredDiff: getColoredDiff(stat[c].recoveredDiff, "diff-green", "diff-red"),
        deathsDiff: getColoredDiff(stat[c].deathsDiff, "diff-red", "diff-green"),
        activeDiff: getColoredDiff(stat[c].activeDiff, "diff-red", "diff-green"),
        deathRateDiff: getColoredDiff((100 * stat[c].deathRateDiff).toFixed(1), "diff-red", "diff-green"),
        activeClass: stat[c].activeDiff < 0 ? "death-rate-lower" : (stat[c].deathRate < 0.1 ? "death-rate-lower" : ""),
        deathRateClass: stat[c].deathRate > 0.5 ? "death-rate-higher": "",
        somethingRateDiff: getColoredDiff((100 * stat[c].somethingRateDiff).toFixed(1), "diff-red", "diff-green"),
        deathsEstimatedDiff: stat[c].deathsEstimatedDiff !== undefined ? getColoredDiff(stat[c].deathsEstimatedDiff, "diff-red", "diff-green") : "",
      }
  });
  rows.forEach(row => {
    renderStatTableRow(rowIdPrefix+row.id, row);
  });
}

function outputGraph1(elementId, width, height, c, isTotal){
  const history = isTotal ? totals[c] : data[c];
  const latest = isTotal ? totalDates[dds[0]][c] : dates[dds[0]][c]
  const cur = isTotal ? currentTotal[c] : current[c]
  outputGraph("Заразившиеся (прирост)", names[c], elementId,              history, d => d.confirmedDiff,       width, height, latest.confirmedDiff, cur)

}
function outputGraph3(elementId, width, height, c, isTotal){
  const history = isTotal ? totals[c] : data[c];
  const latest = isTotal ? totalDates[dds[0]][c] : dates[dds[0]][c]
  const cur = isTotal ? currentTotal[c] : current[c]
  if (config.activeAbsolute)
    outputGraph("Болеющие",           names[c], elementId,        history, d => (d.confirmed - d.deaths - d.recovered),              width, height, latest, cur)
  else
    outputGraph("Болеющие (прирост)", names[c], elementId,        history, d => (d.confirmedDiff - d.deathsDiff - d.recoveredDiff),              width, height, latest, cur)

}
function outputGraph2(elementId, width, height, c, isTotal){
  const history = isTotal ? totals[c] : data[c];
  const latest = isTotal ? totalDates[dds[0]][c] : dates[dds[0]][c]
  const cur = isTotal ? currentTotal[c] : current[c]
  outputDeathRecoveryGraph("Смерти / выздоровления", names[c], elementId, history,                width, height, latest, cur)
}
function outputGraph4(elementId, width, height, c, isTotal){
  const history = isTotal ? totals[c] : data[c];
  const latest = isTotal ? totalDates[dds[0]][c] : dates[dds[0]][c]
  outputGraph("Летальность",            names[c], elementId,     history, d => (100*d.deathRate),     width, height, latest)
}
function outputGraph5(elementId, width, height, c, isTotal){
  const history = isTotal ? totals[c] : data[c];
  const latest = isTotal ? totalDates[dds[0]][c] : dates[dds[0]][c]
  outputGraph(`Летальность-${config.recoveryShift}`,         names[c], elementId, history, d => (100*d.deathsRateLag), width, height, latest)
}
function outputGraph6(elementId, width, height, c, isTotal){
  const history = isTotal ? totals[c] : data[c];
  const latest = isTotal ? totalDates[dds[0]][c] : dates[dds[0]][c]
  const cur = isTotal ? currentTotal[c] : current[c]
  outputRtGraph("Rt", names[c], elementId, history,                width, height, latest, cur)
}
function outputCountryGraph(c, elementId, isTotal){
  outputGraph1("graph"+elementId, width, height, c, isTotal);
  outputGraph3("graphActive"+elementId, width, height, c, isTotal);
  outputGraph2("graphDeathRecovery"+elementId, width, height, c, isTotal);
  outputGraph4("graphDeathRate"+elementId, width, height, c, isTotal);
  outputGraph5("graphDeathsRateLag"+elementId, width, height, c, isTotal);
  outputGraph6("graphRt"+elementId, width, height, c, isTotal);
}

function rerenderCurrent(id, isTotal){
  const stat = isTotal ? currentTotal : current
  const source = isTotal ? totals : data
  const statCountries = isTotal ? allTotalCountries: countries

  const cidx = statCountries.findIndex(d => countryId(d) === id)
  if (cidx < 0)
    return
  const c = statCountries[cidx]

  stat[c] = createCurrentCountry(manualDate, id, source[c][source[c].length-1])

  outputCountryGraph(c, id, isTotal)
  updateGraphManual([c], stat);
}

function onGraphDblClick(id, isTotal, gr){

  const statCountries = isTotal ? allTotalCountries: countries

  const cidx = statCountries.findIndex(d => countryId(d) === id)
  if (cidx < 0)
    return
  const c = statCountries[cidx]

  let d = {}
  if (isTotal){
    d = currentTotal[c]
  }else{
    d= current[c]
  }
  if (gr === 1){
    outputGraph1("largeGraph", largeWidth, largeHeight, c, isTotal);
  }else if (gr === 2){
    outputGraph2("largeGraph", largeWidth, largeHeight, c, isTotal);
  }else if (gr === 3){
    outputGraph3("largeGraph", largeWidth, largeHeight, c, isTotal);
  }

  let el = document.getElementById("graphName");
  if (el !== null){
    el.innerHTML = names[c];
  }
  $('#graphModal').modal()
}
function onManualDblClick(id, isTotal){

  const statCountries = isTotal ? allTotalCountries: countries

  const cidx = statCountries.findIndex(d => countryId(d) === id)
  if (cidx < 0)
    return
  const c = statCountries[cidx]

  let d = {}
  if (isTotal){
    d = currentTotal[c]
  }else{
    d= current[c]
  }

  let el = document.getElementById("manualName")
  if (el !== null){
    el.innerHTML = names[c];
  }
  el = document.getElementById("manualCountry")
  if (el !== null){
    el.value = c;
  }
  el = document.getElementById("manualConfirmed")
  if (el !== null){
    el.value = +d.confirmed;
  }
  el = document.getElementById("manualRecovered")
  if (el !== null){
    el.value = +d.recovered;
  }
  el = document.getElementById("manualDeaths")
  if (el !== null){
    el.value = +d.deaths;
  }

  $('#manualModal').modal(d)
}
function onManualUpdate(){
  let el = document.getElementById("manualCountry")
  if (el === null)
    return

  const c = el.value
  const id = countryId(c)


  obj = localStorage[currentPrefix+id]
  if (obj === undefined){
    obj = {}
  }else{
    try{
    obj = JSON.parse(obj);
    }catch(e){
      obj = {};
    }
  }
  el = document.getElementById("manualConfirmed");
  if (el !== null)
    obj.confirmed = parseInt(el.value.replace(/[^0-9]/g,""));

  el = document.getElementById("manualDeaths");
  if (el !== null)
    obj.deaths = parseInt(el.value.replace(/[^0-9]/g,""));
  el = document.getElementById("manualRecovered");
  if (el !== null)
    obj.recovered = parseInt(el.value.replace(/[^0-9]/g,""));
  localStorage[currentPrefix+id] = JSON.stringify(obj);


  rerenderCurrent(id, currentTotal[c] !== undefined);
}
function onManualReset(){
  let el = document.getElementById("manualCountry")
  if (el === null)
    return

  const c = el.value
  const id = countryId(c)
  onCurrentReset(id, currentTotal[c] !== undefined);
}

function onCurrentReset(id, isTotal){
  localStorage.removeItem(currentPrefix+id)
  rerenderCurrent(id, isTotal);
}
function onCurrentUpdate(id, isTotal){

  obj = localStorage[currentPrefix+id]
  if (obj === undefined){
    obj = {}
  }else{
    try{
    obj = JSON.parse(obj);
    }catch(e){
      obj = {};
    }
  }
  el = document.getElementById("confirmed"+id);
  if (el !== null)
    obj.confirmed = parseInt(el.value.replace(/[^0-9]/g,""));
  el = document.getElementById("deaths"+id);
  if (el !== null)
    obj.deaths = parseInt(el.value.replace(/[^0-9]/g,""));
  el = document.getElementById("recovered"+id);
  if (el !== null)
    obj.recovered = parseInt(el.value.replace(/[^0-9]/g,""));
  el = document.getElementById("modified"+id);
  if (el !== null){
    el.innerHTML = "сохранено";
  }
  localStorage[currentPrefix+id] = JSON.stringify(obj);


  rerenderCurrent(id, isTotal);
}

function diffClassTriple(v, lowBound, highBound, classUp, classDown){
  if (v === undefined)
    return "diff-diff-undefined";
  if (v < lowBound)
    return classDown;
  if (v > highBound)
    return classUp;
  return "";
}
function diffClass(v, classUp, classDown){
  return diffClassTriple(v, 0, 0, classUp, classDown)
}
function confirmedFormatter(d) {
  const tdClass = diffClass(d.confirmedDiffDiff, "", "confirmed-diff-diff-down");
  const rt = d.rt !== undefined ? d.rt.toFixed(2) : ""
  return `<td class="${tdClass}">${d.confirmed.toLocaleString()}${getColoredDiff(d.confirmedDiff, "diff-red", "diff-green")}<br/>${rt}</td>`
}
function activeFormatter(d) {
  const tdClass = diffClass(d.activeDiff, "active-diff-up", "active-diff-down");
  return `<td class="${tdClass}" align="right">${d.active.toLocaleString()}${getColoredDiff(d.activeDiff, "diff-red", "diff-green")}</td>`;
}
function deathRateFormatter(d) {
  const tdClass = diffClassTriple(d.deathRate, 0.1, 0.5, "death-rate-higher", "death-rate-lower");
  return `<td class="${tdClass}">${(100 * d.deathRate).toFixed(1).toLocaleString()}${getColoredDiff((100*d.deathRateDiff).toFixed(1), "diff-red", "diff-green")}</td>`;
}
function recoveredFormatter(d) {
  return `<td align="right">${d.recovered.toLocaleString()}${getColoredDiff(d.recoveredDiff, "diff-green", "diff-red")}</td>`;
}
function deathFormatter(d) {
  const tdClass = diffClass(d.deathsDiffDiff, "", "deaths-diff-diff-down");
  return `<td align="right" class="${tdClass}">${d.deaths.toLocaleString()}${getColoredDiff(d.deathsDiff, "diff-red", "diff-green")}</td>`;
}
function somethingRateFormatter(d) {
  return `<td align="right">${(100 * d.somethingRate).toFixed(1).toLocaleString()}${getColoredDiff((100*d.somethingRateDiff).toFixed(1), "diff-red", "diff-green")}</td>`;
}
function deathsEstimatedFormatter(d) {
  return `<td align="right">${d.deathsEstimated.toLocaleString()}${getColoredDiff(d.deathsEstimatedDiff.toFixed(0), "diff-red", "diff-green")}</td>`;
}
function calcSA_1(data, width, getter, setter){
  Object.keys(data).forEach(i => {
    vs = []
    for(var j=0; j<width; j++){
      var idx1 = +i-j;
      var idx2 = +i+j;
      if (idx1 >=0 && idx2 >=0 && data[idx1] !== undefined && data[idx2] !== undefined){
        v1 = getter(data[idx1])
        v2 = getter(data[idx2])
        if(!isNaN(v1) && !isNaN(v2)){
          vs.push(v1)
          vs.push(v2)
        }
      }
    }
    vs.push(getter(data[i]));
    vsa = 0
    cnt = 0
    vs.forEach(v => { vsa += v; cnt += 1 })
    if (cnt > 0){
      setter(data[i], vsa / cnt)
    }else{
      setter(data[i], 0)
    }
  })
}
function calcSA_2(data, width, getter, setter){
  Object.keys(data).forEach(i => {
    vs = []
    v = getter(data[i])
    for(var j=0; j<width; j++){
      var idx1 = +i-j;
      if (idx1 >=0 && data[idx1] !== undefined){
        v1 = getter(data[idx1])
        if(!isNaN(v1)){
          vs.push(v1)
        }else{
          vs.push(v)
        }
      }else{
        vs.push(v)
      }

      var idx2 = +i+j;
      if (idx2 >=0 && data[idx2] !== undefined){
        v2 = getter(data[idx2])
        if(!isNaN(v2)){
          vs.push(v2)
        }else{
          vs.push(v)
        }
      }else{
        vs.push(v)
      }
    }
    vs.push(v);
    vsa = 0
    cnt = 0
    vs.forEach(v => { vsa += v; cnt += 1 })
    setter(data[i], vsa / cnt)
  })
}
function calcSA(data, width, getter, setter){
  return calcSA_2(data, width, getter, setter);
}
function outputGraph(title, name, id, d2, accessor, width, height, currentObject, manual){
  const dateThr = moment().unix() - config.periodThreshold * 24 * 60 * 60;

  const el = document.getElementById(id)
  if (el == null)
    return;
  el.innerHTML = "";

  const margin = {top: 35, right: 20, bottom: 50, left: 70};
  var data = []
  d2.forEach(k => {
    if (k.unix > dateThr){
      const  v = accessor(k)
      if (!isNaN(v)){
        data.push({d: new Date(1000 * k.unix), v:v, manual: false})
      }
    }
  })
  if (data.length == 0)
    return;

  const currentValue = accessor(currentObject);
  var latest = data.length - 1

  if (manual !== undefined && manual.isValid){
    const manualValue = accessor(manual)
    data.push({d: new Date(1000 * manual.unix), v: manualValue, manual: true})
  }
  calcSA(data, 5, d => d.v, (d,v) => {d.vsa = v})

  const [vsa_min, vsa_max] = d3.extent(data, d => d.vsa)
  const v_max = d3.max(data, d => d.v)
  const idx_max = data.findIndex(d => d.vsa === vsa_max)
  const rising = idx_max === latest ? ", Растет" : ""
  Object.assign(data, {
    x: "Дни", 
    yMax: "Макс: "+(v_max.toLocaleString()),
    yLast: "Посл: " + (data[latest].v.toLocaleString()+rising),
  });

  x = d3.scaleTime()
        .domain(d3.extent(data.map(d => d.d))).nice()
        .range([margin.left, width - margin.right]);

  const [dMin, dMax] = d3.extent(data, d => d.d);
  let xWidth = (x(dMax) - x(dMin)) / data.length;
  if (xWidth < 1){
    xWidth = 1;
  }else if (xWidth > 4){
    xWidth = xWidth - 1;
  }

  let [yMin, yMax] = d3.extent(data, d => d.v)

  if (currentValue !== undefined && !isNaN(currentValue)){
    yMax = Math.max(currentValue, yMax)
    yMin = Math.min(currentValue, yMin)
  }
  if (manual !== undefined && manual.isValid === true){
    yMax = Math.max(accessor(manual), yMax)
    yMin = Math.min(accessor(manual), yMin)
  }
  yMin = Math.min(yMin, 0)

  y = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([height - margin.bottom, margin.top]);

  xAxis = g => g
      .attr("transform", `translate (0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%d.%m")).tickSizeOuter(0))
      .selectAll("text")
      .attr("x", -margin.bottom+10)
      .attr("y", 0)
      .attr("dy", ".35em")
      .attr("transform", "rotate(270)")
      .attr("text-anchor", "start");

  const xAxis2 = g => g
      .attr("transform", `translate (0, ${height - margin.bottom})`)
      .attr("stroke-dasharray", [1, 3])
      .call(d3.axisBottom(x)
        .tickSize(-height+margin.top+margin.bottom)
        .tickFormat("")
      )

  yAxis = g => g
      .attr("transform", `translate (${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6).tickFormat(x => x.toLocaleString()))
//      .call(g => g.select(".domain").remove())
      .call(g => g.append("text")
          .append("tspan")
          .attr("x", margin.left + (width-margin.left-margin.right)/2)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "center")
          .text(title)
          .append("tspan")
          .attr("x", margin.left + (width-margin.left-margin.right)/2)
          .attr("y", 25)
          .attr("fill", "currentColor")
          .attr("text-anchor", "center")
          .text(name)
          .append("tspan")
          .attr("x", -margin.left+5)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text(data.yMax)
          .append("tspan")
          .attr("x", -margin.left+5)
          .attr("y", 25)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text(data.yLast))

  const yAxis2 = g => g
      .attr("transform", `translate (${margin.left},0)`)
      .attr("stroke-dasharray", [1, 3])
      .call(d3.axisLeft(y)
        .ticks(6)
        .tickSize(-width+margin.right+margin.left)
        .tickFormat("")
      )


    const svg = d3.select("#"+id)
      .append("svg")
//      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height);


    svg.append("g")
      .attr("fill", "orange")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("opacity", 1)
      .attr("x", d => x(d.d)-(xWidth/2))
//      .attr("width", d => (width - margin.left - margin.right) / data.length-1)
      .attr("width", d => xWidth)
      .attr("fill", d => d.vsa === vsa_max || d.vsa === vsa_min ? "steelblue" : (d.manual ? "magenta": "orange"))
      .attr("y",      d => d.v >= 0 ? y(d.v) : y(0))
      .attr("height", d => d.v > 0 ? y(0)-y(d.v): y(d.v)-y(0));

    line = d3.line()
      .defined(d => !isNaN(d.vsa))
      .curve(d3.curveBasis)
      .x(d => x(d.d))
      .y(d => y(d.vsa))


    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", line);
    if (config.showHorizontal === true && currentValue !== undefined && !isNaN(currentValue)){
    svg.append("line")
      .attr("x1", margin.left)
      .attr("y1", y(currentValue))
      .attr("x2", width - margin.right)
      .attr("y2", y(currentValue))
      .attr("stroke-dasharray", [5,5])
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      ;
    }
    if (config.showManualHorizontal === true && manual !== undefined && manual.isValid === true){
      const v = accessor(manual)
    svg.append("line")
      .attr("x1", margin.left)
      .attr("y1", y(v))
      .attr("x2", width - margin.right)
      .attr("y2", y(v))
      .attr("stroke-dasharray", [1,3])
      .attr("stroke", "#808080")
      .attr("stroke-width", 1)
      ;
    }

    svg.append("line")
      .attr("x1", margin.left)
      .attr("y1", y(0))
      .attr("x2", width - margin.right)
      .attr("y2", y(0))
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      ;

    svg.append("g")
      .call(xAxis);
    svg.append("g")
      .call(yAxis);
    if (width > 300){
    svg.append("g")
      .call(xAxis2);
    svg.append("g")
      .call(yAxis2);
    }
}
function outputDynamicGraph(title, id, d2, accessor, minThr, width, height){
  const el = document.getElementById(id)
  if (el == null)
    return;
  el.innerHTML = "";

  const margin = {top: 35, right: 170, bottom: 50, left: 70};
  var data = {}
  var dataMax = []
  var iMax = 0
  var vMax = 1
  Object.keys(d2).forEach(c => {
    data[c] = [];

    const first = d2[c].findIndex(e => e.confirmed > minThr)
    if (first >= 0){
      dm={c: c, v:0}
      for(var i=first; i<d2[c].length; i++){
        const idx = i-first;
        const v = accessor(d2[c][i])
        if (idx > iMax)
          iMax = idx
        if (v > dm.v)
          dm.v = v
        data[c].push({d: idx, v:v});
      }
      if (dm.v > vMax)
        vMax = dm.v
      dataMax.push(dm)
      calcSA(data[c], 5, d => d.v, (d,v) => {d.vsa = v})
    }
  });

  dataMax.sort((a,b) => {
      if (a.v > b.v)
        return -1;
      if (a.v < b.v)
        return 1;
      return 0;
  })
  const russiaIdx = dataMax.findIndex(dm => dm.c == "Russia")
  if (russiaIdx >= colors.length)
    dataMax.unshift(dataMax[russiaIdx])

  x = d3.scaleLinear()
        .domain([0, iMax]).nice()
        .range([margin.left, width - margin.right]);

  y = d3.scaleLog()
        .domain([1, vMax]).nice()
        .range([height - margin.bottom, margin.top]);

  const xAxis = g => g
      .attr("transform", `translate (0, ${height - margin.bottom})`)
//      .call(d3.axisBottom(x).tickFormat(x => x.toLocaleString()))
      .call(d3.axisBottom(x).tickFormat(x => x.toLocaleString()))
      .selectAll("text")
      .attr("x", -margin.bottom+10)
      .attr("y", 0)
      .attr("dy", ".35em")
      .attr("transform", "rotate(270)")
      .attr("text-anchor", "start");

  const xAxis2 = g => g
      .attr("transform", `translate (0, ${height - margin.bottom})`)
      .attr("stroke-dasharray", [1, 3])
      .call(d3.axisBottom(x)
        .tickSize(-height+margin.top+margin.bottom)
        .tickFormat("")
      )

  const yAxis = g => g
      .attr("transform", `translate (${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(4).tickFormat(x => x.toLocaleString()))

  const yAxis2 = g => g
      .attr("transform", `translate (${margin.left},0)`)
      .attr("stroke-dasharray", [1, 3])
      .call(d3.axisLeft(y)
        .ticks(4)
        .tickSize(-width+margin.right+margin.left)
        .tickFormat("")
      )

    const svg = d3.select("#"+id)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

     svg.append("g")
      .attr("class", "grid")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisLeft(y)
          .ticks(4)
          .tickSize(-height)
          .tickFormat("")
      )

    svg.call(g => g.append("text")
          .append("tspan")
          .attr("x", margin.left + (width-margin.left-margin.right)/2)
          .attr("y", 12)
          .attr("fill", "currentColor")
          .attr("text-anchor", "center")
          .text(title))
     svg
      .call(g => {
           let t = g.append("text")
           for(var i =0; i<Math.min(dataMax.length,colors.length); i++){
             const c = dataMax[i].c
             const color = colors[i]
             if (color !== undefined && data[c].length > 0){
               t = t.append("tspan")
                    .attr("x", width - margin.right)
                    .attr("y", margin.top + 10+i*15)
                    .attr("fill", c == "Russia" ? "red" : color)
                    .attr("text-anchor", "center")
                    .text(names[c])
                    .append("tspan")
             }
           }
    })

    const xWidth = (x(iMax) - x(0)) / iMax
    for(var i =0; i<Math.min(dataMax.length,colors.length); i++){
      const c = dataMax[i].c
      const color = colors[i]
      if (color !== undefined && data[c].length > 0){
      let line = d3.line()
        .defined(d => !isNaN(d.vsa) && d.vsa > 1)
        .x(d => x(d.d) + xWidth/2)
        .y(d => y(d.vsa))

       svg.append("path")
          .datum(data[c])
          .attr("fill", "none")
          .attr("stroke", c == "Russia" ? "red" : color)
          .attr("stroke-width", c == "Russia" ? 2 : 0.5)
//          .attr("stroke-dasharray", c == "Russia" ? [1] :  [5,5])
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("d", line);
      }
    }
    svg.append("g")
      .call(xAxis);
    svg.append("g")
      .call(xAxis2);
    svg.append("g")
      .call(yAxis);
    svg.append("g")
      .call(yAxis2);
}
function outputDoubleGraph(title, name, id, d, width, height, current, manual, deathsMapper, recoveryMapper){
  const dateThr = moment().unix() - config.periodThreshold * 24 * 60 * 60;
  const el = document.getElementById(id)
  if (el == null)
    return;
  el.innerHTML = "";
  const margin = {top: 35, right: 20, bottom: 50, left: 70};
  var data = []
  d.forEach(k => {
    if (k.unix > dateThr){
    data.push({d: new Date(1000 * k.unix), deaths: deathsMapper(k), recovery: recoveryMapper(k), manual: false})
    }
  })
  if (manual !== undefined && manual.isValid){
    data.push({d: new Date(1000 * manual.unix), deaths: deathsMapper(manual), recovery: recoveryMapper(manual), manual: true})
  }
  calcSA(data, 5, d => d.deaths, (d,v) => {d.deathsSA = v})
  calcSA(data, 5, d => d.recovery, (d,v) => {d.recoverySA = v})

  const deathsSA_max = d3.max(data, d => d.deathsSA)
  const recoverySA_max = d3.max(data, d => d.recoverySA)

  const deaths_max = d3.max(data, d => d.deaths)
  const recovery_max = d3.max(data, d => d.recovery)

  const recoverySA_idx = data.findIndex(d => d.recoverySA === recoverySA_max)
  const deathsSA_idx = data.findIndex(d => d.deathsSA === deathsSA_max)
  const risingDeaths = deathsSA_idx === (data.length - 1) ? ", Растет" : ""
  const risingRecovery = recoverySA_idx === (data.length - 1) ? ", Растет" : ""
  Object.assign(data, {
    x: "Дни", 
    yDeaths: "Смерти, Макс: "+(deaths_max.toLocaleString())+risingDeaths, 
    yRecovery: "Выздоровления, Макс: "+(recovery_max.toLocaleString())+risingRecovery
  });

  x = d3.scaleTime()
        .domain(d3.extent(data.map(d => d.d))).nice()
        .range([margin.left, width - margin.right]);

  const [dMin, dMax] = d3.extent(data, d => d.d);
  const xWidth = (x(dMax) - x(dMin)) / data.length - 1

  let yMax = d3.max(data, d => d3.max([d.deaths,d.recovery]))
  let yMin = d3.min(data, d => d3.min([d.deaths,d.recovery]))
//  if (current !== undefined){
//    yMax = Math.max(yMax, current.recoveredDiff)
//    yMax = Math.max(yMax, current.deathsDiff)
//    yMin = Math.min(yMin, current.recoveredDiff)
//    yMin = Math.min(yMin, current.deathsDiff)
//  }
//  if (manual !== undefined && manual.isValid === true){
//    yMax = Math.max(yMax, Math.max(manual.deathsDiff, manual.recoveredDiff));
//    yMin = Math.min(yMin, Math.min(manual.deathsDiff, manual.recoveredDiff));
//  }
  yMin = Math.min(yMin, 0)

  y = d3.scaleLinear()
        .domain([yMin, yMax]).nice()
        .range([height - margin.bottom, margin.top]);
  xAxis = g => g
      .attr("transform", `translate (0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%d.%m")).tickSizeOuter(0))
      .selectAll("text")
      .attr("x", -margin.bottom+10)
      .attr("y", 0)
      .attr("dy", ".35em")
      .attr("transform", "rotate(270)")
      .attr("text-anchor", "start");

  const xAxis2 = g => g
      .attr("transform", `translate (0, ${height - margin.bottom})`)
      .attr("stroke-dasharray", [1, 3])
      .call(d3.axisBottom(x)
        .tickSize(-height+margin.top+margin.bottom)
        .tickFormat("")
      )

  yAxis = g => g
      .attr("transform", `translate (${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(4).tickFormat(x => x.toLocaleString()))
//      .call(g => g.select(".domain").remove())
      .call(g => g
          .append("text")
          .append("tspan")
          .attr("x", margin.left + (width-margin.left-margin.right)/2)
          .attr("y", 25)
          .attr("fill", "currentColor")
          .attr("text-anchor", "center")
          .text(name)
          .append("tspan")
          .attr("x", -margin.left+5)
          .attr("y", 25)
          .attr("fill", "red")
          .attr("text-anchor", "start")
          .text(data.yDeaths)
          .append("tspan")
          .attr("x", -margin.left+5)
          .attr("y", 10)
          .attr("fill", "green")
          .attr("text-anchor", "start")
          .text(data.yRecovery))

    const yAxis2 = g => g
      .attr("transform", `translate (${margin.left},0)`)
      .attr("stroke-dasharray", [1, 3])
      .call(d3.axisLeft(y)
        .ticks(4)
        .tickSize(-width+margin.right+margin.left)
        .tickFormat("")
      )

    const svg = d3.select("#"+id)
      .append("svg")
//      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height);
    svg.append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("opacity", 0.5)
      .attr("fill", d => d.manual ? "#ff3030": "red")
      .attr("x", d => x(d.d)-xWidth/2)
//      .attr("width", d => (width -margin.left - margin.right)/ data.length-1)
      .attr("width", d => xWidth)
      .attr("y", d => d.deaths > 0 ? y(d.deaths): y(0))
      .attr("height", d => d.deaths > 0 ? y(0)-y(d.deaths) : y(d.deaths)-y(0));
    svg.append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("opacity", 0.5)
      .attr("fill", d => d.manual ? "#30ff30" : "green")
      .attr("x", d => x(d.d)-xWidth/2)
//      .attr("width", d => (width-margin.left-margin.right) / data.length-1)
      .attr("width", d => xWidth)
      .attr("y", d => d.recovery > 0 ? y(d.recovery) : y(0))
      .attr("height", d => d.recovery > 0 ? y(0)-y(d.recovery): y(d.recovery)-y(0));

    lineDeaths = d3.line()
      .defined(d => !isNaN(d.deathsSA))
      .curve(d3.curveBasis)
      .x(d => x(d.d))
      .y(d => y(d.deathsSA))
    lineRecovery = d3.line()
      .defined(d => !isNaN(d.recoverySA))
      .curve(d3.curveBasis)
      .x(d => x(d.d))
      .y(d => y(d.recoverySA))

    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "green")
      .attr("stroke-width", 1)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", lineRecovery);
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 1)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", lineDeaths);
if (config.showHorizontal === true && current !== undefined){
    svg.append("line")
      .attr("x1", margin.left)
      .attr("y1", y(current.recoveredDiff))
      .attr("x2", width - margin.right)
      .attr("y2", y(current.recoveredDiff))
      .attr("stroke-dasharray", [5,5])
      .attr("stroke", "green")
      .attr("stroke-width", 1)
      ;
    svg.append("line")
      .attr("x1", margin.left)
      .attr("y1", y(current.deathsDiff))
      .attr("x2", width - margin.right)
      .attr("y2", y(current.deathsDiff))
      .attr("stroke-dasharray", [5,5])
      .attr("stroke", "red")
      .attr("stroke-width", 1)
      ;
}
    if (config.showManualHorizontal === true && manual !== undefined && manual.isValid === true){

      const vd = manual.deathsDiff;
      const vr = manual.recoveredDiff;
    svg.append("line")
      .attr("x1", margin.left)
      .attr("y1", y(vr))
      .attr("x2", width - margin.right)
      .attr("y2", y(vr))
      .attr("stroke-dasharray", [8,16])
      .attr("stroke", "#20ff20")
      .attr("stroke-width", 1)
      ;
    svg.append("line")
      .attr("x1", margin.left)
      .attr("y1", y(vd))
      .attr("x2", width - margin.right)
      .attr("y2", y(vd))
      .attr("stroke-dasharray", [8,16])
      .attr("stroke", "#ff2020")
      .attr("stroke-width", 1)
      ;
    }
    svg.append("line")
      .attr("x1", margin.left)
      .attr("y1", y(0))
      .attr("x2", width - margin.right)
      .attr("y2", y(0))
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      ;
    svg.append("g")
      .call(xAxis);
    svg.append("g")
      .call(yAxis);

    if (width > 300){
    svg.append("g")
      .call(xAxis2);
    svg.append("g")
      .call(yAxis2);
    }
}
function outputRtGraph(title, name, id, d, width, height, current, manual){

  const dateThr = moment().unix() - config.periodThreshold * 24 * 60 * 60;
  const el = document.getElementById(id)
  if (el == null)
    return;
  el.innerHTML = "";
  const margin = {top: 35, right: 20, bottom: 50, left: 70};
  var data = []
  d.forEach(k => {
    if (k.unix > dateThr){
    data.push({d: new Date(1000 * k.unix), rt: Math.min(k.rt,2), manual: false})
    }
  })
  if (manual !== undefined && manual.isValid){
    data.push({d: new Date(1000 * manual.unix), rt: Math.min(manual.rt,2), manual: true})
  }
  calcSA(data, 5, d => d.rt, (d,v) => {d.rtSA = v})

  const rtSA_max = d3.max(data, d => d.rtSA)

  const rt_max = d3.max(data, d => d.rt)

  const rtSA_idx = data.findIndex(d => d.rtSA === rtSA_max)
  Object.assign(data, {
    x: "Дни", 
    yRt: "Rt, Макс: "+(rt_max.toLocaleString()), 
  });

  x = d3.scaleTime()
        .domain(d3.extent(data.map(d => d.d))).nice()
        .range([margin.left, width - margin.right]);

  const [dMin, dMax] = d3.extent(data, d => d.d);
  const xWidth = (x(dMax) - x(dMin)) / data.length - 1

  let yMax = d3.max(data, d => d.rt)
  let yMin = d3.min(data, d => d.rt)
//  yMin = Math.min(yMin, 0)

  y = d3.scaleLinear()
        .domain([yMin, yMax]).nice()
        .range([height - margin.bottom, margin.top]);
  xAxis = g => g
      .attr("transform", `translate (0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%d.%m")).tickSizeOuter(0))
      .selectAll("text")
      .attr("x", -margin.bottom+10)
      .attr("y", 0)
      .attr("dy", ".35em")
      .attr("transform", "rotate(270)")
      .attr("text-anchor", "start");

  const xAxis2 = g => g
      .attr("transform", `translate (0, ${height - margin.bottom})`)
      .attr("stroke-dasharray", [1, 3])
      .call(d3.axisBottom(x)
        .tickSize(-height+margin.top+margin.bottom)
        .tickFormat("")
      )

  yAxis = g => g
      .attr("transform", `translate (${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(4).tickFormat(x => x.toLocaleString()))
//      .call(g => g.select(".domain").remove())
      .call(g => g
          .append("text")
          .append("tspan")
          .attr("x", margin.left + (width-margin.left-margin.right)/2)
          .attr("y", 25)
          .attr("fill", "currentColor")
          .attr("text-anchor", "center")
          .text(name)
          .append("tspan")
          .attr("x", -margin.left+5)
          .attr("y", 25)
          .attr("fill", "black")
          .attr("text-anchor", "start")
          .text(data.yRt))

    const yAxis2 = g => g
      .attr("transform", `translate (${margin.left},0)`)
      .attr("stroke-dasharray", [1, 3])
      .call(d3.axisLeft(y)
        .ticks(4)
        .tickSize(-width+margin.right+margin.left)
        .tickFormat("")
      )

    const svg = d3.select("#"+id)
      .append("svg")
//      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height);
    svg.append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("opacity", 0.5)
      .attr("fill", d => d.manual ? "#ff3030": (d.rt > 1 ?"red":"green"))
      .attr("x", d => x(d.d)-xWidth/2)
//      .attr("width", d => (width -margin.left - margin.right)/ data.length-1)
          .attr("width", d => xWidth)
      .attr("y", d => d.rt > 1 ? y(d.rt): y(1))
      .attr("height", d => d.rt > 1 ? y(1)-y(d.rt) : y(d.rt)-y(1));

    lineRt = d3.line()
      .defined(d => !isNaN(d.rtSA))
      .curve(d3.curveBasis)
      .x(d => x(d.d))
      .y(d => y(d.rtSA))

    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", lineRt);
if (config.showHorizontal === true && current !== undefined){
    svg.append("line")
      .attr("x1", margin.left)
      .attr("y1", y(current.rt))
      .attr("x2", width - margin.right)
      .attr("y2", y(current.rt))
      .attr("stroke-dasharray", [5,5])
      .attr("stroke", "red")
      .attr("stroke-width", 1)
      ;
}
    if (config.showManualHorizontal === true && manual !== undefined && manual.isValid === true){

      const vd = manual.rt;
    svg.append("line")
      .attr("x1", margin.left)
      .attr("y1", y(vd))
      .attr("x2", width - margin.right)
      .attr("y2", y(vd))
      .attr("stroke-dasharray", [8,16])
      .attr("stroke", "#ff2020")
      .attr("stroke-width", 1)
      ;
    }
//    svg.append("line")
//      .attr("x1", margin.left)
//      .attr("y1", y(0))
//      .attr("x2", width - margin.right)
//      .attr("y2", y(0))
//      .attr("stroke", "black")
//      .attr("stroke-width", 1)
//      ;
    svg.append("line")
      .attr("x1", margin.left)
      .attr("y1", y(1))
      .attr("x2", width - margin.right)
      .attr("y2", y(1))
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      ;
    svg.append("g")
      .call(xAxis);
    svg.append("g")
      .call(yAxis);

    if (width > 300){
    svg.append("g")
      .call(xAxis2);
    svg.append("g")
      .call(yAxis2);
    }
}
function outputDeathRecoveryGraph(title, name, id, d, width, height, current, manual){
  outputDoubleGraph(title, name, id, d, width, height, current, manual, d => d.deathsDiff, d => d.recoveredDiff);
}
function updateGraphCurrent(cs, cur){
    cs.forEach(c => {
      if (cur[c] !== undefined){
        const id = countryId(c);
        el = document.getElementById("confirmedCurrent"+id)
        if (el !== null){
          el.innerHTML =  cur[c].confirmed.toLocaleString()
        }
        el = document.getElementById("confirmedDiffCurrent"+id)
        if (el !== null){
          el.innerHTML =  cur[c].confirmedDiff.toLocaleString()
        }
        el = document.getElementById("recoveredDiffCurrent"+id)
        if (el !== null){
          el.innerHTML =  cur[c].recoveredDiff.toLocaleString()
        }
        el = document.getElementById("deathsDiffCurrent"+id)
        if (el !== null){
          el.innerHTML =  cur[c].deathsDiff.toLocaleString()
        }
        el = document.getElementById("activeCurrent"+id)
        if (el !== null){
          el.innerHTML =  cur[c].active.toLocaleString()
        }
        el = document.getElementById("rt"+id)
        if (el !== null){
          el.innerHTML =  cur[c].rt.toFixed(2)
        }
      }
    })
} 
function updateGraphManual(cs, cur){
    cs.forEach(c => {
      const id = countryId(c);
      if (cur[c] !== undefined && cur[c].isValid == true){
        el = document.getElementById("confirmedManual"+id)
        if (el !== null){
          el.innerHTML =  cur[c].confirmed.toLocaleString()
        }
        el = document.getElementById("confirmedDiffManual"+id)
        if (el !== null){
          el.innerHTML =  cur[c].confirmedDiff.toLocaleString()
        }
        el = document.getElementById("recoveredDiffManual"+id)
        if (el !== null){
          el.innerHTML =  cur[c].recoveredDiff.toLocaleString()
        }
        el = document.getElementById("deathsDiffManual"+id)
        if (el !== null){
          el.innerHTML =  cur[c].deathsDiff.toLocaleString()
        }
        el = document.getElementById("activeManual"+id)
        if (el !== null){
          el.innerHTML =  cur[c].active.toLocaleString()
        }
      }else{
        el = document.getElementById("confirmedManual"+id)
        if (el !== null){
          el.innerHTML = ""
        }
        el = document.getElementById("confirmedDiffManual"+id)
        if (el !== null){
          el.innerHTML = ""
        }
        el = document.getElementById("recoveredDiffManual"+id)
        if (el !== null){
          el.innerHTML = ""
        }
        el = document.getElementById("deathsDiffManual"+id)
        if (el !== null){
          el.innerHTML = ""
        }
        el = document.getElementById("activeManual"+id)
        if (el !== null){
          el.innerHTML = ""
        }
      }
    })

} 

function renderGraphTable(tableBodyId, rows){
  tbody = document.getElementById(tableBodyId)
  if (tbody === null)
    return;

  var htmlRows = ""
  rows.forEach(c => {
    htmlRows += "<tr>"
    htmlRows +=`<td ondblclick="onManualDblClick('${c.id}',${c.isTotal})"><table width="100%"><tr>`;
    htmlRows += "<td colspan=\"2\">"
    htmlRows += `<span>${c.name}</span><hr/>`
    htmlRows += "</td></tr><tr><td width=\"50%\">"
    htmlRows += `<span style="color:black" id="confirmedCurrent${c.id}"></span><br/>`
    htmlRows += `<span style="color:orange" id="confirmedDiffCurrent${c.id}"></span><br/>`
    htmlRows += `<span style="color:green"  id="recoveredDiffCurrent${c.id}"></span><br/>`
    htmlRows += `<span style="color:red"  id="deathsDiffCurrent${c.id}"></span><br/>`
    htmlRows += `<span style="color:orange"  id="activeCurrent${c.id}"></span><br/>`
    htmlRows += `Rt=<span style="color:black"  id="rt${c.id}"></span><br/>`
    htmlRows += "</td><td>";
    htmlRows += `<span style="color:black" id="confirmedManual${c.id}"></span><br/>`
    htmlRows += `<span style="color:orange" id="confirmedDiffManual${c.id}"></span><br/>`
    htmlRows += `<span style="color:green"  id="recoveredDiffManual${c.id}"></span><br/>`
    htmlRows += `<span style="color:red"  id="deathsDiffManual${c.id}"></span><br/>`
    htmlRows += `<span style="color:orange"  id="activeManual${c.id}"></span><br/>`
    htmlRows += "</td></tr></table></td>";
    htmlRows +=`<td><div id="graph${c.id}" onclick="onGraphDblClick('${c.id}',${c.isTotal},1)" ></div><button type="button" onclick="onGraphDblClick('${c.id}',${c.isTotal},1)"><img width="16" src="magnifier.svg"</button></td>`;
    htmlRows +=`<td><div id="graphDeathRecovery${c.id}" onclick="onGraphDblClick('${c.id}',${c.isTotal},2)" ></div><button type="button" onclick="onGraphDblClick('${c.id}',${c.isTotal},2)"><img width="16" src="magnifier.svg"</button></td>`;
    htmlRows +=`<td><div id="graphActive${c.id}" onclick="onGraphDblClick('${c.id}',${c.isTotal},3)" ></div><button type="button" onclick="onGraphDblClick('${c.id}',${c.isTotal},3)"><img width="16" src="magnifier.svg"</button></td>`;
    htmlRows +="</tr>"
  })

  tbody.innerHTML = htmlRows;

}
function renderGraphRateTable(tableBodyId, rows){
  tbody = document.getElementById(tableBodyId)
  if (tbody === null)
    return;

  var htmlRows = ""
  rows.forEach(c => {
    htmlRows += "<tr>"
    htmlRows +="<td>"
    htmlRows += `<span>${c.name}</span><hr/>`
    htmlRows += "</td>";
    htmlRows +=`<td><div id="graphDeathRate${c.id}"></div></td>`;
    htmlRows +=`<td><div id="graphDeathsRateLag${c.id}"></div></td>`;
    htmlRows +=`<td><div id="graphRt${c.id}"></div></td>`;
    htmlRows +="</tr>"
  })

  tbody.innerHTML = htmlRows;

}
function renderHistoryTable2(elementId, params){
    let table = document.getElementById(elementId);
    if (table === null)
      return;

    const data = params.data;
    const cols = params.rows;
    const rows = params.cols;
    const formatter = params.formatter;

    let html = "";
    html += "<thead>";
    html += "<tr>";
    html += "<th>Date</th>";

    cols.forEach(c => {
        html += `<th class="rotated-text"><div><span>${c.date}</span></div></th>`;
    });
    html += "</tr>";
    html += "</thead>";
    html += "<tbody>";
    rows.forEach(row => {
      html += "<tr>";
      html += `<td>${row.name}</td>`;
      const cd =  data[row.c];
      if (cd === undefined){
        console.log(row);
      }
      for(var i=0; i<cd.length; i++){
        let dd = cd[cd.length-1-i];
        if (dd !== undefined){
          html += formatter(dd)
        }else{
          html += "<td></td>"
        }
      }
      html += "</tr>";
    });
    html += "</tbody>";
    table.innerHTML = html;
}
function renderStatTableRow(elementId, row){
  let table = document.getElementById(elementId);
  if (table === null)
    return;

  let html = "";
  html += `<td>${row.name}</td>`;
  html += `<td align="right" >${row.confirmed}${row.confirmedDiff}</td>`;
  html += `<td align="right">${row.recovered}${row.recoveredDiff}</td>`
  html += `<td align="right">${row.deaths}${row.deathsDiff}</td>`
  html += `<td align="right" class="${row.activeClass}">${row.active}${row.activeDiff}</td>`
  html += `<td align="right" class="${row.deathRateClass}">${row.deathRate}${row.deathRateDiff}</td>`
  html += `<td align="right">${row.somethingRate}${row.somethingRateDiff}</td>`
  html += `<td align="right">${row.deathsEstimated}${row.deathsEstimatedDiff}</td>`
  table.innerHTML = html;

}
function renderStatTable(elementId, rowIdPrefix, rows){
  let table = document.getElementById(elementId);
  if (table === null)
    return;

  let html = "";
  rows.forEach(row => {
      html += `<tr id ="${rowIdPrefix}${row.id}"></tr>`;
  });

  table.innerHTML = html;

}
function renderSettings(){
  const el = document.getElementById("settingsThresholdCountry")
  if (el !== null){
    let html = ""
    Object.keys(data).forEach(c => {
      let name = names[c];
      if (name === undefined)
        name = c
      html += `<option value="${c}">${name}</option>`
    });
    el.innerHTML = html;
  }
  configToForm(config);
}
function displayData(){
//    model = createModel(data);

    renderSettings();

    dds = createDates(data);
    manualDate = moment.unix(dds[0]).add(1,'days').format('YYYY-M-D')
//    console.log(manualDate)
    Object.keys(data).forEach(c => {
      if (names[c] === undefined){
        names[c] = c
      }
      if (names[countryId(c)] === undefined){
        names[countryId(c)] = names[c]
      }
    });
    totals["Total"] = createAllTotal(data);

    preprocess(data);
    preprocess(totals);

    current = createCurrent(data);

    dates = convertData(data);
    totalDates = convertData(totals)

    var threshold = config.maxThreshold;
    if (config.thresholdCountry !== undefined){
      if (dates[dds[0]][config.thresholdCountry] !== undefined){
        threshold = Math.min(threshold, dates[dds[0]][config.thresholdCountry].confirmed-1);
      }
    }
    document.getElementById("latestDate").innerHTML=moment.unix(dds[0]).format("DD.MM.YYYY");
    countries = buildCountries(dates[dds[0]], threshold);
    cols = countries.map(c => {return {id:countryId(c), c:c, name: names[c], isTotal: false}});
//    cols.unshift({id: "Europe", c:"Europe", name:names["Europe"], isTotal: true})
//    cols.unshift({id: "Total", c:"Total", name:names["Total"], isTotal: true})
    rows = dds.map(d => {return {unix: d, date: moment.unix(d).format("DD.MM.YYYY")}})

    renderStatTable("latestStat", "latestRow", cols);
    renderStatTable("currentStat", "currentRow", cols);

    outputBetterStatHtmlTable("latestRow", dates[dds[0]], countries);

    renderHistoryTable2("confirmedHistory",       {data:data, rows:rows, cols:cols, formatter:confirmedFormatter});
    renderHistoryTable2("recoveredHistory",       {data:data, rows:rows, cols:cols, formatter:recoveredFormatter});
    renderHistoryTable2("deathHistory",           {data:data, rows:rows, cols:cols, formatter:deathFormatter});
    renderHistoryTable2("activeHistory",          {data:data, rows:rows, cols:cols, formatter:activeFormatter});
    renderHistoryTable2("deathRateHistory",       {data:data, rows:rows, cols:cols, formatter:deathRateFormatter});
    renderHistoryTable2("somethingRateHistory",   {data:data, rows:rows, cols:cols, formatter:somethingRateFormatter});
    renderHistoryTable2("deathsEstimatedHistory", {data:data, rows:rows, cols:cols, formatter:deathsEstimatedFormatter});

    graphRows = cols.map(c => c)
    for(var tc in allTotalCountries){
      graphRows.unshift({id: allTotalCountries[tc], c:allTotalCountries[tc], name:names[allTotalCountries[tc]], isTotal: true})
    }
//    graphRows.unshift({id: "Total", c:"Total", name:names["Total"], isTotal: true})

    renderGraphTable("graphTableBody", graphRows);
    renderGraphRateTable("graphRateTableBody", graphRows);

    totals = {}


    totals["Total"] = createAllTotal(data, Object.keys(data));
    for(var tc in  totalCountries){
      totals[tc] = createAllTotal(data, totalCountries[tc]);
    }
    preprocess(totals);

    currentTotal = createCurrent(totals);
    totalDates = convertData(totals)

    outputBetterStatHtmlTable("latestRow", totalDates[dds[0]], allTotalCountries);

    countries.forEach(c => {
      if (data[c] !== undefined){
        const id = countryId(c);
      outputCountryGraph(c, id, false)
      }else{
        console.log(c);
      }
    })


    allTotalCountries.forEach(c => {
      let id = countryId(c);
      outputCountryGraph(c, id, true)
    });

    updateGraphCurrent(countries, dates[dds[0]]);
    updateGraphCurrent(allTotalCountries, totalDates[dds[0]]);
    updateGraphManual(countries, current);
    updateGraphManual(allTotalCountries, currentTotal);

    const el1 = document.getElementById("dynamic-threshold");
    if (el1 !== null){
      el1.innerHTML = config.dynamicThreshold
    }
    outputDynamicGraph("Динамика заразившихся", "dynamic-confirmed", data, d => d.confirmed, config.dynamicThreshold, 800, 400);
    outputDynamicGraph("Динамика выздоровлений", "dynamic-recovered", data, d => d.recovered, config.dynamicThreshold, 800, 400);
    outputDynamicGraph("Динамика смертей", "dynamic-deaths", data, d => d.deaths, config.dynamicThreshold, 800, 400);
    outputDynamicGraph("Динамика болеющих", "dynamic-active", data, d => d.active, config.dynamicThreshold, 800, 400);


}
