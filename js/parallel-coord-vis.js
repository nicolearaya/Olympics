class ParallelCoordVisVis {

    constructor(parentElement, physicalData, goldData) {
        this.parentElement = parentElement;
        this.physicalData = physicalData;
        this.goldData = goldData;
        this.displayData = [];
        this.sports = [];

        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 20, right: 15, bottom: 20, left: 30};

        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
            vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;

        // svg drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // prep data and set dimensions
        function femaleCount(d) {
            if (d.Sex === "F") {
                return 1
            } else {
                return NaN
            }
        }

        // find the min, max, range, mean for relevant dimensions
        vis.sportInfo = d3.rollups(vis.physicalData, v => {
            return {
                "WeightMin": d3.min(v, d => d.Weight),
                "WeightMax": d3.max(v, d => d.Weight),
                "WeightRange": d3.max(v, d => d.Weight) - d3.min(v, d => d.Weight),
                "WeightMean": d3.mean(v, d => d.Weight),
                "HeightMin": d3.min(v, d => d.Height),
                "HeightMax": d3.max(v, d => d.Height),
                "HeightRange": d3.max(v, d => d.Height) - d3.min(v, d => d.Height),
                "HeightMean": d3.mean(v, d => d.Height),
                "AgeMin": d3.min(v, d => d.Age),
                "AgeMax": d3.max(v, d => d.Age),
                "AgeRange": d3.max(v, d => d.Age) - d3.min(v, d => d.Age),
                "AgeMean": d3.mean(v, d => d.Age),
                "FemProp": d3.count(v, femaleCount) / d3.count(v, d => 1),
                "AthleteCount": d3.count(v, d => 1)
            }
        }, d => d.Sport)

        // calculate gender ratio such that the number returned is the smaller of the two proportions of male or female
        vis.sportInfo.forEach(sport => {
            let genRatio;
            if (sport[1].FemProp > 0.5) {
                genRatio = 1 - sport[1].FemProp
            } else {
                genRatio = sport[1].FemProp
            }
            sport[1]["Gender"] = genRatio;
        })

        // keep track of olympic sports included in first dataset
        vis.sportInfo.forEach(sport => {
            vis.sports.push(sport[0])
        })

        // group number of gold medals by each country for each of the 51 summer and winter sports
        vis.goldCountByCountry = d3.rollups(vis.goldData, v => v.length, d => d.Sport, d=> d.NOC)

        // get proportion of gold medal wins by country for each sport
        let propMin = 1;
        let propMax = 0;
        vis.goldCountByCountry.forEach(sport => {
            // sort countries by descending order of number of wins
            sport[1].sort((a,b) => b[1] - a[1]);

            let total = 0,
                i = 0;
            while (i < sport[1].length) {
                total += sport[1][i][1]
                i ++;
            }

            // keep track of minimum and maximum proportions of countries winning each sport
            if (sport[1].length > propMax) {
                propMax = sport[1].length;
            }
            if (sport[1].length < propMin) {
                propMin = sport[1].length;
            }

            let props = {},
                j = 0;
            while (j < sport[1].length) {
                props[sport[1][j][0]] = +(sport[1][j][1]/total).toFixed(2);
                j++;
            }

            // only include sports for which I have data from both datasets
            if (vis.sports.includes(sport[0])) {
                vis.sportInfo.forEach(sportInfo => {
                    if (sportInfo[0] === sport[0]) {
                        sportInfo.MedalsGiven = total
                        sportInfo.DistinctWinnerCount = sport[1].length
                        sportInfo.Winners = props
                    }
                })
            }

        })

        // set dimensions
        vis.y = {};
        vis.dimensions = ["Winner Diversity", "Athlete Count", "Gender", "Age", "Height", "Weight"];
        vis.dimensions.forEach(dimension => {

            if (dimension === "Winner Diversity") {
                vis.y[dimension] = d3.scaleSymlog()
                    .domain([propMin, propMax])
                    .range([vis.height, 0])
            } else if (dimension === "Gender") {
                vis.y[dimension] = d3.scaleSymlog()
                    .domain([0, 0.5])
                    .range([vis.height, 0])
            } else if (dimension === "Athlete Count") {
                vis.y[dimension] = d3.scaleSymlog()
                    .domain([d3.min(vis.sportInfo, d => d[1]["AthleteCount"]), d3.max(vis.sportInfo, d => d[1]["AthleteCount"])])
                    .range([vis.height, 0])
            } else {
                vis.y[dimension] = d3.scaleLinear()
                    .domain([d3.min(vis.sportInfo, d => d[1][dimension + "Range"]), d3.max(vis.sportInfo, d => d[1][dimension + "Range"])])
                    .range([vis.height, 0])
            }
        });

        // create scale for overall score
        vis.y["High"] = d3.scaleLinear()
            .domain([0, 10])
            .range([vis.height,0])

        // calculate sport score by bucketing sport into different ranks for each dimension
        vis.dimensions.forEach(dimension => {
            let bucket = new Bucket(6, vis.y[dimension].domain()[0], vis.y[dimension].domain()[1])

            vis.sportInfo.forEach(sport => {

                if (dimension === "Gender") {
                    bucket.getBucketCategory(sport[0], sport[1][dimension])
                } else if (dimension === "Winner Diversity") {
                    bucket.getBucketCategory(sport[0], sport.DistinctWinnerCount)
                } else if (dimension === "Athlete Count") {
                    bucket.getBucketCategory(sport[0], sport[1]["AthleteCount"])
                }
                else {
                    bucket.getBucketCategory(sport[0], sport[1][dimension + "Range"])
                }
            })
        })

        // sports can have a max of 30 points based on the 6 dimensions we consider
        // make score out of 10 instead of our of 30
        Object.keys(bucketed).forEach(sport => {
            bucketed[sport].total = bucketed[sport].total/3;
        })
        console.log(bucketed)

        // assign sports medals based on score
        // highest value is 7.6 out of 10 and sports that receive a 5 or above will have a passing grade (green) and those below a failing grade (red)
        vis.sportInfo.forEach(sport => {
            if (bucketed[sport[0]].total >= 5) {
                bucketed[sport[0]].score = "PASS"
                bucketed[sport[0]].color = "#168C39"
            } else {
                bucketed[sport[0]].score = "FAIL"
                bucketed[sport[0]].color = "#EE2F4D"
            }
        })

        // scales and path
        vis.x = d3.scalePoint()
            .range([18, vis.width])
            .padding(1)
            .domain(vis.dimensions);

        function path(d) {
            return d3.line()(vis.dimensions.map(p => {
                if (p === "Gender") {
                    return [vis.x(p), vis.y[p](d[1][p])]
                } else if (p === "Winner Diversity") {
                    return [vis.x(p), vis.y[p](d.DistinctWinnerCount)]
                } else if (p === "Athlete Count") {
                    return [vis.x(p), vis.y[p](d[1]["AthleteCount"])]
                }
                else {
                    return [vis.x(p), vis.y[p](d[1][p + "Range"])]
                }
            }))
        }

        // draw axes
        vis.svg.selectAll("myAxis")
            .data(vis.dimensions)
            .enter()
            .append("g")
            .attr("transform", d => {
                return "translate(" + vis.x(d) + ")"
            })
            .each(addAxis)
            .append("text")
            .style("text-anchor", "middle")
            .attr("y", -9)
            .text(d => {
                if (d === "Winner Diversity") {
                    return d
                } else if (d === "Gender") {
                    return d + " Ratio"
                } else if (d === "Athlete Count") {
                    return d
                } else {
                    return d + " Range"
                }
            })
            .style("fill", "#d1cde2");

        // draw axes for overall trend
        vis.overallAxis = vis.svg.append("g")
            .attr("transform", `translate(${vis.margin.left - 10})`)
            .call(d3.axisLeft().scale(vis.y["High"]));

        vis.overallAxis
            .append("text")
            .attr("y", -9)
            .text("High")
            .style("fill", "#d1cde2");

        vis.overallAxis
            .append("text")
            .attr("y", 358)
            .text("Low")
            .style("fill", "#d1cde2");

        // draw lines
        vis.svg.selectAll("myPath")
            .data(vis.sportInfo)
            .enter()
            .append("path")
            .attr("d", path)
            .style("fill", "none")
            .style("stroke", d => bucketed[d[0]].color)
            .style("stroke-width", d => {
                if (bucketed[d[0]].score === "PASS") {
                    return 4
                } else {
                    return 2.5
                }
            })
            .style("opacity", d => {
                if (bucketed[d[0]].score === "PASS") {
                    return 0.7
                } else {
                    return 0.3
                }
            })
            .on("mouseover", display)
            .on("mouseout", nondisplay);

        // append tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'parallelTooltip')


        function addAxis(d, i) {
            d3.select(this)
                .call(d3.axisLeft().scale(vis.y[d]).tickValues(vis.y[d].domain()))
        }

        function display(event, d) {

            // print score
            document.getElementById("sport-score").innerHTML = `${bucketed[d[0]].score}  ${bucketed[d[0]].total.toFixed(1)}/10`;
            document.getElementById("sport-score").style.color = bucketed[d[0]].color;

            // hide explanation paragraph
            document.getElementById("parallel-vis-para").style.display = "none";

            // display table
            let table = d3.select("#sport-table").append("table")
                .attr("class", "table dimension");
            let tbody = table.append("tbody");

            function displayHeight(val) {
                var quotient = Math.floor(val/12);
                var remainder = val % 12;
                return quotient + "ft " + remainder.toFixed(0) + "in"
            }

            let tableData = [{"label": "Sport", "data": d[0]},
                {"label": "Winner Diversity", "data": d.DistinctWinnerCount + " Different Countries Won (" + Object.keys(d.Winners)[0] + " won " + d3.format(".0%")(Object.values(d.Winners)[0]) +" of the time)"},
                {"label": "Athlete Count", "data": d[1].AthleteCount},
                {"label": "Gender Ratio", "data": d3.format(".0%")(d[1].Gender) + " Female"},
                {"label": "Age Range", "data": d[1].AgeMin + " - " + d[1].AgeMax},
                {"label": "Height Range", "data": displayHeight(d[1].HeightMin) + " - " + displayHeight(d[1].HeightMax)},
                {"label": "Weight Range", "data": d[1].WeightMin.toFixed(0) + " - " + d[1].WeightMax.toFixed(0) + " lbs"}];

            let rows = tbody.selectAll("tr")
                .data(tableData)
                .enter()
                .append("tr");

            rows.append("th")
                .text(d => d.label);

            rows.append("td")
                .text(d => d.data);

            // display tooltip
            vis.tooltip
                .style("opacity", 1)
                .style("left", event.pageX + 20 + "px")
                .style("top", event.pageY + "px")
                .html(`
                     <div>
                         <h5>${d[0]}</h5>
                     </div>`)
        }

        function nondisplay(event, d) {

            // erase previous table
            d3.selectAll(".dimension")
                .remove()
                .exit()
                .data(d)

            vis.tooltip
                .style("opacity", 0)
                .style("left", 0)
                .style("top", 0)
                .html(``);

            // erase previous printed score
            document.getElementById("sport-score").innerHTML = "";

            // show explanation paragraph
            document.getElementById("parallel-vis-para").style.display = "block";
        }
    }
}



