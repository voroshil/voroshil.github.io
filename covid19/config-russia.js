const europe = [
];
const names = {
  "Australia": "Австралия",
  "Austria": "Австрия",
  "Bangladesh":"Бангладеш",
  "Belarus": "Беларусь",
  "Belgium": "Бельгия",
  "Brazil": "Бразилия",
  "Canada": "Канада",
  "Chile": "Чили",
  "China": "Китай",
  "Colombia": "Колумбия",
  "Czechia" : "Чехия",
  "Denmark": "Дания",
  "Dominican Republic": "Доминикана",
  "Ecuador": "Эквадор",
  "Egypt": "Египет",
  "Finland": "Финляндия",
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
  "Panama": "Панама",
  "Philippines": "Филиппины",
  "Poland": "Польша",
  "Peru": "Перу",
  "Portugal": "Португалия",
  "Qatar": "Катар",
  "Romania": "Румыния",
  "Russia": "Россия",
  "Saudi Arabia": "Саудовская Аравия", 
  "Serbia": "Сербия",
  "Singapore": "Сингапур",
  "South Africa": "ЮАР",
  "Spain": "Испания",
  "Sweden": "Швеция",
  "Switzerland": "Швейцария",
  "Turkey": "Турция",
  "Ukraine": "Украина",
  "United Arab Emirates": "ОАЭ",
  "United Kingdom": "Великобритания",
  "US": "США",

  "Total": "В стране",
};
const colors = ["green", "blue", "black", "orange", "magenta",  "cyan", "brown",
"#808080","#808080","#808080","#808080","#808080","#808080","#808080","#808080","#808080","#808080"];

const totalCountries = {};

const configPrefix = "covid_config_russia";
const currentPrefix = "covidRussia";

const defaultConfig = {
    thresholdCountry: "Japan",
    maxThreshold: 4000,
    periodThreshold: 1000,
    showManualHorizontal: false,
    showHorizontal: true,
    dynamicThreshold: 500,
    recoveryShift: 14,
    activeAbsolute: false
};

function onLoad(){
  displayData();
//  setTimeout(loadData, 100)
}
