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
  "France": "Франция",
  "Germany": "Германия",
  "Iran": "Иран",
  "Ireland": "Ирландия",
  "Israel": "Израиль",
  "Italy": "Италия",
  "Korea, South": "Ю.Корея",
  "Netherlands": "Голландия",
  "Norway": "Норвегия",
  "Portugal": "Португалия",
  "Russia": "Россия",
  "Spain": "Испания",
  "Sweden": "Швеция",
  "Switzerland": "Швейцария",
  "Turkey": "Турция",
  "United Kingdom": "Великобритания",
  "US": "США",

  "Total": "В мире"
};
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
    });
    s.somethingRate = s.confirmed !== 0 ? s.deaths / s.confirmed : 0;
    s.deathRate = s.closed !== 0 ? s.deaths / s.closed : 0;
    s.recoveryRate = s.closed !== 0 ? s.recovered / s.closed : 0;
    s.confirmedPrev = s.confirmed - s.confirmedDiff;
    s.recoveredPrev = s.recovered - s.recoveredDiff;
    s.deathsPrev = s.deaths - s.deathsDiff;
    s.activePred = s.active - s.activeDiff;
    s.closedPrev = s.closed - s.closedDiff;

    s.somethingRatePrev = s.confirmedPrev !== 0 ? s.deathsPrev / s.confirmedPrev : 0;
    s.deathRatePrev = s.closedPrev !== 0 ? s.deathsPrev / s.closedPrev : 0;
    s.recoveryRate = s.closedPrev !== 0 ? s.recoveredPrev / s.closedPrev : 0;
    s.deathsEstimated = Math.round(s.active * s.deathRate);
    s.deathsEstimatedPrev = Math.round(s.activePred * s.deathRatePrev);

    s.somethingRateDiff = s.somethingRate - s.somethingRatePrev;
    s.deathRateDiff = s.deathRate - s.deathRatePrev;
    s.recoveryRateDiff = s.recoveryRate - s.recoveryRatePrev;
    s.deathsEstimatedDiff = s.deathsEstimated - s.deathsEstimatedPrev;
    return s;
}
function countryStat(data, codes){
      var stat = {}
      Object.keys(data).forEach(country => {
          let s = {confirmed: 0, deaths: 0, recovered: 0};
          data[country].forEach(dd => {
              if (s.confirmed < dd.confirmed){
                s = dd; 
                s.name = country;
                s.code = codes[country] === undefined ? country : codes[country];
                s.confirmed = dd.confirmed;
                s.deaths = dd.deaths;
                s.recovered = dd.recovered;
                s.active = dd.active;
                s.closed = dd.closed;
                s.somethingRate = dd.somethingRate;
                s.deathRate = dd.deathRate;
                s.recoveryRate = dd.recoveryRate;
                s.deathsEstimated = dd.deathsEstimated;
                s.confirmedDiff = dd.confirmedDiff;
                s.deathsDiff = dd.deathsDiff;
                s.recoveredDiff = dd.recoveredDiff;
                s.activeDiff = dd.activeDiff;
                s.closedDiff = dd.closedDiff;
                s.somethingRateDiff = dd.somethingRateDiff;
                s.deathRateDiff = dd.deathRateDiff;
                s.recoveryRateDiff = dd.recoveryRateDiff;
                s.deathsEstimatedDiff = dd.deathsEstimatedDiff;
              }
          });
          stat[country] = s;
      });
      return stat;
}
function convertData(data){
      var dates = {}
      Object.keys(data).forEach(country => {
          let prevD = undefined;
          data[country].forEach(dd => {
              let d = moment(dd.date, "YYYY-MM-DD").unix();
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
              }else{
                dd.confirmedDiff = 0;
                dd.confirmedDiffDiff = 0;
                dd.activeDiffDiff = 0;
                dd.recoveredDiff = 0;
                dd.deathsDiff = 0;
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
  return `<td align="right">${d.deaths.toLocaleString()}${getColoredDiff(d.deathsDiff, "diff-red", "diff-green")}</td>`;
}
function somethingRateFormatter(d) {
  return `<td align="right">${(100 * d.somethingRate).toFixed(1).toLocaleString()}${getColoredDiff((100*d.somethingRateDiff).toFixed(1), "diff-red", "diff-green")}</td>`;
}
function deathsEstimatedFormatter(d) {
  return `<td align="right">${d.deathsEstimated.toLocaleString()}${getColoredDiff(d.deathsEstimatedDiff.toFixed(0), "diff-red", "diff-green")}</td>`;
}
function displayData(){
    var dates = convertData(data);
    var stat = countryStat(data, names);
    let dds = Object.keys(dates);
    dds.sort((a,b) => {
      if (a > b)
        return -1;
      if (a < b)
        return 1;
      return 0;
    });
    dds.forEach(d => {
      dates[d]["Total"] = totalStat(dates[d]);
    });
    let d0 = dds[0];
    var threshold0 = dates[dds[0]]["Russia"].confirmed-1;
    var threshold1 = dates[dds[1]]["Russia"].confirmed-1;
    var threshold = threshold0;
    if (threshold1 < threshold)
      threshold = threshold1;

    document.getElementById("latestDate").innerHTML=moment.unix(d0).format("DD.MM.YYYY");
    stat["Total"] = dates[d0]["Total"];
    var countries = buildCountries(stat, threshold);

    outputBetterStatHtmlTable("latestStat", stat, countries);

    outputHistoryHtmlTable("confirmedHistory",       dates, stat, countries, confirmedFormatter);
    outputHistoryHtmlTable("recoveredHistory",       dates, stat, countries, recoveredFormatter);
    outputHistoryHtmlTable("deathHistory",           dates, stat, countries, deathFormatter);
    outputHistoryHtmlTable("activeHistory",          dates, stat, countries, activeFormatter);
    outputHistoryHtmlTable("deathRateHistory",       dates, stat, countries, deathRateFormatter);
    outputHistoryHtmlTable("somethingRateHistory",   dates, stat, countries, somethingRateFormatter);
    outputHistoryHtmlTable("deathsEstimatedHistory", dates, stat, countries, deathsEstimatedFormatter);
}
