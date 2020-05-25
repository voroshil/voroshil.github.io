const europe = [
"Spain",
"Italy",
"France",
"Germany",
"United Kingdom",
"Belgium",
"Switzerland",
"Netherlands",
"Portugal",
"Austria",
"Russia",
"Sweden",
"Ireland",
"Norway",
"Poland",
"Denmark",
"Romania",
"Czechia",
"Serbia",
"Luxembourg",
"Finland",
"Ukraine",
"Belarus",
"Greece",
"Iceland",
"Moldova",
"Croatia",
"Hungary",
"Estonia",
"Slovenia",
"Lithuania",
"Bosnia and Herzegovina",
"North Macedonia",
"Slovakia",
"Bulgaria",
"Latvia",
"Andorra",
"Albania",
"Malta",
"San Marino",
"Montenegro",
"Monaco",
"Liechtenstein",
];
const names = {
  "Algeria": "Алжир",
  "Argentina": "Аргентина",
  "Armenia": "Армения",
  "Australia": "Австралия",
  "Austria": "Австрия",
  "Afganistan": "Афганистан",
  "Bahrain": "Бахрейн",
  "Bangladesh":"Бангладеш",
  "Belarus": "Беларусь",
  "Belgium": "Бельгия",
  "Bolivia": "Боливия",
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
  "Ghana": "Гана",
  "Japan": "Япония",
  "India": "Индия",
  "Indonesia": "Индонезия",
  "Iran": "Иран",
  "Ireland": "Ирландия",
  "Israel": "Израиль",
  "Italy": "Италия",
  "Kazakhstan": "Казахстан",
  "Korea, South": "Ю.Корея",
  "Kuwait": "Кувейт",
  "Luxembourg": "Люксембург",
  "Malaysia": "Малайзия",
  "Mexico" :"Мексика",
  "Moldova": "Молдавия",
  "Morocco", "Марокко",
  "Netherlands": "Голландия",
  "Nigeria": "Нигерия",
  "Norway": "Норвегия",
  "Oman": "Оман",
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

  "Total": "В мире",
  "Europe": "В Европе",
};
const colors = ["green", "blue", "black", "orange", "magenta",  "cyan", "brown",
"#808080","#808080","#808080","#808080","#808080","#808080","#808080","#808080","#808080","#808080"];

const totalCountries = {"Europe": europe};

const configPrefix = "covid_config";
const currentPrefix = "covid";

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
  setTimeout(loadData, 100)
}
