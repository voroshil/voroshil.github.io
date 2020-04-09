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
          // preprocessing
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
  const tdClass = diffClass(d.deathsDiffDiff, "", "deaths-diff-diff-down");
  return `<td align="right" class="${tdClass}">${d.deaths.toLocaleString()}${getColoredDiff(d.deathsDiff, "diff-red", "diff-green")}</td>`;
}
function somethingRateFormatter(d) {
  return `<td align="right">${(100 * d.somethingRate).toFixed(1).toLocaleString()}${getColoredDiff((100*d.somethingRateDiff).toFixed(1), "diff-red", "diff-green")}</td>`;
}
function deathsEstimatedFormatter(d) {
  return `<td align="right">${d.deathsEstimated.toLocaleString()}${getColoredDiff(d.deathsEstimatedDiff.toFixed(0), "diff-red", "diff-green")}</td>`;
}
function outputGraph(id, d, accessor, width, height){
  const margin = {top: 20, right: 20, bottom: 100, left: 40};
  var data = []
  d.forEach(k => {
    data.push({d: new Date(1000 * k.date), v:accessor(k)})
  })
//  var data = Object.values(d).map( d => 0.01 * d)
//  var data0 = [5.1,4.9,8.6,6.2,5.1,7.1,6.7,6.1,5,5,5.2,7.9,11.1,5.9,5.5,5.6,6.5,7.7,5.7,6.7,5.7,4.8,5.6,9.5,5.7,4.7,6.3,5.7,6.6,5.5,5.4,9.3,7.6,6.3,5.6,5.9,5.5,5.2,6,6.4,4.9,5,10.3,7.2,4.9,6.9,6.1,5.1,6.5,8.6,5.6,5.2,10.9,6.7,6.4,5.7,5.3,5,4.2,7.3,6.4,5.1,5.5,7.2,8.3,13.9,7,1.9,2.2,5,14.1,5.6,3.2,8.1,4.9,5.9,7.3,3.6,6.9,4.4,4.8,21.7,9.2,7.4,13.6,6.9,16.5,5.7,9.4,3,3,8.7,5.4,5.4,5.8,16.4,11.8,6.5,6.4,7.6,7.3,7.7,6.6,4.9,7,8.5,5.4,5.9,13,5,24.4,3.2,6.3,4.1,2.7,3.3,5.9,5.1,2.8,6,4.5,5,5.7,4.4,5.7,5.9,3.1,3.7,4.4,3.9,5,5.1,5.7,3.7,3.9,3.9,4,3.2,4,3.7,3.6,3.4,5,5.3,5.9,5.9,4.8,6.2,4.5,4.5,4.9,5.1,4.4,3.2,3,3.8,4.3,7.1,4.5,4.6,3.7,3.6,5.6,4.4,5.5,3.8,4.1,4.7,4.7,3.7,3.5,4.6,5,3,3.7,4.3,3.5,4.8,5.2,4.8,5.6,6.4,2.6,4.8,5.3,4.4,4.6,7.3,5.7,6.6,5.7,10,4.7,7.3,5.1,8.7,7.9,5.1,26.4,4.9,9.7,8.9,6.3,6.1,5.3,8.2,3.5,5.4,5,9.2,6.6,5.2,5.6,4,4.8,4.3,4.7,7.1,6.9,5.7,6.2,6.2,5,3.5,7.7,4.5,3.2,4.8,4,5.7,6.8,6.6,7.1,5.7,4.1,7.9,7.9,7.4,5.9,10.6,6.1,5.7,5.5,8,3.6,4.3,3.2,3.1,1.8,3.1,2.9,3.1,2.4,2.7,3.3,4.9,4.8,3.6,3,4.7,3.2,4.1,2.8,2.5,2.6,3.9,5.1,3.3,2.6,2.3,2.1,2,6.2,2.3,3.1,2.1,1.8,2.6,2.9,2.9,5,2.5,3.3,5.3,1.7,3.6,4.5,3.9,3.5,4.6,3.2,2.7,2.3,2.7,3.5,4.9,5.1,5.1,2.6,5.9,2.4,2.4,2.2,2.1,3.7,2.1,3.5,2.2,5.2,6,4.8,4.8,6.1,5.4,4.8,5.8,5.1,4.5,3.7,6.5,4.4,4.7,4.6,4.2,5.2,4.6,5.9,5.3,6.8,4.4,5.3,4.8,6.1,5.3,5.1,5,5.4,4.1,6.3,5.1,6.9,4.3,4.4,7.2,11.5,6,6.9,4.5,5.6,6.6,5.4,5.3,3.8,4.7,4.7,4.7,5.2,5.4,5.3,4.6,5.9,5,5.6,3.1,4.6,3.9,5.8,4.3,5,5.1,5.1,4.3,5.8,6,3.6,6,4.6,4.5,4.2,6.7,5.1,5.5,4.6,5,4.1,4.1,5,6.9,4.6,5.2,8.3,7.2,4.8,4.6,5,8.1,6.1,5.7,7.6,6.6,4.8,4.8,5.6,7.5,5.2,6,5.7,4.7,5.9,4.8,5.8,5,8.6,6.1,4.1,5.4,9.6,6.4,6,4.4,5.6,5.3,4.8,5.2,4.9,5.5,5.9,5.1,4.5,6.5,5.2,7,5.5,6.8,5.3,6.7,4.5,4.7,6.2,7.4,4.8,5,4.7,5.9,4.1,5.5,5.2,5.4,6.3,5,5.3,5.4,5.9,4.6,5,4.4,8.9,5.6,4.7,5.3,5.8,5.4,5.3,7.3,4.1,4.7,6.3,7,7.1,6,4.6,6.4,5.3,6.4,4.8,5.7,5.7,5.6,5.2,5,7.2,5.5,7.6,4.7,6.9,6.8,5.5,6.3,4.9,7.1,4.8,6.6,6.6,5.8,4,4.5,4.5,6.4,4.8,5.3,5.1,5.7,5.6,6.8,7.7,5.4,8.6,6.5,5.5,6.4,6.9,7.5,6.5,5.9,5.8,7.4,6.6,6.6,5.4,7,7.7,6,6.3,5.6,7.3,6.3,7.3,5,6.4,8.2,4.5,6.2,5.3,4.7,5.4,7,6.3,6.6,8.6,8.5,4.4,5.7,6.8,6.7,6,5.8,4.1,3,3.4,3.4,3.5,4.9,3.6,3.4,4.6,3.7,2.8,4.9,4.3,3.2,4.1,3.7,2.6,4.4,3.2,2.9,3.3,5.9,4.1,4.2,2.9,3.2,4.3,3,4.8,3.1,2.8,4,3.2,4.8,6.9,3.6,2.9,3.1,3.1,3.1,3.7,4.1,4.2,5.9,2,3.4,4.2,5.3,4.7,9.5,4.7,5.8,3.2,5.8,5.7,4.8,4.8,5,5.8,5.5,6.4,4.1,6,5.7,5.6,5,5,5.6,4.6,4.4,6.1,5.2,4.5,6,5.3,8,6.9,7.6,5.3,5.9,6.1,6.9,8.1,5.8,5.4,4.9,5.5,6.2,6.5,5.5,4.4,8.3,5.1,6.1,4.7,5.6,4.8,6.2,7.6,4.8,5.2,5.1,6.8,4.6,5.1,6.6,5.5,6,6.2,5.9,7.1,7.4,3.9,5.3,3.9,6.3,4.6,4.5,5.3,6.6,6.9,4.8,4.4,6.8,8.6,5.2,4.8,5.8,6,6.2,8.1,4.6,4.9,4.3,5.6,6.7,5.6,6,7.1,7.1,6.5,5.2,3.8,8.4,6.2,5.8,5.4,6.2,6.4,4.9,3.8,4.3,3.6,4.3,5.7,3.6,3.8,4.4,4.7,4.4,5,4,5.6,3.6,4.7,3.6,4.2,5.5,3.3,4,5.9,4.4,5.9,4.2,4.8,3.8,5.1,6.6,3.4,4,4.4,3.6,4.7,4.8,4.2,4,5.1,4.7,5,4.8,3.8,4.5,4,3.7,6.6,6,5.6,4.9,4.7,3.9,4.1,4.8,5.1,4.1,4.2,5.3,4.2,4.9,5.2,5.4,5.1,4.9,4.6,5.3,4.3,4.6,4.5,4.5,4.5,4,5,4.9,4,4.2,5.2,3.8,6.1,5.3,4.3,3.8,4.2,4.4,6.5,5.7,4.5,5,4.4,4.6,4.9,3.6,3.9,4,3.4,2.9,4.9,5.7,3.7,4,5.8,3.4,4.2,4.6,4.4,4.5,4.7,3.1,3,3.8,4.4,4.1,4.6,3.4,4.1,4.2,6.1,5.2,3.2,5.3,3.5,3.7,5.9,3.5,4,4.2,5,3.9,3.8,4.1,4.3,3.7,3.6,4,3,4.2,3.7,4.4,3.6,3.2,2.8,3.2,4.5,4,4.6,3.2,4.4,5.1,3,8.1,4.3,4.5,3.8,2.3,3.7,4.3,3.4,4.9,4,3,4.6,5.4,4.2,4.4,3,3.1,6.4,3.9,2.9,3.4,4.1,3.8,4,3.7,3,5.4,3.2,2.4,2.9,4.2,3.9,4.4,4.9,7.4,3.8,3.5,4.6,4.7,4.1,3.6,4.2,3.5,4.5,6.9,4.6,7.4,4.4,5,5.7,4.2,4.6,4.6,5.9,5.2,3.3,3,4.8,5.1,8.2,3.2,5.1,5.4,4.7,4.7,4.7,4.1,3.3,6.8,3.4,4.3,3.5,3.6,4.8,6.4,3,5,3.9,2.6,2.7,5.7,3.2,4,6.3,2.8,2.7,4,4.1,4.5,3.7,3.7,4.8,3.5,6.2,3.9,4.5,4,7,3.2,4.3,3.9,5.9,3.6,2.9,4.3,3.1,6.9,4.3,4.6,3,8.1,4.1,2.9,4.6,4.1,4.5,3.6,3.6,4.1,5,2.6,5.2,3.2,4.8,3.7,5.5,4.7,4.6,4,2.7,5.2,4.9,4.5,2.9,3.8,3.7,5,3.3,4.7,4.9,3.2,4.2,3.8,3.3,3.9,2.6,6.9,6.9,6.1,6.1,3.9,3.6,9,4.3,6.5,8.3,3.5,4.6,8.3,4.5,5.4,8.3,5.7,3.8,4.8,5,4.1,3.5,6.8,5,10.6,4.4,6,4.5,9.7,6.4,5.2,4.6,4,5.4,11.7,5.2,3.3,5.5,10.4,3.6,6.6,4.4,4.3,4.2,6.4,6.2,4,8.8,4.7,4.1,11.6,4.4,4.4,4.5,3.9,5.1,5.5,6.9,4.2,3.6,9.2,3.8,10.5,7.5,3.9,5.8,10.6,8.3,13.2,11.8,8.4,5.6,6.7,4.2,5.6,5.7,7.3,4.5,3.8,16.3,4.3,5.5,9,6,4.7,7.1,4.4,3.8,3.6,6,6.8,6.7,4.3,4.9,6.3,3.1,3.8,8.7,4.3,10.4,10.3,6.9,5,6.1,5.3,5.3,7.6,3.6,3.3,4.2,3.5,4.8,3.9,5,5.4,6.4,3.5,4,6.8,5.5,6.4,9.5,3,7.9,7.5,5.3,9,7.8,6.7,8,5.9,7.4,5.5,8.4,4.8,9.6,7.5,9.2,8,5.7,11.8,6.2,8.5,9.6,7.8,9.7,7.4,6.3,5.9,6.7,6.7,6.7,6.7,7.5,5.3,9.4,10.4,8.1,6.7,6.7,5.9,7.2,6.9,6.8,7.7,7.3,6.9,6,8.5,8.1,7.5,8.9,8.3,10.1,5.7,7.5,10.5,7.3,6.9,7.9,8.1,7.9,9.4,6.1,12,5.5,8.5,3.2,4.8,2.6,4,3.2,3.2,2.7,2.9,4.2,4,4.8,2.6,4.9,3.6,4.6,2.9,6.4,4,4.7,4.1,4.8,3.8,5.3,4.7,6.2,3.9,5.2,4.3,3.4,4.7,3.4,4.6,3.8,4.5,6.5,4,5.2,5.5,5.8,6.9,3.4,3.9,4.7,2.7,3.9,3.3,5.3,3.6,3.2,1.8,3.4,4,3.7,4.1,5.8,6.1,3.3,5,5,6.3,6.8,3.5,4.7,4.6,4.4,4.4,4.4,4.2,3.7,4,6,6,3.4,6.2,5.5,4.5,3.6,4.1,5,5.8,5.5,3.4,4.5,4.9,5.2,4.3,4,3.6,5.8,4.7,4.2,4.6,3.7,5.4,3.2,6.4,6,6.4,3.5,4.4,4.6,4.4,3.1,5.9,4.9,4.9,4.2,4.9,5.1,4.1,4.8,4.3,4.5,7.6,4.8,4.2,4.7,5,6.3,6.6,4.9,5.6,4.9,3,6.6,6.8,4.6,6.5,3.7,5.2,7,4.6,5.3,4.6,3.5,7.3,5.1,5.1,3.8,3.8,4.8,3.7,4,3.3,3.9,4.9,3.4,5.6,4,3.9,3.2,7.6,3.1,7.9,4.3,3.5,3.6,3,3.9,3.7,3.7,3.7,4.1,3.5,3.4,5.5,4.2,7.7,4,5.1,3.5,4.2,7.7,3.9,4.3,4.5,3.7,3.2,3.4,4.1,5.2,5.6,3.9,4,4.8,4.5,3,3.3,2.9,3.6,4.6,3,3.6,4.3,4.8,3,4.4,2.8,3.8,6.3,4,5.2,3.6,2.2,4.3,5.7,3.2,3.6,3.7,3.5,3.8,2.7,4.8,3.9,3,3.2,5.1,4,3.4,5.1,3.4,3.7,3.5,3.7,8.2,5,7.1,6.5,6.5,7.4,5.2,7.3,6.3,5.3,12.3,6.4,7.8,8.1,6.4,5.6,4.1,5.8,6.8,7.7,8,4.9,5.9,5.3,5.2,10.9,11.2,9.9,4.8,6.4,7.8,15.4,9.3,5.9,8.2,4.9,4.5,5.8,7.4,5.6,4.8,9,5.8,5.9,4.2,6.8,5.7,6.3,6.3,5.4,5.9,8,5.6,6.7,5.9,7,6.7,4.5,5.3,8.3,3.8,4.5,8,5.5,5.1,6.8,8.4,5.7,5.4,5.2,5.1,6.1,4.2,7.9,6.4,9.2,7.6,6.1,10.1,7.4,6,7,6.7,4.5,5.9,5.1,5.3,6,6,7.3,6.2,4.1,4.9,6.9,5.6,5.2,5.5,5.3,5.9,7.8,5,6.4,5.1,4.5,8.7,4.5,5,4.6,5.7,5.9,5.6,6.5,4.6,5.1,6.6,7.3,9.1,4.9,5,4.7,4.6,5.6,4.7,5.9,6.6,4,5.4,7.2,8.4,6,5.2,4.9,6.1,4.1,6.2,4.9,5.4,4.9,4.8,9,4.5,4.9,6,6.9,6.8,5,5,5.4,7.7,4.9,5.5,5.1,6.4,9.9,5.5,6,7,4.2,8.8,9.9,4.3,6.1,5.6,5.4,4.4,6.4,6.8,5.1,4.4,6.6,5.5,8.1,8.4,4.1,7.3,5.8,6.7,5.1,5.8,7.6,4.6,6.9,8,4.8,7.1,6,7.4,6.1,7.6,5.8,4.6,7.2,6.1,5.9,3.6,7.3,6.6,2.9,7.7,4.4,4.3,3.5,2.4,3.8,3.6,3.7,2.3,4,4.2,3.1,3.3,4.8,2.3,2.4,9,3.2,5.5,4.9,4.5,2.7,4.8,3.3,3.1,7.9,2.1,3.1,4.2,7.1,3.5,4.3,3.3,3.1,4.6,4.7,2.5,4.5,3,4.5,4.9,6.2,6.8,7,3.2,4.3,3.9,2.9,3.5,3.3,4.1,3,4.9,4.6,3.7,3.3,2.5,5.4,4.2,4.1,2.8,3.6,2.8,3.5,2.8,3.6,3.2,3.5,2.8,2.5,2.5,3.3,3,3.2,3.2,2.6,4.5,3.4,3,3.4,3.4,3.3,3.5,2.5,2.8,3.3,2.8,3.3,3.5,3.2,2.7,2.7,2.6,3.7,3.4,2.9,2.9,2.8,4.1,3.1,2.7,2.9,2.7,3.1,2.4,3,2.3,4.3,2.8,3,3.2,3,3.7,2.5,3,3.7,3.5,2.9,4.3,3,3.6,2.4,2.5,2.8,2.5,3.5,2.7,3.2,3.3,2.6,3.1,3.1,3.2,3.8,3.1,3.4,3.3,2.6,2.7,2.8,3.2,4.6,2.9,3.2,3.4,3.7,2.7,2.9,5.8,6,5.3,4.4,4.7,5.1,5.5,5.9,5.3,7.3,8.6,7.5,6,5.8,4.9,4.6,6,2.6,2.8,2.9,3.5,2.4,3.2,2.6,3.1,2.7,2.5,7.1,4.7,5,6,5.7,7.9,6.6,5.6,5.2,4.1,4.9,4.9,4.8,4.2,5.4,6.8,6.8,4.4,5,5.6,5.1,6.2,6.9,6.9,9.1,5.6,5.4,5,7.1,7.2,6.6,6.4,7.3,5.4,9.8,6,4.5,10,9.8,8,6.4,7,7.3,6.1,7.1,9.4,8.1,5.5,7.8,8,8.3,9.3,4.5,7.6,4,4.9,7.8,5,5.2,4.4,5.1,5.2,4.4,5.1,3.3,4.6,4.9,4,4.6,4.1,4.8,5.2,3.8,4.5,2.9,4.4,5.1,5.9,5.4,4.2,4.6,4.6,5.2,3.8,4.9,5.2,4.3,4.2,3.7,4.2,5.2,5.7,4.3,3.9,5,4.1,5.9,4.1,5.8,3.5,4.2,4.7,4.6,3.8,5,4.3,4.1,4.5,3.7,4.3,4.1,3.8,4.5,4.2,4.1,3.7,4.8,4.5,5.1,5.9,4.5,4.8,5.6,6.4,6.7,5.7,3.9,5.1,4.6,5.3,5.3,4.7,5.5,4.9,4.3,5.4,6.5,5.1,5.6,6.1,5.1,6.3,4.6,4.2,4.9,4.6,5.4,4.5,8.5,4.9,5.1,5.3,5.2,7.1,4.4,5,5.3,7.8,5.8,4.4,4.3,6.5,6.5,6.4,4.7,5.1,4.5,5.1,5.7,5.4,4.6,4.6,5.1,4.9,6.8,4.7,6,5.2,5,6.8,4.7,7.3,5.4,4.5,5.1,6.2,5.2,6.3,5.4,5.7,4.9,4.8,6.9,7.3,5.5,5.5,6.6,5.6,8.9,4.7,4.9,4.8,4.9,4.8,6.2,4.4,7.3,4.2,7,6.9,4.7,5.6,4.7,8.1,4.4,5.1,2.3,3.2,3.1,2.5,3.2,1.8,3.8,2.3,2,1.9,1.8,2,2.2,2.8,3.1,2.5,2.4,2.3,2.1,2.3,2.9,2.6,2,2.9,4.1,2.4,3.1,3.1,4.5,2.9,2.9,2.9,5.3,4.5,3,2.5,1.9,3.5,2.7,14.2,1.6,3.7,5.3,2.3,3.3,1.7,2.1,2,2.7,3.6,3.5,2.7,3.7,6.8,4.6,4.3,5.3,6,3.5,6.3,5,4.2,6,4.1,4.7,4.1,5.4,6,6.2,5.5,5.5,3.7,4.3,3.4,4.6,3.9,3.9,3.9,4,6.4,4.4,4.2,5.8,4.2,3.5,4.9,6.4,4.2,5.5,4.5,3.3,5,7,7.4,4.1,4.8,6.1,4.1,3.9,5.9,4.9,3.5,5.8,4.7,4.3,7.6,3,4,9.1,4.6,6.8,4.4,5.3,7.3,4.6,4.2,5.5,4.2,6.8,4.5,4.3,3.2,4.9,4.8,4.1,7,4.4,3.7,4.9,4.7,6,5,3.5,3.7,5.9,3.9,6.4,3.6,4.1,4,3.4,5.8,3.6,7.1,3.2,7.7,3.7,4.3,5.6,4.3,5.4,5.6,8.3,2.7,4,7.5,4.8,5.2,4.9,6.3,4.9,5.2,4.1,3.7,4.5,5.7,5.2,3.1,7.9,3.6,4.3,8.8,7.5,4.9,8,6.5,6.7,3.6,5.6,9.7,7.4,5.5,4.3,3.3,4.3,7.7,9.5,4.3,5.1,5.5,4.3,6,4,6.5,6.1,4.5,7.4,6.1,5.3,7.1,3.9,6.5,4.2,5,7.7,5.4,5.6,7.3,6.5,10.4,3.5,4.5,5.2,5.2,5,7.2,3.3,6.4,6.7,5,5.2,5.1,7.1,7.3,6.9,7,5.1,7.3,7.1,6.1,5.9,4,6.8,6.6,7.4,7.2,5.7,6.2,5.9,6.7,6.1,5.9,5.8,5,6,4.3,5.2,5.9,6.3,5,5.9,5,4.9,5.4,4.5,5.9,8,6.8,5.8,5.6,5.7,6.5,5.2,5.7,7.7,8.2,6.7,4.8,4.6,7.2,7.5,7.3,6.2,6.7,4.7,5.3,5.6,6.7,7.1,8.5,8.5,5.7,6.3,8.1,7.1,8.3,7.3,5.8,6.4,4.8,7,5.1,6.3,6.9,7,7.2,6.8,6,6.9,4.7,4.9,5.9,6.6,5.1,7.7,6.8,7.8,6.7,5.1,7.5,7,5.4,7.4,5.4,8,5.9,6.6,5.6,6.6,6.2,5.2,5,5.3,4.8,6.3,5,6.1,5.6,9.1,5.2,11.4,8,5.1,5,7.4,4.5,6.6,8.4,5.7,7.1,5.8,6.8,7.1,4.9,6.1,7.7,5.8,6.6,4.7,5.8,6.2,5.4,4.7,5.8,6,5.6,8.2,4.5,5.8,8.6,9.1,4.8,5.5,11.3,5.6,5.4,4.8,5.3,6.5,6.5,7.9,5.2,1.9,2.3,4,2.4,2.5,2.4,2.5,9.8,2.9,2.5,3,2.9,2.7,2.6,5.5,3.1,1.9,3.6,3.2,14.1,2.2,2.1,3.8,2.5,2.5,2.6,2.1,2.4,1.9,3.2,2.1,2,2,2.8,2.8,2.4,2.4,2.1,3,2.9,1.8,5,2.1,3.6,2.8,2.7,3.8,2.4,2.2,3.6,13.2,2.6,2.8,2.3,3.3,2.5,2.6,2,1.9,6.8,1.9,2.4,2.9,4.3,2.3,5.6,5.1,5.3,7.4,6.6,4.5,4.7,6.7,4.9,7.1,5.9,4,5.7,6.4,6.4,6,4.9,5.2,5.9,3.8,7.3,5.8,4.4,6.1,5.3,6,5.7,6.2,4.3,5.4,5.8,6.6,5.3,5,8,6.2,6.2,5.5,6.5,7,6,4.6,7.7,6.2,7.3,5.4,4.9,4.3,7.3,7.8,5.9,5.8,4.4,4.8,5.8,7.4,4.5,5.3,6.7,4.8,4.2,7.2,5.5,5.5,4.2,6.6,7.5,5.6,6.2,5.7,5.8,5.2,7.5,5.8,4.4,4,7.4,6.1,4.2,5.8,4.6,6.8,5.5,4.1,5.9,4.9,6.9,5.9,5.8,4.8,5.1,6.2,7.3,5.4,3.7,4,4.8,4.9,6.6,5.9,4.5,3.5,5.7,5.9,4.6,4.3,4.1,3.5,8.5,4.8,4.1,3.3,3.4,4.7,5.4,5.7,3.9,4.3,4.8,12.5,4.8,5.2,3.8,4.5,5.5,4.6,7.6,7.8,3.5,8.2,3.5,6.8,5.5,3.5,4.5,6,3.9,6.4,3.8,3.6,5.3,4.2,4.6,3.2,4.2,4.9,5,9.1,6.7,5.1,4.1,2.5,4.2,6,3.5,4.3,3.7,6,5.7,7.4,5.3,12.1,5.7,6.8,5.2,4.1,5.4,4.7,4.6,4.1,4.1,4.7,5.5,4.6,5.7,5.5,7.2,5.4,3.7,5.9,3.8,3.1,4.3,5.7,4.6,7.3,4,6.8,7.6,4,6.4,8.2,5.3,3.2,4.2,6.8,5.8,6.7,2.1,5.1,3.7,3.8,5.3,8.4,4.8,5.1,5,4.5,5,6.1,7,4.5,6.7,3.3,5.2,5.3,8.8,2.9,7.6,9.9,11.3,4.7,6.2,5.3,4,3.6,5.4,2.9,3.9,3.9,3.6,6.6,7.9,5.3,5.4,7.1,4.6,5.7,4.7,4.2,7.3,8.5,6.2,5.1,5.5,4.3,4.4,3.7,4.5,5.1,4.4,2.2,4.8,7.7,4.8,3.7,7.6,11.4,4.8,5,4.6,5.6,4.6,7.3,5.1,5.5,3.2,13.1,3.9,5.5,4.6,7.9,5.1,5.9,5.4,3.4,7.5,5.9,7.5,4.3,2.8,5.9,7.1,3.6,11.9,4.5,3.2,7.7,5.3,6.6,6.1,7.4,4.9,5.5,3.9,4.8,6.4,9.8,9.6,6.9,7.8,3.9,5.9,6.3,4,6.5,3.4,5.1,5.1,14.1,5.9,3.8,4.9,8.5,4.7,4.2,4,4.1,5.5,4,7.2,4.7,3.4,6.7,8.2,7.3,5,5.6,6.7,4.6,5.7,6.2,6.4,5.8,5.6,5.2,5.4,4.4,4.6,5.4,13.3,3.6,4.2,8.5,5.1,5.8,5,4.8,11.2,17.3,6.1,3.3,3,6.1,3.4,3.1,8.6,5.9,5.3,3.5,4.6,3.4,2.8,3.2,2.8,4.8,2.2,3.2,7.3,4,4.2,2.9,3.9,9.8,3.1,3,3.5,5.3,3.7,3.1,4,4.2,2.7,5.2,3.2,3.7,3.7,2.9,4.5,4,3.1,3.3,3.1,4.3,3.6,4.9,4.3,4.6,4.7,2.6,3.6,3.6,4.1,6.4,3.5,5.9,10.9,5.1,4.5,4.3,5.9,4.4,5.2,3.8,3.3,4.4,3.8,4.6,10,4.8,4.7,3.2,3.4,4.4,3.4,4.3,3.4,6.9,3.6,3.6,5.2,3.2,5.1,6.2,3.5,3.9,5.4,3,4.4,3.8,4.2,4.1,3.7,4.4,6.9,3.2,3.7,4.6,3.1,3.8,5.6,3.7,4.5,3.5,3.3,5,4.4,4,3.9,4.5,4.5,4.9,3.6,5.6,4.9,3.6,10,3.5,3.3,3.6,4.3,3.6,6.5,4.6,3.6,5.6,3.8,4.1,4,5.6,5.9,8.1,3.9,4.6,4.2,8.7,7,4,2.9,5.2,5.1,3.5,4.4,4.5,5.8,6.6,6.4,3.1,2.7,5.9,4.7,5.1,5.7,5.2,6.5,7.4,5.5,3.5,3.5,6.8,5.1,5.4,7.2,7.4,3.6,6.2,6.7,4.7,4.4,4,3.9,4.7,4,4.1,5.9,3.9,4.8,4.7,6.5,5.1,7.6,6.6,5.9,7.6,6.6,9.8,6.5,5.3,6.6,8.7,6,7.2,3.9,5.9,5.8,6.5,8.1,4.1,8.3,6.1,7.7,8.9,6.5,3.9,6.7,6.7,4.3,6.3,7.9,5.9,8.4,5.6,6.3,5.5,7.3,5.8,4,8.5,6.9,6.5,4.8,8.5,9.1,4.9,6.8,6.8,6.1,4.5,4.1,6.5,5.3,5.4,5.9,3.4,5.2,7.1,7.4,10,13.1,6,7,7,6.7,6,11.7,4.5,4.5,4.5,8.5,5.3,3.5,7.5,5.1,5.2,4.6,6.3,5.3,5.9,8.5,5.5,5.2,4.8,8.1,7,6.3,8.2,8.1,8.1,5.7,9.4,5.6,5.1,3.9,5.8,3.6,4.2,4.9,3.4,3.6,3.2,3.3,4.3,2.8,3.7,3.4,5.2,3.8,3.4,5.5,3.6,6.2,3.7,3.1,3.9,3,7,3.7,3.9,4,4.8,3.1,3.7,2.9,5.4,4.3,4.3,3.4,5.2,4.7,8.6,5.5,3.5,3.9,4.3,3.5,3.4,3.2,3.8,3.8,3.5,3.8,5.3,3.4,4.3,4.5,3.5,3.1,5.6,3.9,3.3,3.5,3.4,3.1,4.5,4,4.6,3.4,3.6,3.7,4.6,3.7,4.7,3.3,4.4,6.8,4.1,6,4,6.6,3.3,4.3,4.4,4,3.8,6.8,3.3,3.7,4.6,4,5.4,5.7,2,5.3,4.5,4.9,15.7,14.5,14.9,14.5,15.1,13,13.7,18.7,15,14.1,9.2,12.9,10.7,12.8,12.4,8.8,9.9,11.2,13.4,16.9,10.6,19.5,13.7,12.6,3.8,8.5,13.8,15.4,17.9,17.3,18.1,6.3,9.2,14.1,12.7,14.2,14.3,12.5,15.8,13.4,18.8,17.8,13.7,14.7,12.7,15,12.2,13.7,17.7,14.5,15.6,14.3,12.8,13.6,15.4,20.6,16.9,13.8,16.1,13.3,11.5,16.5,23.4,15.4,8.2,13.2,18.1,20.6,8.9,9.1,7.6,15.3,12,14.3,11.3,19.6,16.6,18];
//  var data = Object.assign(data0, {x:"Days",y:"Daily increase"})
  x = d3.scaleTime()
        .domain(d3.extent(data.map(d => d.d))).nice()
        .range([margin.left, width - margin.right]);
//  var bins = d3.histogram()
//        .domain(x.domain())
//        .thresholds(x.ticks(40))(data);
//  console.log(bins);
  y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.v)]).nice()
        .range([height - margin.bottom, margin.top]);
  xAxis = g => g
      .attr("transform", `translate (0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .selectAll("text")
      .attr("x", 10)
      .attr("y", 0)
      .attr("dy", ".35em")
      .attr("transform", "rotate(90)")
      .attr("text-anchor", "start");

  yAxis = g => g
      .attr("transform", `translate (${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(null, ""))
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
      .attr("fill", "orange")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => x(d.d)+1)
      .attr("width", d => width / data.length-2)
      .attr("y", d => y(d.v))
      .attr("height", d => y(0)-y(d.v));
    svg.append("g")
      .call(xAxis);
    svg.append("g")
      .call(yAxis);

//    node = svg.node();
//    console.log(node)

//    parent = document.getElementById(id)
//    console.log(parent)
//    parent.appendChild(node)
//    console.log(parent)

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
    var threshold0 = dates[dds[0]]["Japan"].confirmed-1;
    var threshold1 = dates[dds[1]]["Japan"].confirmed-1;
    var threshold = threshold0;
    if (threshold1 < threshold)
      threshold = threshold1;
    if (threshold > 3000)
      threshold = 3000;

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

    tbody = document.getElementById("graphTableBody")
    var cnt = 0
    const cols = 3
    var htmlRows = ""
    countries.forEach(c => {
      if (data[c] !== undefined){
        if (cnt === 0){
          htmlRows += "<tr>";
        }
        htmlRows += `<td><h4>${c}</h4><div id="graph${c}"></div></td>`

        cnt = cnt + 1
        if (cnt === cols){
          htmlRows += "</tr>";
          cnt = 0
        }
      }
    })
    if(cnt < cols){
          htmlRows += "</tr>";
    }
    tbody.innerHTML = htmlRows;
    const width = 300
    const height = 250
    countries.forEach(c => {
      if (data[c] !== undefined){
        outputGraph("graph"+c, data[c], d => d.confirmedDiff, width, height)
      }
    })
}
