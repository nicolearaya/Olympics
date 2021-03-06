
// Init global variables & switches
let measureVis,
    measureTable,
    physicalVis,
    genderRatio,
    ageRange,
    incomeVis,
    incomePlot,
    parallelcoordVis,
    hostMedalsVis,
    popularityVis;

let bucketed = [];

// Load data using promises
let promises = [
    d3.csv("data/athlete_events.csv"),
    d3.csv("data/combined_roster.csv"),
    d3.csv("data/5Y2018_income.csv"),
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json"),
    d3.csv("data/noc_regions.csv"),
    d3.csv("data/popularity.csv")
];

Promise.all(promises)
    .then( function(data){ loadVis(data) })
    .catch( function (err){console.log(err)} );

function loadVis(data) {

    // Fade in animation
    d3.select("#title").transition().duration(1000).ease(d3.easeCubicIn).style("opacity", 1)
    d3.select("#subheading").transition().duration(1000).ease(d3.easeCubicIn).style("opacity", 1)
    d3.select("#underline").transition().delay(5000).duration(2000).ease(d3.easeCubicIn).style("opacity", 1)
    d3.select("#subtitle").transition().delay(5000).duration(3000).ease(d3.easeCubicIn).style("opacity", 1)

    d3.select("#animation-div").transition().duration(6000).ease(d3.easeCubicIn).style("opacity", 1)


    let athleteData = data[0];
    let hometownData = data[1];
    let incomeData = data[2];
    let geoData = data[3];
    let regionData = data[4];
    let popularityData = data[5]

    // Prepare athlete data
    let cleanAthlete = [];

    // Clean up data by removing rows that have NA
    athleteData.forEach(athlete => {
        if (athlete.Height != "NA" && athlete.Weight != "NA") {
            if (athlete.Year == 2016 && athlete.Team == "United States") {
                if (athlete.Sport == 'Athletics') {athlete.Sport = 'Track & Field'};
                if (athlete.Sport == 'Hockey') {athlete.Sport = 'Field Hockey'};
                athlete.Height = +(athlete.Height * 0.393701).toFixed(2)
                athlete.Weight = +(athlete.Weight * 2.20462).toFixed(2)
                athlete.Age = +athlete.Age
                athlete.Sex = athlete.Sex
                cleanAthlete.push(athlete)
            }
        }
    })

    cleanAthlete = _.uniqBy(cleanAthlete, function(athlete) { return [athlete.Sport, athlete.ID].join(); });

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
                State: athlete["STATE ABR"],
                Season: athlete["SEASON"]
            }
        )

        if (athlete["LAT"] !== "#N/A" && athlete["LONG"] !== "#N/A") {

            athlete["LONG"] = +athlete["LONG"]
            athlete["LAT"] = +athlete["LAT"]

            cityData.push(
                {
                    type: "Feature",
                    properties: {
                        Hometown: athlete["HOMETOWN CITY"],
                        Season: athlete["SEASON"]
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
                if (athlete.Sport == 'Athletics') {athlete.Sport = 'Track & Field'};
                if (athlete.Sport == 'Hockey') {athlete.Sport = 'Field Hockey'};

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
                if (athlete.Sport == 'Athletics') {athlete.Sport = 'Track & Field'};
                if (athlete.Sport == 'Hockey') {athlete.Sport = 'Field Hockey'};
                cleanGlobalGold.push(athlete)
            }
        }
    })

    // change country abbreviation into country name
    cleanGlobalGold.forEach(d => {
        d.NOC = regionData.find(country => country.NOC == d.NOC).region;
    })

    let cleanedPhysical = _.uniqBy(cleanGlobalPhysical, function(athlete) { return [athlete.Sport, athlete.ID].join(); });

    // Init vis for physical measurements
    genderRatio = new GenderRatio("gender-ratio", cleanedPhysical);
    ageRange = new AgeRange("age-range", cleanedPhysical);
    measureVis = new MeasureVis("measure-vis", cleanedPhysical);
    measureTable = new MeasureTable("measure-table", cleanedPhysical);

    // Init parallel coord vis
    parallelcoordVis = new ParallelCoordVisVis("parallel-coord-vis", cleanGlobalPhysical, cleanGlobalGold);

    // Init vis for popularity stats
    popularityVis = new PopularityVis("popularity-vis", popularityData)
};

function physicalUpdate(){
    physicalVis.wrangleData();
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

    dataArray[4].forEach( d => {
        d.cost = +d.cost;
    })
    incomePlot = new IncomePlot("income-plot", dataArray[2]);
    hostMedalsVis = new HostMedalsVis("host-country-wins", dataArray[3], dataArray[4])
}

