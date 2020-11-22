class IncomePlotDataWrangling {

    constructor(parentElement, incomeData) {
        this.parentElement = parentElement;
        this.incomeData = incomeData;

        this.initVis()
    }

    initVis() {
        let vis = this;

        //margin conventions\
        vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = $("#" + vis.parentElement).height();
        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);
        vis.wrangleData()

        //legend circles
        vis.legend
            .append("circle")
            .attr("r",5)
            .attr("cx",20)
            .attr("cy",20)
            .attr("fill", "green")
            .style("opacity", ".7");
        vis.legend
            .append("circle")
            .attr("r", 5)
            .attr("cx", 20)
            .attr("cy",60)
            .attr("fill", "steelblue")
            .style("opacity", ".7");

        //legend text
        vis.legend.append("text")
            .attr("x",35)
            .attr("y",20)
            .attr("alignment-baseline", "central")
            .text("Summer");
    }

    wrangleData(){
        let vis = this;

        vis.filteredData = [];
        vis.unaccountedData = [];
        vis.unaccountedData2 = [];

        vis.summer = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        vis.winter = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        // load data using promises
        let promises = [
            d3.csv("data/athlete_hometowns_all.csv"), //https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"), // already projected -> you can just scale it to ft your browser window
            d3.csv("data/uscities.csv"),
            d3.csv("data/us_cities_counties.csv")
        ];

        Promise.all(promises)
            .then( function(data){ gatherData(data) })
            .catch( function (err){console.log(err)} );

        function gatherData(data) {
            let hometown = [];
            data[0].forEach(row => {
                row.state = row.state.replace(/\s+/g, '');
                row.city = row.city.trim()
                hometown.push(row)
            })
            let city_county  = data[1];
            let city_county2 = data[2];
            hometown.forEach( obj => {
                var result2 = null;
                var result = city_county.filter(function(d) {
                    if(d.city === obj.city && d.state_id === obj.state) {
                        d.summer_winter = obj.summer_winter
                        return d;
                    }
                    else {
                        result2 = obj;
                    }})
                if (result.length >= 1) {
                    vis.filteredData.push(result[0]);
                }
                else {
                    vis.unaccountedData.push(result2)
                }
            })
            /*
            //this would parse an additional dataset for the values not found in uscities.csv
            vis.unaccountedData.forEach( obj => {
                var result2 = null;
                var result = city_county.filter(function(d) {
                    if(d.city === obj.city && d.state_id === obj.state) {
                        d.summer_winter = obj.summer_winter
                        return d;
                    }
                    else {
                        result2 = obj;
                    }})
                if (result.length >= 1) {
                    vis.filteredData.push(result[0]);
                }
                else {
                    vis.unaccountedData2.push(result2)
                }
            })
            */

            vis.incomeData.forEach( d => {
                d.GEOID = +d.GEOID
                }
            )

            vis.athletesByCounty = d3.rollup(vis.filteredData, v => v.length, d => d.county_fips)
            vis.athletesByCounty = d3.nest()
                .key(function(d) { return d.county_fips; })
                .entries(vis.filteredData);
            vis.filteredData.forEach( d => {
                d.county_fips = +d.county_fips
                if (d.summer_winter === "summer") {
                    let result = vis.incomeData.find(obj => {
                        return obj.GEOID === d.county_fips
                    })
                        if (result.ESTIMATE < 10000) {
                            vis.summer[0] += 1;
                        }
                        else if (result.ESTIMATE < 20000 && result.ESTIMATE > 10000) {
                            vis.summer[1] += 1;
                        }
                        else if (result.ESTIMATE < 30000 && result.ESTIMATE > 20000) {
                            vis.summer[2] += 1;
                        }
                        else if (result.ESTIMATE < 40000 && result.ESTIMATE > 30000) {
                            vis.summer[3] += 1;
                        }
                        else if (result.ESTIMATE < 50000 && result.ESTIMATE > 40000) {
                            vis.summer[4] += 1;
                        }
                        else if (result.ESTIMATE < 60000 && result.ESTIMATE > 50000) {
                            vis.summer[5] += 1;
                        }
                        else if (result.ESTIMATE < 70000 && result.ESTIMATE > 60000) {
                            vis.summer[6] += 1;
                        }
                        else if (result.ESTIMATE < 80000 && result.ESTIMATE > 70000) {
                            vis.summer[7] += 1;
                        }
                        else if (result.ESTIMATE < 90000 && result.ESTIMATE > 80000) {
                            vis.summer[8] += 1;
                        }
                        else if (result.ESTIMATE < 100000 && result.ESTIMATE > 90000) {
                            vis.summer[9] += 1;
                        }
                        else if (result.ESTIMATE < 110000 && result.ESTIMATE > 100000) {
                            vis.summer[10] += 1;
                        }
                        else if (result.ESTIMATE < 120000 && result.ESTIMATE > 110000) {
                            vis.summer[11] += 1;
                        }
                        else if (result.ESTIMATE < 130000 && result.ESTIMATE > 120000) {
                            vis.summer[12] += 1;
                        }
                        else if (result.ESTIMATE < 140000 && result.ESTIMATE > 130000) {
                            vis.summer[13] += 1;
                        }
                        else if (result.ESTIMATE < 150000 && result.ESTIMATE > 140000) {
                            vis.summer[14] += 1;
                        }
                        else if (result.ESTIMATE < 160000 && result.ESTIMATE > 150000) {
                                vis.summer[15] += 1;
                            }
                }
                if (d.summer_winter === "winter") {
                    let result = vis.incomeData.find(obj => {
                        return obj.GEOID === d.county_fips
                    })
                        if (result.ESTIMATE < 10000) {
                            vis.winter[0] += 1;
                        }
                        else if (result.ESTIMATE < 20000 && result.ESTIMATE > 10000) {
                            vis.winter[1] += 1;
                        }
                        else if (result.ESTIMATE < 30000 && result.ESTIMATE > 20000) {
                            vis.winter[2] += 1;
                        }
                        else if (result.ESTIMATE < 40000 && result.ESTIMATE > 30000) {
                            vis.winter[3] += 1;
                        }
                        else if (result.ESTIMATE < 50000 && result.ESTIMATE > 40000) {
                            vis.winter[4] += 1;
                        }
                        else if (result.ESTIMATE < 60000 && result.ESTIMATE > 50000) {
                            vis.winter[5] += 1;
                        }
                        else if (result.ESTIMATE < 70000 && result.ESTIMATE > 60000) {
                            vis.winter[6] += 1;
                        }
                        else if (result.ESTIMATE < 80000 && result.ESTIMATE > 70000) {
                            vis.winter[7] += 1;
                        }
                        else if (result.ESTIMATE < 90000 && result.ESTIMATE > 80000) {
                            vis.winter[8] += 1;
                        }
                        else if (result.ESTIMATE < 100000 && result.ESTIMATE > 90000) {
                            vis.winter[9] += 1;
                        }
                        else if (result.ESTIMATE < 110000 && result.ESTIMATE > 100000) {
                            vis.winter[10] += 1;
                        }
                        else if (result.ESTIMATE < 120000 && result.ESTIMATE > 110000) {
                            vis.winter[11] += 1;
                        }
                        else if (result.ESTIMATE < 130000 && result.ESTIMATE > 120000) {
                            vis.winter[12] += 1;
                        }
                        else if (result.ESTIMATE < 140000 && result.ESTIMATE > 130000) {
                            vis.winter[13] += 1;
                        }
                        else if (result.ESTIMATE < 150000 && result.ESTIMATE > 140000) {
                            vis.winter[14] += 1;
                        }
                        else if (result.ESTIMATE < 160000 && result.ESTIMATE > 150000) {
                            vis.winter[15] += 1;
                        }
                }
            })
            }

        vis.color = d3.scaleLinear()
            .domain(d3.extent(vis.incomeData, d=>d.ESTIMATE))
            .range(["#C7DFFF", "#08306B"]);


        vis.updateVis()
    }


    updateVis(){
        let vis = this;
        //console.log(vis.incomeData)
        vis.incomeBrackets = []
        vis.incomeBrackets = Array.from({length: 16}, (x, i) => i+1);


        d3.csv("data/final_income_plot_data.csv", function(d) {
            return d;
        }, function(error, rows) {
            console.log(rows);
        })

        var myData = null;

        d3.csv("data/final_income_plot_data.csv")
            .row(function(d) { return {key: d.key, value: d.value}; })
            .get(function(error, rows) {
                console.log(rows);
                myData = rows;// Now you can assign it
                myDataIsReady()// Now you can draw it
            });

        console.log(myData);// will trace null

        function myDataIsReady() {
            console.log(myData);// will trace the data that was loaded
            // Here you can draw your visualization
        }

        d3.csv("data/final_income_plot_data.csv", function(data) {
                console.log(data);
        });
    }
}

