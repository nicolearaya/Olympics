
d3.csv("data/athlete_events.csv").then(function(data) {
    loadVis(data);
});

function loadVis(data) {

    let cleanData = [];

    // Clean up data by removing rows that have NA
    data.forEach(athlete => {
        if (athlete.Height != "NA" && athlete.Weight != "NA") {
            if (athlete.Year == 2016 && athlete.Team == "United States") {
                athlete.Height = (+athlete.Height * 0.393701).toFixed(2)
                athlete.Weight = (+athlete.Weight * 2.20462).toFixed(2)
                athlete.Age = +athlete.Age
                athlete.Sex = athlete.Sex
                cleanData.push(athlete)
            }
        }
    })

    cleanData = _.uniqBy(cleanData, function(athlete) { return [athlete.Sport, athlete.ID].join(); });

    measureVis = new MeasureVis("measure-vis", cleanData);
    measureTable = new MeasureTable("measure-table", cleanData);
    physicalVis = new PhysicalVis("user-physical-trait-vis", cleanData);

    genderRatio = new GenderRatio("gender-ratio", cleanData);
    ageRange = new AgeRange("age-range", cleanData)

};


function physicalUpdate(){
    document.getElementById("btn-physical").disabled = true;
    physicalVis.wrangleData()
}

// load data using promises
incomePromises = [
    d3.json("https://d3js.org/us-10m.v1.json"), //https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"), // already projected -> you can just scale it to ft your browser window
    d3.csv("data/5Y2018_income.csv"),
];

Promise.all(incomePromises)
    .then( function(data){ initIncomeVis(data) })
    .catch( function (err){console.log(err)} );

function initIncomeVis(dataArray) {

    let incomeData = [];
    dataArray[1].forEach(row => {
        row.ESTIMATE = parseFloat(row.ESTIMATE.replace(/,/g, ''));
        incomeData.push(row)
        })

    incomeVis = new IncomeVis("household-income-map", dataArray[0], incomeData);
}
