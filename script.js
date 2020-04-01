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
        code: "Total",
        confirmed: 0,
        deaths: 0,
        recovered: 0,
        active: 0,
        inactive: 0,
    };
    Object.keys(data).forEach(country => {
        let d = data[country];
//        console.log(d);
        s.confirmed += d.confirmed;
        s.deaths += d.deaths;
        s.recovered += d.recovered;
        s.active += d.active;
        s.inactive += d.inactive;
        s.deathRate += d.deathRate;
        s.fatalityRate += d.fatalityRate;
        s.deathsEstimated += d.deathsEstimated;
    });
    s.deathRate = s.confirmed > 0 ? s.deaths / s.confirmed : 0;
    s.fatalityRate = s.inactive > 0 ? s.deaths / (s.recovered + s.deaths) : 0;
    s.deathsEstimated = s.active * s.fatalityRate;
    return s;
}
function diffStat(dCur, dPrev){
    let s = {};
    Object.keys(dCur).forEach(country => {
      d0 = dCur[country];
      d1 = dPrev[country];
      s[country] = {
        name: d0.name,
        code: d0.code,
        confirmed: d0.confirmed - d1.confirmed,
        deaths: d0.deaths - d1.deaths,
        recovered: d0.recovered - d1.recovered,
        active: d0.active - d1.active,
        inactive: d0.inactive - d1.inactive,
        deathRate: d0.deathRate - d1.deathRate,
        fatalityRate: d0.fatalityRate - d1.fatalityRate,
        deathsEstimated: d0.deathsEstimated - d1.deathsEstimated,
      };
    });
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
              }
          });
          stat[country] = s;
      });
      return stat;
}
function convertData(data){
      var dates = {}
      Object.keys(data).forEach(country => {
          data[country].forEach(date_data => {
              let d = moment(date_data.date, "YYYY-MM-DD").unix();
              let x = dates[d]
              if (typeof(x) === "undefined"){
                dates[d] = {}
              }
              let s = date_data
              s.date = d;
              s.active = s.confirmed - s.recovered - s.deaths;
              s.inactive = s.recovered + s.deaths;
              s.deathRate = s.confirmed > 0 ? s.deaths / s.confirmed : 0;
              s.fatalityRate = s.inactive > 0 ? s.deaths / (s.recovered + s.deaths) : 0;
              s.deathsEstimated = s.active * s.fatalityRate;
              dates[d][country] = s
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
      return`<span class="${cp}">+${v}</span>`;
    else if (v < 0)
      return`<span class="${cm}">${v}</span>`;
    else
      return "";
}
function outputBetterStatHtmlTable(elementId, stat, diff, countries){
    let html = "";
    countries.forEach(c => {
      let confirmedDiff = getColoredDiff(diff[c].confirmed, "diff-red", "diff-green");
      let recoveredDiff = getColoredDiff(diff[c].recovered, "diff-green", "diff-red");
      let deathsDiff = getColoredDiff(diff[c].deaths, "diff-red", "diff-green");
      let activeDiff = getColoredDiff(diff[c].active, "diff-red", "diff-green");
      let fatalityRateDiff = getColoredDiff((100 * diff[c].fatalityRate).toFixed(1), "diff-red", "diff-green");
      let deathRateDiff = getColoredDiff((100 * diff[c].deathRate).toFixed(1), "diff-red", "diff-green");
      let deathsEstimatedDiff = getColoredDiff(diff[c].deathsEstimated.toFixed(0), "diff-red", "diff-green");
      html += "<tr>";
      html += `<td>${stat[c].name}</td>`;
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
function outputFatalityHtmlTable(elementId, dates, stat, countries){
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
        html += `<th>${stat[c].name}</th>`;
    });
    html += "</tr>";
    dds.forEach(d => {
      html += "<tr>";
      let ddd = {date: d};
      html += `<td>${moment.unix(d).format("DD.MM.YYYY")}</td>`;
      countries.forEach(c => {
        let dd = dates[d][c];
        if (dd !== undefined){
        let active = dd.confirmed - dd.recovered - dd.deaths;
        let inactive = dd.recovered + dd.deaths;
        let deathRate = dd.confirmed > 0 ? Math.round(100 * dd.deaths / dd.confirmed) : 0;
        let fatalityRate = inactive > 0 ? Math.round(100 * dd.deaths / (dd.recovered + dd.deaths)) : 0;
        ddd[c] = fatalityRate;
        html += `<td>${fatalityRate}</td>`
        }else{
        html += "<td></td>"
        }
      });
//      console.log(ddd);
      html += "</tr>";
    });
    let table = document.getElementById(elementId);
    table.innerHTML = html;
}
