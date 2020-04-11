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

  "Total": "В мире"
};
const countryId = c => c.replace(" ","").replace(",","").replace("`","").replace("'","")

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
function totalStat(data){
    let s = {
        name: "Total",
        code: names["Total"],
        confirmed: 0,
        deaths: 0,
        recovered: 0,
        active: 0,
        closed: 0,
        confirmedDiff: 0,
        recoveredDiff: 0,
        deathsDiff: 0,
        activeDiff: 0,
        closedDiff: 0,
        deathsEstimated: 0,
        deathsEstimatedDiff: 0,
    };
    Object.keys(data).forEach(country => {
        if (country !== "Total"){
        let d = data[country];
        s.confirmed += d.confirmed;
        s.deaths += d.deaths;
        s.recovered += d.recovered;
        s.active += d.active;
        s.closed += d.closed;
        s.deathsEstimated += d.deathsEstimated;
        s.confirmedDiff += d.confirmedDiff;
        s.recoveredDiff += d.recoveredDiff;
        s.deathsDiff += d.deathsDiff;
        s.activeDiff += d.activeDiff;
        s.closedDiff += d.closedDiff;
        s.deathsEstimatedDiff += d.deathsEstimatedDiff;
        }
    });
    s.somethingRate = s.confirmed !== 0 ? s.deaths / s.confirmed : 0;
    s.deathRate = s.closed !== 0 ? s.deaths / s.closed : 0;
    s.recoveryRate = s.closed !== 0 ? s.recovered / s.closed : 0;
    s.confirmedPrev = s.confirmed - s.confirmedDiff;
    s.recoveredPrev = s.recovered - s.recoveredDiff;
    s.deathsPrev = s.deaths - s.deathsDiff;
    s.activePrev = s.active - s.activeDiff;
    s.closedPrev = s.closed - s.closedDiff;

    s.somethingRatePrev = s.confirmedPrev !== 0 ? s.deathsPrev / s.confirmedPrev : 0;
    s.deathRatePrev = s.closedPrev !== 0 ? s.deathsPrev / s.closedPrev : 0;
    s.recoveryRate = s.closedPrev !== 0 ? s.recoveredPrev / s.closedPrev : 0;
    s.deathsEstimated = Math.round(s.active * s.deathRate);
    s.deathsEstimatedPrev = Math.round(s.activePrev * s.deathRatePrev);

    s.somethingRateDiff = s.somethingRate - s.somethingRatePrev;
    s.deathRateDiff = s.deathRate - s.deathRatePrev;
    s.recoveryRateDiff = s.recoveryRate - s.recoveryRatePrev;
    s.deathsEstimatedDiff = s.deathsEstimated - s.deathsEstimatedPrev;
    return s;
}
function countryStat(data, codes, index){
      var stat = {}
      Object.keys(data).forEach(country => {
          let s = Object.assign({}, data[country][data[country].length-1-index]);
          s.name = country;
          s.code = codes[country] === undefined ? country : codes[country];
          stat[country] = s;
      });
      return stat;
}
function addCurrent(data){
      var stringMode = data[Object.keys(data)[0]].findIndex(d => typeof d.date === "number") < 0
      Object.keys(data).forEach(country => {
        const id = countryId(country);
        try{
          currentValue = localStorage["covid"+id];
          if (currentValue !== undefined){
            currentValue = JSON.parse(currentValue);
          }
        }catch(e){
          currentValue = undefined
        }
        last = data[country][data[country].length-1]
        let now = undefined
        if (stringMode){
          now = moment().format("YYYY-M-D");
        }else{
          now = moment(moment().format("YYYY-MM-DD"), "YYYY-MM-DD").unix()
        }
        cv = Object.assign({}, last, {date: now});
        if (currentValue !== undefined){
          cv = Object.assign(cv, currentValue) 
        }
        if (now !== undefined && last.date !== now && country !== "Total"){
          data[country].push(cv);
        }else if (now !== undefined && last.date === now){
          data[country][data[country].length-1] = cv
        }
      });
}
function convertData(data){
      var dates = {}

      Object.keys(data).forEach(country => {
          let prevD = undefined;
          // preprocessing
          data[country].forEach(dd => {
              let d = typeof dd.date === "string" ? moment(dd.date, "YYYY-M-D").unix() : dd.date;
              if (typeof(dates[d]) === "undefined"){
                dates[d] = {}
              }
              dd.date = d;
              dd.closed = dd.recovered + dd.deaths;
              dd.active = dd.confirmed - dd.closed;
              dd.somethingRate = dd.confirmed > 0 ? dd.deaths / dd.confirmed : 0;
              dd.deathRate = dd.closed > 0 ? dd.deaths / dd.closed : 0;
              dd.recoveryRate = dd.closed > 0 ? dd.recovered / dd.closed : 0;
              dd.deathsEstimated = Math.round(dd.active * dd.deathRate);
              if (prevD !== undefined){
                dd.confirmedDiff = dd.confirmed - prevD.confirmed;
                dd.recoveredDiff = dd.recovered - prevD.recovered;
                dd.deathsDiff = dd.deaths - prevD.deaths;
                dd.activeDiff = dd.active - prevD.active;
                dd.closedDiff = dd.closed - prevD.closed;
                dd.somethingRateDiff = dd.somethingRate - prevD.somethingRate;
                dd.deathRateDiff = dd.deathRate - prevD.deathRate;
                dd.recoveryRateDiff = dd.recoveryRate - prevD.recoveryRate;
                dd.deathsEstimatedDiff = dd.deathsEstimated - prevD.deathsEstimated;
                if (prevD.confirmedDiff !== undefined){
                  dd.confirmedDiffDiff = dd.confirmedDiff - prevD.confirmedDiff;
                }else{
                  dd.confirmedDiffDiff = 0;
                }
                if (prevD.activeDiff !== undefined){
                  dd.activeDiffDiff = dd.activeDiff - prevD.activeDiff;
                }else{
                  dd.activeDiffDiff = 0;
                }
                if (prevD.deathsDiff !== undefined){
                  dd.deathsDiffDiff = dd.deathsDiff - prevD.deathsDiff;
                }else{
                  dd.deathsDiffDiff = 0;
                }
              }else{
                dd.confirmedDiff = 0;
                dd.confirmedDiffDiff = 0;
                dd.activeDiffDiff = 0;
                dd.recoveredDiff = 0;
                dd.deathsDiff = 0;
                dd.deathsDiffDiff = 0;
                dd.activeDiff = 0;
                dd.closedDiff = 0;
                dd.somethingRateDiff = 0;
                dd.deathRateDiff = 0;
                dd.recoveryRateDiff = 0;
                dd.deathsEstimatedDiff = 0;
              }
              dates[d][country] = dd;

              prevD = dd;
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
function outputBetterStatHtmlTable(elementId, stat, countries){
    let html = "";
    countries.forEach(c => {
      let confirmedDiff = getColoredDiff(stat[c].confirmedDiff, "diff-red", "diff-green");
      let recoveredDiff = getColoredDiff(stat[c].recoveredDiff, "diff-green", "diff-red");
      let deathsDiff = getColoredDiff(stat[c].deathsDiff, "diff-red", "diff-green");
      let activeDiff = getColoredDiff(stat[c].activeDiff, "diff-red", "diff-green");
      let nameClass  = stat[c].activeDiff < 0 ? "diff-name-down" : "diff-name-up";
      let deathRateDiff = getColoredDiff((100 * stat[c].deathRateDiff).toFixed(1), "diff-red", "diff-green");
      let somethingRateDiff = getColoredDiff((100 * stat[c].somethingRateDiff).toFixed(1), "diff-red", "diff-green");
      let deathsEstimatedDiff = "";
      if (stat[c].deathsEstimatedDiff !== undefined){
          deathsEstimatedDiff = getColoredDiff(stat[c].deathsEstimatedDiff, "diff-red", "diff-green");
      }
      let deathRateClass = "";
      if (stat[c].deathRate > 0.5){
          deathRateClass = "death-rate-higher"
      }else if (stat[c].deathRate < 0.1){
          deathRateClass = "death-rate-lower"
      }
      let activeClass = "";
      if (stat[c].activeDiff < 0){
          activeClass = "death-rate-lower"
      }
      html += "<tr>";
      html += `<td>${stat[c].code}</td>`;
      html += `<td align="right" >${stat[c].confirmed.toLocaleString()}${confirmedDiff}</td>`;
      html += `<td align="right">${stat[c].recovered.toLocaleString()}${recoveredDiff}</td>`
      html += `<td align="right">${stat[c].deaths.toLocaleString()}${deathsDiff}</td>`
      html += `<td align="right" class="${activeClass}">${stat[c].active.toLocaleString()}${activeDiff}</td>`
      html += `<td align="right" class="${deathRateClass}">${(100 * stat[c].deathRate).toFixed(1)}${deathRateDiff}</td>`
      html += `<td align="right">${(100 * stat[c].somethingRate).toFixed(1)}${somethingRateDiff}</td>`
      html += `<td align="right">${stat[c].deathsEstimated.toLocaleString()}${deathsEstimatedDiff}</td>`
      html += "</tr>";
    });
    let table = document.getElementById(elementId);
    if (table !== null)
        table.innerHTML = html;
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

  addCurrent(data)
  var dates = convertData(data);
  let dds = Object.keys(dates);
    dds.sort((a,b) => {
      if (a > b)
        return -1;
      if (a < b)
        return 1;
      return 0;
  });
//  dates[dds[0]]["Total"] = totalStat(dates[dds[0]]);
//  currentStat["Total"] = dates[dds[0]]["Total"];
//  outputBetterStatHtmlTableForm("currentStat", currentStat, countries);
  var currentStat = countryStat(data, names, 0);

  const cid = id
  const countries = Object.keys(currentStat)
  const cidx = countries.findIndex(d => countryId(d) === cid)
  if (cidx < 0)
    return
  const c = countries[cidx]

  el = document.getElementById("currentRow"+cid)
  if (el === null)
    return

  let confirmedDiff = getColoredDiff(currentStat[c].confirmedDiff, "diff-red", "diff-green");
  let recoveredDiff = getColoredDiff(currentStat[c].recoveredDiff, "diff-green", "diff-red");
  let deathsDiff = getColoredDiff(currentStat[c].deathsDiff, "diff-red", "diff-green");
  let activeDiff = getColoredDiff(currentStat[c].activeDiff, "diff-red", "diff-green");
  let nameClass  = currentStat[c].activeDiff < 0 ? "diff-name-down" : "diff-name-up";
  let deathRateDiff = getColoredDiff((100 * currentStat[c].deathRateDiff).toFixed(1), "diff-red", "diff-green");
  let somethingRateDiff = getColoredDiff((100 * currentStat[c].somethingRateDiff).toFixed(1), "diff-red", "diff-green");
  let deathsEstimatedDiff = "";
  if (currentStat[c].deathsEstimatedDiff !== undefined){
      deathsEstimatedDiff = getColoredDiff(currentStat[c].deathsEstimatedDiff, "diff-red", "diff-green");
  }
  let deathRateClass = "";
  if (currentStat[c].deathRate > 0.5){
      deathRateClass = "death-rate-higher"
  }else if (currentStat[c].deathRate < 0.1){
      deathRateClass = "death-rate-lower"
  }
  let activeClass = "";
  if (currentStat[c].activeDiff < 0){
      activeClass = "death-rate-lower"
  }
  cb = `onCurrentUpdate('${cid}');`
  html = "";
  html += `<td>${currentStat[c].code}</td>`;
  html += `<td align="right"><input id="confirmed${cid}" value="${currentStat[c].confirmed}"/>${confirmedDiff}</td>`;
  html += `<td align="right"><input id="recovered${cid}" value="${currentStat[c].recovered}"/>${recoveredDiff}</td>`
  html += `<td align="right"><input id="deaths${cid}" value="${currentStat[c].deaths}"/>${deathsDiff}</td>`
  html += `<td align="right" class="${activeClass}">${currentStat[c].active.toLocaleString()}${activeDiff}</td>`
  html += `<td align="right" class="${deathRateClass}">${(100 * currentStat[c].deathRate).toFixed(1)}${deathRateDiff}</td>`
  html += `<td align="right">${(100 * currentStat[c].somethingRate).toFixed(1)}${somethingRateDiff}</td>`
  html += `<td align="right">${currentStat[c].deathsEstimated.toLocaleString()}${deathsEstimatedDiff}</td>`
  html += `<td><button onClick="${cb}">Сохранить</button><span id="modified${cid}"</span></td>`
  el.innerHTML = html

  updateGraphCurrent(countries)
}

function outputBetterStatHtmlTableForm(elementId, stat, countries){
    let html = "";
    countries.forEach(c => {
      if (stat[c] == undefined)
        return;
      const cid = countryId(c)
      let confirmedDiff = getColoredDiff(stat[c].confirmedDiff, "diff-red", "diff-green");
      let recoveredDiff = getColoredDiff(stat[c].recoveredDiff, "diff-green", "diff-red");
      let deathsDiff = getColoredDiff(stat[c].deathsDiff, "diff-red", "diff-green");
      let activeDiff = getColoredDiff(stat[c].activeDiff, "diff-red", "diff-green");
      let nameClass  = stat[c].activeDiff < 0 ? "diff-name-down" : "diff-name-up";
      let deathRateDiff = getColoredDiff((100 * stat[c].deathRateDiff).toFixed(1), "diff-red", "diff-green");
      let somethingRateDiff = getColoredDiff((100 * stat[c].somethingRateDiff).toFixed(1), "diff-red", "diff-green");
      let deathsEstimatedDiff = "";
      if (stat[c].deathsEstimatedDiff !== undefined){
          deathsEstimatedDiff = getColoredDiff(stat[c].deathsEstimatedDiff, "diff-red", "diff-green");
      }
      let deathRateClass = "";
      if (stat[c].deathRate > 0.5){
          deathRateClass = "death-rate-higher"
      }else if (stat[c].deathRate < 0.1){
          deathRateClass = "death-rate-lower"
      }
      let activeClass = "";
      if (stat[c].activeDiff < 0){
          activeClass = "death-rate-lower"
      }
      cb = `onCurrentUpdate('${cid}');`
      html += `<tr id ="currentRow${cid}">`;
      html += `<td>${stat[c].code}</td>`;
      html += `<td align="right"><input id="confirmed${cid}" value="${stat[c].confirmed}"/>${confirmedDiff}</td>`;
      html += `<td align="right"><input id="recovered${cid}" value="${stat[c].recovered}"/>${recoveredDiff}</td>`
      html += `<td align="right"><input id="deaths${cid}" value="${stat[c].deaths}"/>${deathsDiff}</td>`
      html += `<td align="right" class="${activeClass}">${stat[c].active.toLocaleString()}${activeDiff}</td>`
      html += `<td align="right" class="${deathRateClass}">${(100 * stat[c].deathRate).toFixed(1)}${deathRateDiff}</td>`
      html += `<td align="right">${(100 * stat[c].somethingRate).toFixed(1)}${somethingRateDiff}</td>`
      html += `<td align="right">${stat[c].deathsEstimated.toLocaleString()}${deathsEstimatedDiff}</td>`
      html += `<td><button onClick="${cb}">Сохранить</button><span id="modified${cid}"</span></td>`
      html += "</tr>";
    });
    let table = document.getElementById(elementId);
    if (table !== null)
        table.innerHTML = html;
}
function outputHistoryHtmlTable(elementId, dates, stat, countries, formatter){
    let html = "";
    html += "<thead>";
    html += "<tr>";
    html += "<th>Date</th>";
    let dds = Object.keys(dates);
    dds.sort((a,b) => {
      if (a > b)
        return -1;
      if (a < b)
        return 1;
      return 0;
    });

    countries.forEach(c => {
        html += `<th class="rotated-text"><div><span>${stat[c].code}</span></div></th>`;
    });
    html += "</tr>";
    html += "</thead>";
    html += "<tbody>";
    let prevD = undefined;
    dds.forEach(d => {
      html += "<tr>";
      html += `<td>${moment.unix(d).format("DD.MM.YYYY")}</td>`;
      countries.forEach(c => {
        let dd = dates[d][c];
        if (dd !== undefined){
          html += formatter(dd)
        }else{
          html += "<td></td>"
        }
      });
//      console.log(ddd);
      html += "</tr>";
      prevDD = d;
    });
    html += "</tbody>";
    let table = document.getElementById(elementId);
    if (table !== null)
        table.innerHTML = html;
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
      setter(data[i], Math.round(vsa / cnt))
    }else{
      setter(data[i], 0)
    }
  })
}

function outputGraph(id, d, accessor, width, height, yName){
  if (document.getElementById(id) == null)
    return;
  const margin = {top: 35, right: 20, bottom: 50, left: 70};
  var data = []
  d.forEach(k => {
    data.push({d: new Date(1000 * k.date), v:accessor(k), confirmed:k.confirmed})
  })
  current = data.pop();
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
  y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.v)])
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
    data.push({d: new Date(1000 * k.date), deaths:k.deathsDiff, recovery: k.recoveredDiff})
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
          .attr("y", 10)
          .attr("fill", "red")
          .attr("text-anchor", "start")
          .text(data.yDeaths)
          .append("tspan")
          .attr("x", -margin.left+5)
          .attr("y", 25)
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

function updateGraphCurrent(countries){
    countries.forEach(c => {
      if (data[c] !== undefined){
        const id = countryId(c);
        el = document.getElementById("confirmedDiffCurrent"+id)
        if (el !== null){
          el.innerHTML =  data[c][data[c].length - 1].confirmedDiff.toLocaleString()
        }
        el = document.getElementById("recoveredDiffCurrent"+id)
        if (el !== null){
          el.innerHTML =  data[c][data[c].length - 1].recoveredDiff.toLocaleString()
        }
        el = document.getElementById("deathsDiffCurrent"+id)
        if (el !== null){
          el.innerHTML =  data[c][data[c].length - 1].deathsDiff.toLocaleString()
        }
        el = document.getElementById("activeCurrent"+id)
        if (el !== null){
          el.innerHTML =  data[c][data[c].length - 1].active.toLocaleString()
        }
      }
    })
} 
function displayData(){
    addCurrent(data);
    var dates = convertData(data);
    let dds = Object.keys(dates);
    dds.sort((a,b) => {
      if (a > b)
        return -1;
      if (a < b)
        return 1;
      return 0;
    });
    dds.forEach(d => {
      dates[d]["Total"] = Object.assign(totalStat(dates[d]), {date:d});
    });

    v = localStorage["covidTotal"]
    if (v !== undefined){
      try{ v = JSON.parse(v) } catch { v = undefined }
      v = Object.assign(dates[dds[0]]["Total"], v)
      v.confirmedDiff = v.confirmed - v.confirmedPrev;
      v.deathsDiff = v.deaths - v.deathsPrev;
      v.recoveredDiff = v.recovered - v.recoveredPrev;
      v.inactive = v.recovered + v.deaths;
      v.active = v.confirmed - v.inactive;
      v.activeDiff = v.active - v.activePrev;
      dates[dds[0]]["Total"] = v
    }
    data["Total"] = []
    dds.forEach(d => {
      obj = Object.assign(dates[d]["Total"],{date: +d})
      data["Total"].unshift(obj);
    })
    var stat = countryStat(data, names, 1);
    var currentStat = countryStat(data, names, 0);
    let d0 = dds[1];
    var threshold0 = dates[dds[1]]["Japan"].confirmed-1;
    var threshold1 = dates[dds[2]]["Japan"].confirmed-1;
    var threshold = threshold0;
    if (threshold1 < threshold)
      threshold = threshold1;
    if (threshold > 4000)
      threshold = 4000;

    document.getElementById("latestDate").innerHTML=moment.unix(d0).format("DD.MM.YYYY");
    stat["Total"] = dates[dds[1]]["Total"];
    currentStat["Total"] = dates[dds[0]]["Total"];
    var countries = buildCountries(stat, threshold);

    outputBetterStatHtmlTable("latestStat", stat, countries);
    outputBetterStatHtmlTableForm("currentStat", currentStat, countries);

    outputHistoryHtmlTable("confirmedHistory",       dates, stat, countries, confirmedFormatter);
    outputHistoryHtmlTable("recoveredHistory",       dates, stat, countries, recoveredFormatter);
    outputHistoryHtmlTable("deathHistory",           dates, stat, countries, deathFormatter);
    outputHistoryHtmlTable("activeHistory",          dates, stat, countries, activeFormatter);
    outputHistoryHtmlTable("deathRateHistory",       dates, stat, countries, deathRateFormatter);
    outputHistoryHtmlTable("somethingRateHistory",   dates, stat, countries, somethingRateFormatter);
    outputHistoryHtmlTable("deathsEstimatedHistory", dates, stat, countries, deathsEstimatedFormatter);

    var htmlRows = ""
    countries.forEach(c => {
      if (data[c] !== undefined){
        id = c.replace(" ","").replace(",","")
        var name = c;
        if (names[c] !== undefined)
          name = names[c];
        htmlRows += "<tr>"
        htmlRows +="<td>"
        htmlRows += `<span>${name}</span><br/>`
        htmlRows += `<span style="color:orange" id="confirmedDiffCurrent${id}"></span><br/>`
        htmlRows += `<span style="color:green"  id="recoveredDiffCurrent${id}"></span><br/>`
        htmlRows += `<span style="color:red"  id="deathsDiffCurrent${id}"></span><br/>`
        htmlRows += `<span style="color:orange"  id="activeCurrent${id}"></span><br/>`
        htmlRows += "</td>";
        htmlRows +=`<td><div id="graph${id}"></div></td>`;
        htmlRows +=`<td><div id="graphDeathRecovery${id}"></div></td>`;
//        htmlRows +=`<td><div id="graphDeathVsRecovery${id}"></div></td>`;
        htmlRows +=`<td><div id="graphActive${id}"></div></td>`;
        htmlRows +="</tr>"
      }
    })
    tbody = document.getElementById("graphTableBody")
    if (tbody !== null)
        tbody.innerHTML = htmlRows;
    const width = 300
    const height = 180
    countries.forEach(c => {
      if (data[c] !== undefined){
        const id = countryId(c);
        outputGraph("graph"+id, data[c], d => d.confirmedDiff, width, height, "")
        outputGraph("graphActive"+id, data[c], d => d.active, width, height, "")
        outputDeathRecoveryGraph("graphDeathRecovery"+id, data[c], width, height)
//        outputDeathVsRecoveryGraph("graphDeathVsRecovery"+id, data[c], width, height)
      }else{
        console.log(c);
      }
    })
    updateGraphCurrent(countries);
}
