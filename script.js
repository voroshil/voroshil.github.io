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
        code: "Всего",
        confirmed: 0,
        deaths: 0,
        recovered: 0,
        active: 0,
        inactive: 0,
        confirmedDiff: 0,
        recoveredDiff: 0,
        deathsDiff: 0,
        activeDiff: 0,
        inactiveDiff: 0,
        deathsEstimated: 0,
        deathsEstimatedDiff: 0,
    };
    Object.keys(data).forEach(country => {
        let d = data[country];
        s.confirmed += d.confirmed;
        s.deaths += d.deaths;
        s.recovered += d.recovered;
        s.active += d.active;
        s.inactive += d.inactive;
        s.deathsEstimated += d.deathsEstimated;
        s.confirmedDiff += d.confirmedDiff;
        s.recoveredDiff += d.recoveredDiff;
        s.deathsDiff += d.deathsDiff;
        s.activeDiff += d.activeDiff;
        s.inactiveDiff += d.inactiveDiff;
        s.deathsEstimatedDiff += d.deathsEstimatedDiff;
    });
    s.deathRate = s.confirmed !== 0 ? s.deaths / s.confirmed : 0;
    s.fatalityRate = s.inactive !== 0 ? s.deaths / s.inactive : 0;

    s.confirmedPrev = s.confirmed - s.confirmedDiff;
    s.recoveredPrev = s.recovered - s.recoveredDiff;
    s.deathsPrev = s.deaths - s.deathsDiff;
    s.inactivePrev = s.inactive - s.inactiveDiff;

    s.deathRatePrev = s.confirmedPrev !== 0 ? s.deathsPrev / s.confirmedPrev : 0;
    s.fatalityRatePrev = s.inactivePrev !== 0 ? s.deathsPrev / s.inactivePrev : 0;

    s.deathsEstimated = s.active * s.fatalityRate;
    s.deathsEstimatedPrev = (s.active - s.activeDiff) * s.fatalityRatePrev;

    s.deathRateDiff = s.deathRate - s.deathRatePrev;
    s.fatalityRateDiff = s.fatalityRate - s.fatalityRatePrev;
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
                s.inactive = dd.inactive;
                s.deathRate = dd.deathRate;
                s.fatalityRate = dd.fatalityRate;
                s.deathsEstimated = dd.deathsEstimated;
                s.confirmedDiff = dd.confirmedDiff;
                s.deathsDiff = dd.deathsDiff;
                s.recoveredDiff = dd.recoveredDiff;
                s.activeDiff = dd.activeDiff;
                s.inactiveDiff = dd.inactiveDiff;
                s.deathRateDiff = dd.deathRateDiff;
                s.fatalityRateDiff = dd.fatalityRateDiff;
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
              dd.active = dd.confirmed - dd.recovered - dd.deaths;
              dd.inactive = dd.recovered + dd.deaths;
              dd.deathRate = dd.confirmed > 0 ? dd.deaths / dd.confirmed : 0;
              dd.fatalityRate = dd.inactive > 0 ? dd.deaths / dd.inactive : 0;
              dd.deathsEstimated = dd.active * dd.fatalityRate;
              if (prevD !== undefined){
                dd.confirmedDiff = dd.confirmed - prevD.confirmed;
                dd.recoveredDiff = dd.recovered - prevD.recovered;
                dd.deathsDiff = dd.deaths - prevD.deaths;
                dd.activeDiff = dd.active - prevD.active;
                dd.inactiveDiff = dd.inactive - prevD.inactive;
                dd.deathRateDiff = dd.deathRate - prevD.deathRate;
                dd.fatalityRateDiff = dd.fatalityRate - prevD.fatalityRate;
                dd.deathsEstimatedDiff = dd.deathsEstimated - prevD.deathsEstimated;
              }else{
                dd.confirmedDiff = 0;
                dd.recoveredDiff = 0;
                dd.deathsDiff = 0;
                dd.activeDiff = 0;
                dd.inactiveDiff = 0;
                dd.deathRateDiff = 0;
                dd.fatalityRateDiff = 0;
                dd.deathsEstimatedDiff = 0;
              }
              dates[d][country] = dd;

              prevD = dd;
          })
      });
      return dates;
}
function outputStatHtmlTable(elementId, stat, countries){
    let html = "";
    countries.forEach(c => {
      html += "<tr>";
      html += `<td>${stat[c].name}</td>`;
      html += `<td align="right" >${stat[c].confirmed}</td>`;
      html += `<td align="right">${stat[c].recovered}</td>`
      html += `<td align="right">${stat[c].deaths}</td>`
      html += `<td align="right">${stat[c].active}</td>`
      html += `<td align="right">${(100 * stat[c].fatalityRate).toFixed(1)}</td>`
      html += `<td align="right">${(100 * stat[c].deathRate).toFixed(1)}</td>`
      html += `<td align="right">${stat[c].deathsEstimated.toFixed(0)}</td>`
      html += "</tr>";
    });
    let table = document.getElementById(elementId);
    table.innerHTML = html;
}

function getColoredDiff(v, cp, cm){
    if (v > 0)
      return`<span class="${cp}">(+${v})</span>`;
    else if (v < 0)
      return`<span class="${cm}">(${v})</span>`;
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
      let fatalityRateDiff = getColoredDiff((100 * stat[c].fatalityRateDiff).toFixed(1), "diff-red", "diff-green");
      let deathRateDiff = getColoredDiff((100 * stat[c].deathRateDiff).toFixed(1), "diff-red", "diff-green");
      let deathsEstimatedDiff = "";
      if (stat[c].deathsEstimatedDiff !== undefined){
          deathsEstimatedDiff = getColoredDiff(stat[c].deathsEstimatedDiff.toFixed(0), "diff-red", "diff-green");
      }
      html += "<tr>";
      html += `<td>${stat[c].code}</td>`;
      html += `<td align="right" >${stat[c].confirmed}${confirmedDiff}</td>`;
      html += `<td align="right">${stat[c].recovered}${recoveredDiff}</td>`
      html += `<td align="right">${stat[c].deaths}${deathsDiff}</td>`
      html += `<td align="right">${stat[c].active}${activeDiff}</td>`
      html += `<td align="right">${(100 * stat[c].fatalityRate).toFixed(1)}${fatalityRateDiff}</td>`
      html += `<td align="right">${(100 * stat[c].deathRate).toFixed(1)}${deathRateDiff}</td>`
      html += `<td align="right">${stat[c].deathsEstimated.toFixed(0)}${deathsEstimatedDiff}</td>`
      html += "</tr>";
    });
    let table = document.getElementById(elementId);
    table.innerHTML = html;
}
function outputHistoryHtmlTable(elementId, dates, stat, countries, getValue, getDiff){
    let html = "";
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
        html += `<th>${stat[c].code}</th>`;
    });
    html += "</tr>";
    let prevD = undefined;
    dds.forEach(d => {
      html += "<tr>";
      html += `<td>${moment.unix(d).format("DD.MM.YYYY")}</td>`;
      countries.forEach(c => {
        let dd = dates[d][c];
        if (dd !== undefined){
          diff = getColoredDiff(getDiff(dd), "diff-red", "diff-green");
          html += `<td>${getValue(dd)}${diff}</td>`
        }else{
          html += "<td></td>"
        }
      });
//      console.log(ddd);
      html += "</tr>";
      prevDD = d;
    });
    let table = document.getElementById(elementId);
    table.innerHTML = html;
}
