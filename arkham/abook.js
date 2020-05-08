function comparator_name(a1,a2){
  const idx = 0;
  p1 = a1.split("---");
  p2 = a2.split("---");
  if (p1[idx] > p2[idx]){
    return 1;
  }else if (p1[idx] < p2[idx]){
    return -1;
  }else{
    return 0;
  }
}
function comparator_addr(a1,a2){
  const idx = 1;
  p1 = a1.split("---");
  p2 = a2.split("---");
  if (p1.length < 2){
    console.log(p1);
  }
  if (p2.length < 2){
    console.log(p2);
  }
  if (p1[idx][0] > p2[idx][0]){
    return 1;
  }else if (p1[idx][0] < p2[idx][0]){
    return -1;
  }else if(parseInt(p1[idx].substr(1)) > parseInt(p2[idx].substring(1))){
    return 1;
  }else if(parseInt(p1[idx].substr(1)) < parseInt(p2[idx].substring(1))){
    return -1;
  }else{
    return 0;
  }
}
function displayBook(data){
   const el = document.getElementById("aBookTable")
   if (el === null)
     return;

   html = ""
   const cols = 4;
   let idx = 0;

   data.sort(comparator_name);
   let rows = data.length / cols;
   if (rows * cols < data.length)
     rows = rows + 1;

   html += "<tr>";
   for(var j=0; j<cols; j++){
     html+="<th>Имя</th><th>Адр.</th>";
   }
   html += "</tr>";
   for(var i=0; i<rows; i++){
     html += "<tr>";
     for(var j = 0; j<cols; j++){
       html += "<td>";
       if (idx < data.length){
         var pair = data[idx].split("---");
//         console.log(pair);
         html += pair[0];
         html += "</td><td>";
         html += pair[1];
       }else{
         html += "&nbsp;";
       }
       html += "</td>";
       idx++;
     }
     html += "</tr>";
   }

  el.innerHTML = html;

}
function onLoad(){
  displayBook(window.data);
}
