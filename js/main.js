
d3.csv("data/athlete_events.csv").then(function(data) {
    loadVis(data);
});

function loadVis(data) {

    let cleanData = [];

    // Clean up data by removing rows that have NA
    data.forEach(athlete => {
        if (athlete.Height != "NA" && athlete.Weight != "NA") {
            if (athlete.Year == 2016 && athlete.Team == "United States") {
                athlete.Height = +athlete.Height * 0.393701
                athlete.Weight = +athlete.Weight * 2.20462
                athlete.Age = +athlete.Age
                athlete.Sex = athlete.Sex
                cleanData.push(athlete)
            }
        }
    })

    measureVis = new MeasureVis("measure-vis", cleanData);
    measureTable = new MeasureTable("measure-table", cleanData);
    physicalVis = new PhysicalVis("user-physical-trait-vis", cleanData);

};


function physicalUpdate(){
    document.getElementById("btn-physical").disabled = true;
    physicalVis.wrangleData()
}

// load data using promises
let promises = [
    d3.json("https://d3js.org/us-10m.v1.json"), //https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"), // already projected -> you can just scale it to ft your browser window
    d3.csv("data/5Y2018_income.csv"),
];

Promise.all(promises)
    .then( function(data){ initIncomeVis(data) })
    .catch( function (err){console.log(err)} );

function initIncomeVis(dataArray) {
    // log data
    console.log('check out the data', dataArray);
    let incomeData = [];
    dataArray[1].forEach(row => {
        row.ESTIMATE = parseFloat(row.ESTIMATE.replace(/,/g, ''));
        incomeData.push(row)
        })

    incomeVis = new IncomeVis("household-income-map", dataArray[0], incomeData);
}



