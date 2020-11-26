
// Init global variables & switches
let measureVis,
    measureTable,
    physicalVis,
    genderRatio,
    ageRange,
    incomeVis,
    incomePlot,
    parallelcoordVis;

let bucketed = [];

// Load data using promises
let promises = [
    d3.csv("data/athlete_events.csv"),
    d3.csv("data/combined_roster.csv"),
    d3.csv("data/5Y2018_income.csv"),
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json"),
    d3.csv("data/noc_regions.csv")
];

Promise.all(promises)
    .then( function(data){ loadVis(data) })
    .catch( function (err){console.log(err)} );

function loadVis(data) {

    let athleteData = data[0];
    let hometownData = data[1];
    let incomeData = data[2];
    let geoData = data[3];
    let regionData = data[4];

    // Prepare athlete data
    let cleanAthlete = [];

    // Clean up data by removing rows that have NA
    athleteData.forEach(athlete => {
        if (athlete.Height != "NA" && athlete.Weight != "NA") {
            if (athlete.Year == 2016 && athlete.Team == "United States") {
                athlete.Height = +(athlete.Height * 0.393701).toFixed(2)
                athlete.Weight = +(athlete.Weight * 2.20462).toFixed(2)
                athlete.Age = +athlete.Age
                athlete.Sex = athlete.Sex
                cleanAthlete.push(athlete)
            }
        }
    })

    cleanAthlete = _.uniqBy(cleanAthlete, function(athlete) { return [athlete.Sport, athlete.ID].join(); });


    genderRatio = new GenderRatio("gender-ratio", cleanAthlete);
    ageRange = new AgeRange("age-range", cleanAthlete)

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

    // Prepare global athlete data for 2016 for age and height range
    let cleanGlobalPhysical = [];
    athleteData.forEach(athlete => {
        if (athlete.Height != "NA" && athlete.Weight != "NA") {
            if (athlete.Year == 2016 || athlete.Year == 2014) {
                if (athlete.Year == 2016 && athlete.Team == "United States") {
                    cleanGlobalPhysical.push(athlete)
                } else {
                    athlete.Height = +(athlete.Height * 0.393701).toFixed(2)
                    athlete.Weight = +(athlete.Weight * 2.20462).toFixed(2)
                    athlete.Age = +athlete.Age
                    cleanGlobalPhysical.push(athlete)
                }
            }
        }
    })

    // Prepare global data for athletes who won gold for all games after 1952
    let cleanGlobalGold = [];
    athleteData.forEach(athlete => {
        if (athlete.Height != "NA" && athlete.Weight != "NA") {
            if (athlete.Medal === "Gold" && athlete.Year >= 1952) {
                cleanGlobalGold.push(athlete)
            }
        }
    })

    // change country abbreviation into country name
    cleanGlobalGold.forEach(d => {
        d.NOC = regionData.find(country => country.NOC == d.NOC).region;
    })


    // Init parallel coord vis
    parallelcoordVis = new ParallelCoordVisVis("parallel-coord-vis", cleanGlobalPhysical, cleanGlobalGold);
};


function physicalUpdate(){
    document.getElementById("btn-physical").disabled = true;
    physicalVis.wrangleData()
}

// load data using promises
let promises2 = [
    d3.json("https://d3js.org/us-10m.v1.json"), //https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"), // already projected -> you can just scale it to ft your browser window
    d3.csv("data/5Y2018_income.csv"),
    d3.csv("data/final_income_plot_data.csv"),
    d3.csv("data/hosts_medals.csv"),
    d3.csv("data/summer_hosts.csv")
];

Promise.all(promises2)
    .then( function(data){ initIncomeVis(data) })
    .catch( function (err){console.log(err)} );

function initIncomeVis(dataArray) {

    let incomeData = [];
    dataArray[1].forEach(row => {
        row.ESTIMATE = parseFloat(row.ESTIMATE.replace(/,/g, ''));
        incomeData.push(row)
    })
    incomePlot = new IncomePlot("income-plot", dataArray[2]);
    hostMedalsVis = new HostMedalsVis("host-country-wins", dataArray[3], dataArray[4])
}