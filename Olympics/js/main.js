
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