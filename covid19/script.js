var europe = [
//  "Albania",
  "Austria",
  "Belgium",
  "Bulgaria",
  "Croatia",
  "Czechia",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hungary",
  "Iceland",
  "Italy",
  "Ireland",
  "Latvia",
  "Lithuania",
  "Bosnia and Herzegovina",
  "Luxembourg",
  "Moldova",
  "Netherlands",
  "Norway",
  "Poland",
  "Serbia",
  "Slovakia",
  "Slovenia",
  "Romania",
  "Portugal",
  "Spain",
  "Sweden",
  "Switzerland",
  "United Kingdom",
];
var names = {
  "Australia": "Австралия",
  "Austria": "Австрия",
  "Belgium": "Бельгия",
  "Brazil": "Бразилия",
  "Canada": "Канада",
  "Chile": "Чили",
  "China": "Китай",
  "Czechia" : "Чехия",
  "Denmark": "Дания",
  "Ecuador": "Эквадор",
  "France": "Франция",
  "Germany": "Германия",
  "Japan": "Япония",
  "India": "Индия",
  "Indonesia": "Индонезия",
  "Iran": "Иран",
  "Ireland": "Ирландия",
  "Israel": "Израиль",
  "Italy": "Италия",
  "Korea, South": "Ю.Корея",
  "Luxembourg": "Люксембург",
  "Malaysia": "Малайзия",
  "Mexico" :"Мексика",
  "Netherlands": "Голландия",
  "Norway": "Норвегия",
  "Pakistan": "Пакистан",
  "Philippines": "Филиппины",
  "Poland": "Польша",
  "Peru": "Перу",
  "Portugal": "Португалия",
  "Romania": "Румыния",
  "Russia": "Россия",
  "Saudi Arabia": "Саудовская Аравия", 
  "Spain": "Испания",
  "Sweden": "Швеция",
  "Switzerland": "Швейцария",
  "Turkey": "Турция",
  "United Kingdom": "Великобритания",
  "US": "США",

  "Total": "В мире",
  "Europe": "В Европе",
};

var countries = [];
var dds = [];
var totals = {"Total": []};
var current = {}

const countryId = c => c.replace(" ","").replace(",","").replace("`","").replace("'","")

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
    if (first && (v === undefined || isNaN(v[dateIndex].confirmed))){
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
  firstCountry = desiredCountries[0];
  for(var i=0; i<data[firstCountry].length; i++){
    res.push(createDateTotal(data, i, desiredCountries));
  }
  return res;
}
function updateDiff(c,p){
  c.unix = moment(c.date, "YYYY-M-D").unix()
  c.closed = +c.deaths + c.recovered;
  c.active = +c.confirmed - c.closed;
  c.somethingRate = c.confirmed !== 0 ? c.deaths / c.confirmed : 0;
  c.deathRate = c.closed !== 0 ? c.deaths / c.closed : 0;
  c.recoveryRate = c.closed !== 0 ? c.recovered / c.closed : 0;
  c.deathsEstimated = Math.round(c.active * c.deathRate);

  if (p == undefined){
    c.confirmedDiff = 0;
    c.recoveredDiff = 0;
    c.deathsDiff = 0;
    c.somethingRateDiff = 0;
    c.deathRateDiff = 0;
    c.recoveryRateDiff = 0;
    c.deathsEstimatedDiff = 0;
  }else{
    c.confirmedDiff = +c.confirmed - p.confirmed;
    c.recoveredDiff = +c.recovered - p.recovered;
    c.deathsDiff    = +c.deaths - p.deaths;
    c.somethingRateDiff = c.somethingRate - p.somethingRate;
    c.deathRateDiff = c.deathRate - p.deathRate;
    c.recoveryRateDiff = c.recoveryRate - p.recoveryRate;
    c.deathsEstimatedDiff = c.deathsEstimated - p.deathsEstimated;
  }

  c.closedDiff = +c.deathsDiff + c.recoveredDiff;
  c.activeDiff = +c.confirmedDiff - c.closedDiff;
}
function preprocess(data){
  Object.entries(data).forEach(entry => {
    let prev = undefined
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

function loadData(){
  fetch("https://pomber.github.io/covid19/timeseries.json")
  .then(response => response.json())
  .then(d => {
    data = d
    displayData();
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
  res = Object.assign({}, country_data, {date: nowDate});

  try{
    currentValue = localStorage["covid"+countryId];
    if (currentValue !== undefined){
      currentValue = JSON.parse(currentValue);
      res = Object.assign(res, currentValue);
      }
  }catch(e){
  }
  return res;
}
function createCurrent(data){
  let nowDate = moment().format("YYYY-M-D")
  let res = {}
  Object.entries(data).forEach(entry => {
    const id = countryId(entry[0]);
    country_data = entry[1]
    res[entry[0]] = createCurrentCountry(nowDate, id, country_data[country_data.length-1]);
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

function outputBetterStatHtmlTable(rowIdPrefix, stat, countries){
  const rows = countries.map(c => {
      return {
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
function onCurrentUpdate(id){


  obj = localStorage["covid"+id]
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
    obj.confirmed = parseInt(el.value);
  el = document.getElementById("deaths"+id);
  if (el !== null)
    obj.deaths = parseInt(el.value);
  el = document.getElementById("recovered"+id);
  if (el !== null)
    obj.recovered = parseInt(el.value);
  el = document.getElementById("modified"+id);
  if (el !== null){
    el.innerHTML = "сохранено";
  }
  localStorage["covid"+id] = JSON.stringify(obj);


  el = document.getElementById("currentRow"+id)
  if (el === null)
    return

  const cidx = countries.findIndex(d => countryId(d) === id)
  if (cidx < 0)
    return
  const c = countries[cidx]

  current[c] = createCurrentCountry(moment().format("YYYY-M-D"), id, data[c][data[c].length-1])
  updateDiff(current[c], data[c][data[c].length-1])

  row = {
    id: countryId(c),
    name: current[c].code,
    confirmed: current[c].confirmed,
    recovered: current[c].recovered,
    deaths: current[c].deaths,
    active: current[c].active.toLocaleString(),
    deathRate: (100 * current[c].deathRate).toFixed(1),
    somethingRate: (100 * current[c].somethingRate).toFixed(1),
    deathsEstimated: current[c].deathsEstimated.toLocaleString(),
    confirmedDiff: getColoredDiff(current[c].confirmedDiff, "diff-red", "diff-green"),
    recoveredDiff: getColoredDiff(current[c].recoveredDiff, "diff-green", "diff-red"),
    deathsDiff: getColoredDiff(current[c].deathsDiff, "diff-red", "diff-green"),
    activeDiff: getColoredDiff(current[c].activeDiff, "diff-red", "diff-green"),
    deathRateDiff: getColoredDiff((100 * current[c].deathRateDiff).toFixed(1), "diff-red", "diff-green"),
    somethingRateDiff: getColoredDiff((100 * current[c].somethingRateDiff).toFixed(1), "diff-red", "diff-green"),
    deathsEstimatedDiff: current[c].deathsEstimatedDiff !== undefined ? getColoredDiff(current[c].deathsEstimatedDiff, "diff-red", "diff-green") : "",
    activeClass: current[c].activeDiff < 0 ? "death-rate-lower" : "",
    deathRateClass: current[c].deathRate > 0.5 ? "death-rate-higher" : (current[c].deathRate < 0.1 ? "death-rate-lower" : ""),
  }
  renderStatTableFormRow("currentRow"+row.id, row);

//  outputGraph("graph"+row.id, totals[c], d => d.confirmedDiff, width, height, Math.max(0,currentTotal[c].confirmedDiff))
//  outputGraph("graphActive"+row.id, totals[c], d => d.active, width, height, currentTotal[c].active)
//  outputDeathRecoveryGraph("graphDeathRecovery"+id, totals[c], width, height)
//  outputGraph("graphDeathRate"+row.id, totals[c], d => (100*d.deathRate), width, height, 100*currentTotal[c].deathRate)

  updateGraphCurrent(countries, current)
}

function outputBetterStatHtmlTableForm(rowIdPrefix, stat, countries){
  const rows = countries.map(c => { 
    return {
      id: countryId(c),
      name: stat[c].code,
      confirmed: stat[c].confirmed,
      recovered: stat[c].recovered,
      deaths: stat[c].deaths,
      active: stat[c].active.toLocaleString(),
      deathRate: (100 * stat[c].deathRate).toFixed(1),
      somethingRate: (100 * stat[c].somethingRate).toFixed(1),
      deathsEstimated: stat[c].deathsEstimated.toLocaleString(),
      confirmedDiff: getColoredDiff(stat[c].confirmedDiff, "diff-red", "diff-green"),
      recoveredDiff: getColoredDiff(stat[c].recoveredDiff, "diff-green", "diff-red"),
      deathsDiff: getColoredDiff(stat[c].deathsDiff, "diff-red", "diff-green"),
      activeDiff: getColoredDiff(stat[c].activeDiff, "diff-red", "diff-green"),
      deathRateDiff: getColoredDiff((100 * stat[c].deathRateDiff).toFixed(1), "diff-red", "diff-green"),
      somethingRateDiff: getColoredDiff((100 * stat[c].somethingRateDiff).toFixed(1), "diff-red", "diff-green"),
      deathsEstimatedDiff: stat[c].deathsEstimatedDiff !== undefined ? getColoredDiff(stat[c].deathsEstimatedDiff, "diff-red", "diff-green") : "",
      activeClass: stat[c].activeDiff < 0 ? "death-rate-lower" : "",
      deathRateClass: stat[c].deathRate > 0.5 ? "death-rate-higher" : (stat[c].deathRate < 0.1 ? "death-rate-lower" : ""),
      }
  });
  rows.forEach(row => {
    renderStatTableFormRow(rowIdPrefix+row.id, row);
  });
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
  return `<td class="${tdClass}">${d.confirmed.toLocaleString()}${getColoredDiff(d.confirmedDiff, "diff-red", "diff-green")}</td>`
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
function calcSA(data, width, getter, setter){
  Object.keys(data).forEach(i => {
    vs = []
    for(var j=0; j<width; j++){
      var idx1 = +i-j;
      var idx2 = +i+j;
      if (idx1 >=0 && idx2 >=0 && data[idx1] !== undefined && data[idx2] !== undefined){
        vs.push(getter(data[idx1]))
        vs.push(getter(data[idx2]))
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

function outputGraph(id, d, accessor, width, height, currentValue){
  if (document.getElementById(id) == null)
    return;

  const margin = {top: 35, right: 20, bottom: 50, left: 70};
  var data = []
  d.forEach(k => {
    data.push({d: new Date(1000 * k.unix), v:accessor(k), confirmed:k.confirmed})
  })
  data.pop();
  var latest = data.length - 1
  calcSA(data, 5, d => d.v, (d,v) => {d.vsa = v})
  const vsa_max = d3.max(data, d => d.vsa)
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

  yMax = d3.max(data, d => d.v)
  if (currentValue !== undefined)
    yMax = Math.max(currentValue, yMax)

  y = d3.scaleLinear()
        .domain([0, yMax])
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
  yAxis = g => g
      .attr("transform", `translate (${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6).tickFormat(x => x.toLocaleString()))
//      .call(g => g.select(".domain").remove())
      .call(g => g.append("text")
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
      .attr("x", d => x(d.d)+1)
      .attr("width", d => width / data.length-2)
      .attr("fill", d => d.vsa === vsa_max ? "steelblue" : "orange")
      .attr("y", d => y(d.v))
      .attr("height", d => y(0)-y(d.v));

    line = d3.line()
      .defined(d => !isNaN(d.vsa))
      .x(d => x(d.d) + width /data.length - 2)
      .y(d => y(d.vsa))


    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", line);
    if (currentValue !== undefined){
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

    svg.append("g")
      .call(xAxis);
    svg.append("g")
      .call(yAxis);
}
function outputDeathRecoveryGraph(id, d, width, height){
  if (document.getElementById(id) == null)
    return;
  const margin = {top: 35, right: 20, bottom: 50, left: 70};
  var data = []
  d.forEach(k => {
    data.push({d: new Date(1000 * k.unix), deaths:k.deathsDiff, recovery: k.recoveredDiff})
  })
  data.pop();
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
  y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d3.max([d.deaths,d.recovery]))]).nice()
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

  yAxis = g => g
      .attr("transform", `translate (${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(4).tickFormat(x => x.toLocaleString()))
      .call(g => g.select(".domain").remove())
      .call(g => g
          .append("text")
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

    const svg = d3.select("#"+id)
      .append("svg")
//      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height);
    svg.append("g")
      .attr("fill", "red")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("opacity", 0.5)
      .attr("x", d => x(d.d)+1)
      .attr("width", d => width / data.length-2)
      .attr("y", d => y(d.deaths))
      .attr("height", d => y(0)-y(d.deaths));
    svg.append("g")
      .attr("fill", "green")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("opacity", 0.5)
      .attr("x", d => x(d.d)+1)
      .attr("width", d => width / data.length-2)
      .attr("y", d => y(d.recovery))
      .attr("height", d => y(0)-y(d.recovery));

    lineDeaths = d3.line()
      .defined(d => !isNaN(d.deathsSA))
      .x(d => x(d.d) + width /data.length - 2)
      .y(d => y(d.deathsSA))
    lineRecovery = d3.line()
      .defined(d => !isNaN(d.recoverySA))
      .x(d => x(d.d) + width /data.length - 2)
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


    svg.append("line")
      .attr("x1", margin.left)
      .attr("y1", y(data[data.length-1].recovery))
      .attr("x2", width - margin.right)
      .attr("y2", y(data[data.length-1].recovery))
      .attr("stroke-dasharray", [5,5])
      .attr("stroke", "green")
      .attr("stroke-width", 1)
      ;
    svg.append("line")
      .attr("x1", margin.left)
      .attr("y1", y(data[data.length-1].deaths))
      .attr("x2", width - margin.right)
      .attr("y2", y(data[data.length-1].deaths))
      .attr("stroke-dasharray", [5,5])
      .attr("stroke", "red")
      .attr("stroke-width", 1)
      ;

    svg.append("g")
      .call(xAxis);
    svg.append("g")
      .call(yAxis);
}
function outputDeathVsRecoveryGraph(id, d, width, height){
  if (document.getElementById(id) == null)
    return;
  const margin = {top: 20, right: 20, bottom: 50, left: 70};
  var data = []
  d.forEach(k => {
    data.push({d: new Date(1000 * k.date), v:k.recoveredDiff - k.deathsDiff })
  })
  data.pop();
  calcSA(data, 5, d => d.v, (d,v) => {d.vsa = v})
  x = d3.scaleTime()
        .domain(d3.extent(data.map(d => d.d))).nice()
        .range([margin.left, width - margin.right]);
  y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.v)).nice()
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

  yAxis = g => g
      .attr("transform", `translate (${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(4).tickFormat(x => x.toLocaleString()))
      .call(g => g.select(".domain").remove())
      .call(g => g.append("text")
          .attr("x", -margin.left)
          .attr("y", 10)
          .attr("fill", "currentColot")
          .attr("text-anchor", "start")
          .text(data.y))

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
      .attr("fill", d => d.v >= 0 ? "green" : "red")
      .attr("x", d => x(d.d)+1)
      .attr("width", d => width / data.length-2)
      .attr("y", d => d.v >=0 ? y(d.v) : y(0))
      .attr("height", d => d.v >=0? y(0)-y(d.v): y(d.v)-y(0));

    line = d3.line()
      .defined(d => !isNaN(d.vsa))
      .x(d => x(d.d) + width /data.length - 2)
      .y(d => y(d.vsa))

    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", line);
    svg.append("g")
      .call(xAxis);
    svg.append("g")
      .call(yAxis);
}

function updateGraphCurrent(cs, cur){
    cs.forEach(c => {
      if (cur[c] !== undefined){
        const id = countryId(c);
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
    htmlRows +="<td>"
    htmlRows += `<span>${c.name}</span><br/>`
    htmlRows += `<span style="color:orange" id="confirmedDiffCurrent${c.id}"></span><br/>`
    htmlRows += `<span style="color:green"  id="recoveredDiffCurrent${c.id}"></span><br/>`
    htmlRows += `<span style="color:red"  id="deathsDiffCurrent${c.id}"></span><br/>`
    htmlRows += `<span style="color:orange"  id="activeCurrent${c.id}"></span><br/>`
    htmlRows += "</td>";
    htmlRows +=`<td><div id="graph${c.id}"></div></td>`;
    htmlRows +=`<td><div id="graphDeathRecovery${c.id}"></div></td>`;
//        htmlRows +=`<td><div id="graphDeathVsRecovery${c.id}"></div></td>`;
    htmlRows +=`<td><div id="graphActive${c.id}"></div></td>`;
    htmlRows +=`<td><div id="graphDeathRate${c.id}"></div></td>`;
    htmlRows +="</tr>"
  })

  tbody.innerHTML = htmlRows;

}
function renderHistoryTable(elementId, params){
    let table = document.getElementById(elementId);
    if (table === null)
      return;

    dates = params.dates;
    rows = params.rows;
    cols = params.cols;
    formatter = params.formatter;

    let html = "";
    html += "<thead>";
    html += "<tr>";
    html += "<th>Date</th>";

    cols.forEach(c => {
        html += `<th class="rotated-text"><div><span>${c.name}</span></div></th>`;
    });
    html += "</tr>";
    html += "</thead>";
    html += "<tbody>";
    rows.forEach(row => {
      html += "<tr>";
      html += `<td>${row.date}</td>`;
      cols.forEach(c => {
        let dd = dates[row.unix][c.c];
        if (dd !== undefined){
          html += formatter(dd)
        }else{
          html += "<td></td>"
        }
      });
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
function renderStatTableFormRow(elementId, row){
  let el = document.getElementById(elementId);
  if (el === null)
    return;

  let html = "";
  html += `<td>${row.name}</td>`;
  html += `<td align="right"><input id="confirmed${row.id}" value="${row.confirmed}"/>${row.confirmedDiff}</td>`;
  html += `<td align="right"><input id="recovered${row.id}" value="${row.recovered}"/>${row.recoveredDiff}</td>`
  html += `<td align="right"><input id="deaths${row.id}" value="${row.deaths}"/>${row.deathsDiff}</td>`
  html += `<td align="right" class="${row.activeClass}">${row.active}${row.activeDiff}</td>`
  html += `<td align="right" class="${row.deathRateClass}">${row.deathRate}${row.deathRateDiff}</td>`
  html += `<td align="right">${row.somethingRate}${row.somethingRateDiff}</td>`
  html += `<td align="right">${row.deathsEstimated}${row.deathsEstimatedDiff}</td>`
  html += `<td><button onClick="onCurrentUpdate('${row.id}');">Сохранить</button><span id="modified${row.id}"</span></td>`
  html += "</tr>";
  el.innerHTML = html;
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

function onLoad(){
  loadData();
}
function displayData(){
    dds = createDates(data);
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
    Object.keys(current).forEach(country => {
      updateDiff(current[country], data[country][data[country].length-1]);
    });

    var dates = convertData(data);
    var totalDates = convertData(totals)

    let d0 = dds[0];
    var threshold0 = dates[dds[0]]["Japan"].confirmed-1;
    var threshold1 = dates[dds[1]]["Japan"].confirmed-1;
    var threshold = threshold0;
    if (threshold1 < threshold)
      threshold = threshold1;
    if (threshold > 4000)
      threshold = 4000;

    document.getElementById("latestDate").innerHTML=moment.unix(d0).format("DD.MM.YYYY");
    countries = buildCountries(dates[dds[0]], threshold);
    cols = countries.map(c => {return {id:countryId(c), c:c, name: names[c]}});
    cols.unshift({id: "Europe", c:"Europe", name:names["Europe"]})
    cols.unshift({id: "Total", c:"Total", name:names["Total"]})
    rows = dds.map(d => {return {unix: d, date: moment.unix(d).format("DD.MM.YYYY")}})

    renderStatTable("latestStat", "latestRow", cols);
    renderStatTable("currentStat", "currentRow", cols);

    outputBetterStatHtmlTable("latestRow", dates[dds[0]], countries);
    outputBetterStatHtmlTableForm("currentRow", current, countries);

    renderHistoryTable("confirmedHistory",       {rows:rows, dates:dates, cols:cols, formatter:confirmedFormatter});
    renderHistoryTable("recoveredHistory",       {rows:rows, dates:dates, cols:cols, formatter:recoveredFormatter});
    renderHistoryTable("deathHistory",           {rows:rows, dates:dates, cols:cols, formatter:deathFormatter});
    renderHistoryTable("activeHistory",          {rows:rows, dates:dates, cols:cols, formatter:activeFormatter});
    renderHistoryTable("deathRateHistory",       {rows:rows, dates:dates, cols:cols, formatter:deathRateFormatter});
    renderHistoryTable("somethingRateHistory",   {rows:rows, dates:dates, cols:cols, formatter:somethingRateFormatter});
    renderHistoryTable("deathsEstimatedHistory", {rows:rows, dates:dates, cols:cols, formatter:deathsEstimatedFormatter});

    graphRows = cols.map(c => c)

    renderGraphTable("graphTableBody", graphRows);
    const width = 300
    const height = 180
    countries.forEach(c => {
      if (data[c] !== undefined){
        const id = countryId(c);
        outputGraph("graph"+id, data[c], d => d.confirmedDiff, width, height, Math.max(0, current[c].confirmedDiff))
        outputGraph("graphActive"+id, data[c], d => d.active, width, height, current[c].active)
        outputDeathRecoveryGraph("graphDeathRecovery"+id, data[c], width, height)
//        outputDeathVsRecoveryGraph("graphDeathVsRecovery"+id, data[c], width, height)
        outputGraph("graphDeathRate"+id, data[c], d => (100*d.deathRate), width, height, 100*current[c].deathRate)
      }else{
        console.log(c);
      }
    })

    totals = {}

    totals["Europe"] = createAllTotal(data, europe);
    totals["Total"] = createAllTotal(data, countries);

    preprocess(totals);
    const totalCountries =  ["Total", "Europe"];

    currentTotal = createCurrent(totals);
    Object.keys(currentTotal).forEach(country => {
      updateDiff(currentTotal[country], totals[country][totals[country].length-1]);
    });
    var totalDates = convertData(totals)

    outputBetterStatHtmlTable("latestRow", totalDates[dds[0]], totalCountries);
    outputBetterStatHtmlTableForm("currentRow", currentTotal, totalCountries);

    totalCountries.forEach(c => {
      let id = countryId(c);
      outputGraph("graph"+id, totals[c], d => d.confirmedDiff, width, height, Math.max(0,currentTotal[c].confirmedDiff))
      outputGraph("graphActive"+id, totals[c], d => d.active, width, height, currentTotal[c].active)
      outputDeathRecoveryGraph("graphDeathRecovery"+id, totals[c], width, height)
//      outputDeathVsRecoveryGraph("graphDeathVsRecovery"+id, totals[c], width, height)
        outputGraph("graphDeathRate"+id, totals[c], d => (100*d.deathRate), width, height, 100*currentTotal[c].deathRate)
    });
    updateGraphCurrent(countries, current);
    updateGraphCurrent(totalCountries, currentTotal);
}
