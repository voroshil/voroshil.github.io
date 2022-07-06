function dateStrToUnixTime(param){
  var cols = param.split(".");
  cols[0] = parseInt(cols[0]);
  cols[1] = parseInt(cols[1]);
  cols[2] = parseInt(cols[2]);
  return new Date(cols[2], cols[1]-1, cols[0]) - 0;
}

function computeTarifs(tarif){
  var tarifMap = {}
  for (key in tarif){
    var tarif_history = tarif[key];
    var startPeriod = undefined
    var endPeriod = 0
    tarifMap[key] = [];

    var max = tarif_history.length;
    for (i in tarif_history){
      var startPeriod = dateStrToUnixTime(tarif_history[i].date);
      var endPeriod = new Date() - 0;
      if (i-0+1 < max){
        endPeriod = dateStrToUnixTime(tarif_history[i-0+1].date);
      }
      var value = tarif_history[i].value;
      var valueC = tarif_history[i].valueC;
      var valueT = tarif_history[i].valueT;
      if (valueC !== undefined && valueT != undefined){
        value = Math.round(100 * (HOT_MAGIC * valueT + valueC))/100;
      }
      if (startPeriod !== undefined && endPeriod !== undefined){
        tarifMap[key].push({startPeriod: startPeriod, endPeriod: endPeriod, value: value});
      }
    }
  }
  return tarifMap;
}

function findTarif(tarifMap, key, dt){
  var hist = tarifMap[key];
  if (hist === undefined){
    return undefined;
  }
  for(i in hist){
    if (hist[i].startPeriod <= dt && dt <= hist[i].endPeriod){
      return hist[i].value;
    }
  }
  return undefined;
}
function renderPaymentOEK(tarifMap, current, prev){
  const currentDate = dateStrToUnixTime(current.date);
  const electroTarifOEK = findTarif(tarifMap, "electro", currentDate);
  const hotTarifOEK = findTarif(tarifMap, "hotOEK", currentDate);
  const musorTarifOEK = findTarif(tarifMap, "musor", currentDate);

  const payment1 = Math.round(100 * (current.electro-prev.electro) * electroTarifOEK);
  const prevHot = current.hot >= prev.hot ? prev.hot : 0;
  const payment2 = Math.round(100 * (current.hot-prevHot) * hotTarifOEK);
  const payment3 = Math.round(100 * (peoples * musorTarifOEK));
  const payment = payment1+payment2+(isNaN(payment3) ? 0 : payment3);
  const result = 
    `<b>${current.electro}</b>-${prev.electro}=${current.electro-prev.electro} * ${electroTarifOEK} = <b>${(payment1/100).toFixed(2)}</b>`+"<br/>"+
    `<b>${current.hot}</b>-${prevHot}=${current.hot-prevHot} * ${hotTarifOEK} = <b>${(payment2/100).toFixed(2)}</b>`+"<br/>"+
    (!isNaN(payment3) ? `${musorTarifOEK}*${peoples}=<b>${(payment3/100).toFixed(2)}</b>` + "<br/>" : "" ) +
    `<b>${(payment/100).toFixed(2)}</b>`

  return result;
}
function renderPaymentVodokanal(tarifMap, current, prev){
  const currentDate = dateStrToUnixTime(current.date);
  const coldTarifVodokanal = findTarif(tarifMap, "coldVodokanal", currentDate);
  const hotTarifVodokanal = findTarif(tarifMap, "hotVodokanal", currentDate);

  const prevHot = current.hot >= prev.hot ? prev.hot : 0;
  const prevCold = current.cold >= prev.cold ? prev.cold : 0;
  const paymentCold = Math.round(100 * ((current.cold-prevCold) * coldTarifVodokanal))
  const paymentHot = Math.round(100 * (current.cold-prevCold+current.hot-prevHot)*hotTarifVodokanal)
  const result = 
    `<b>${current.cold}</b>-${prevCold} = ${current.cold-prevCold} * ${coldTarifVodokanal} = ${(paymentCold/100).toFixed(2)}`+"<br/>"+
    `<b>${current.hot}</b>-${prevHot} = ${current.hot-prevHot}`+"</br>"+ 
    `${current.cold-prevCold}+${current.hot-prevHot} = ${current.cold-prevCold+current.hot-prevHot} * ${hotTarifVodokanal} = ${(paymentHot/100).toFixed(2)}</b>`+"<br/>"+
    `${(paymentCold/100).toFixed(2)}+${(paymentHot/100).toFixed(2)} = <b>${((paymentCold+paymentHot)/100).toFixed(2)}</b>`+"";

  return result;
}
function renderPaymentGaz(tarifMap, current, prev){
  const currentDate = dateStrToUnixTime(current.date);
  const gazTarifGaz = findTarif(tarifMap, "gaz", currentDate);

  const result = 
    `<b>${current.gaz}</b>-${prev.gaz}=${current.gaz-prev.gaz} * ${gazTarifGaz} = <b>${((current.gaz-prev.gaz) * gazTarifGaz).toFixed(2)}</b>`;

  return result;
}
function onLoad(){
  tarifMap = computeTarifs(tarif);

  val = findTarif(tarifMap, "hotOEK", new Date(2021, 0, 1)-0)

  el = document.getElementById("payments");
  if (el === null)
    return;

  var html = ""
  for(var i=0; i<data.length; i++){
    if (i < data.length-1){
      paymentOEK = renderPaymentOEK(tarifMap, data[i], data[i+1])
      paymentVodokanal = renderPaymentVodokanal(tarifMap, data[i], data[i+1])
      paymentGaz = renderPaymentGaz(tarifMap, data[i], data[i+1])
    }else{
      paymentOEK="";
      paymentVodokanal="";
      paymentGaz="";
    }
    html += "<tr>";
    html += "<td>"+data[i].date+"</td>";
    html += "<td>"+data[i].gaz+"</td>";
    html += "<td>"+data[i].electro+"</td>";
    html += "<td>"+data[i].cold+"</td>";
    html += "<td>"+data[i].hot+"</td>";
    html += "<td align=\"right\">"+paymentOEK+"</td>";
    html += "<td align=\"right\">"+paymentVodokanal+"</td>";
    html += "<td align=\"right\">"+paymentGaz+"</td>";
    html += "</tr>";
  }

  el.innerHTML = html;
}