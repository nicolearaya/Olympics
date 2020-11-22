
// Init global variables & switches
let measureVis,
    measureTable,
    physicalVis,
    incomeVis,
    parallelcoordVis;

let bucketed = [];

// Load data using promises
let promises = [
    d3.csv("data/athlete_events.csv"),
    d3.csv("data/combined_roster.csv"),
    d3.csv("data/5Y2018_income.csv"),
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json")
];

Promise.all(promises)
    .then( function(data){ loadVis(data) })
    .catch( function (err){console.log(err)} );


function loadVis(data) {

    // Check data
    console.log(data)

    let athleteData = data[0];
    let hometownData = data[1];
    let incomeData = data[2];
    let geoData = data[3];

    // Prepare athlete data
    let cleanAthlete = [];

    // Clean up data by removing rows that have NA
    athleteData.forEach(athlete => {
        if (athlete.Height != "NA" && athlete.Weight != "NA") {
            if (athlete.Year == 2016 && athlete.Team == "United States") {
                athlete.Height = +athlete.Height * 0.393701
                athlete.Weight = +athlete.Weight * 2.20462
                athlete.Age = +athlete.Age
                athlete.Sex = athlete.Sex
                cleanAthlete.push(athlete)
            }
        }
    })

    measureVis = new MeasureVis("measure-vis", cleanAthlete);
    measureTable = new MeasureTable("measure-table", cleanAthlete);
    physicalVis = new PhysicalVis("user-physical-trait-vis", cleanAthlete);

    // Prepare hometown data
    let cleanHome = [];
    let cityData = [];

    hometownData.forEach(athlete => {

        cleanHome.push(
            {
                First: athlete["FIRST NAME"],
                Last: athlete["LAST NAME"],
                Sport: athlete["SPORT"],
                Hometown: athlete["HOMETOWN CITY"],
                State: athlete["STATE ABR"]
            }
        )

        if (athlete["LAT"] !== "#N/A" && athlete["LONG"] !== "#N/A") {

            athlete["LONG"] = +athlete["LONG"]
            athlete["LAT"] = +athlete["LAT"]

            cityData.push(
                {
                    type: "Feature",
                    properties: {
                        Hometown: athlete["HOMETOWN CITY"]
                    },
                    geometry: {
                        type: "Point",
                        coordinates: [athlete["LONG"], athlete["LAT"]]
                    }
                }
            )
        }
    });


    // Prepare income data
    let cleanIncome = [];
    incomeData.forEach(row => {
        row.ESTIMATE = parseFloat(row.ESTIMATE.replace(/,/g, ''));
        cleanIncome.push(row)
    })

    // Init hometown map
    incomeVis = new IncomeVis("household-income-map", geoData, cityData, cleanHome, cleanIncome);

    parallelcoordVis = new ParallelCoordVisVis("parallel-coord-vis", cleanAthlete);
};


function physicalUpdate(){
    document.getElementById("btn-physical").disabled = true;
    physicalVis.wrangleData()
}