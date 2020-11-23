class ParallelCoordVisVis {

    constructor(parentElement, athleteData, costData) {
        this.parentElement = parentElement;
        this.athleteData = athleteData;
        this.costData = costData;
        this.displayData = [];

        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 20, right: 20, bottom: 20, left: 10};

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

        vis.sportInfo = d3.rollups(vis.athleteData, v => {
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
                "Gender": d3.count(v, femaleCount) / d3.count(v, d => 1)
            }
        }, d => d.Sport)
        console.log(vis.sportInfo)

        vis.y = {};
        vis.dimensions = ["Gender", "Age", "Height", "Weight"];
        vis.dimensions.forEach(dimension => {

            if (dimension === "Gender") {
                vis.y[dimension] = d3.scaleLinear()
                    .domain([d3.min(vis.sportInfo, d => d[1][dimension]), d3.max(vis.sportInfo, d => d[1][dimension])])
                    .range([vis.height, 0])
            } else {
                vis.y[dimension] = d3.scaleLinear()
                    .domain([d3.min(vis.sportInfo, d => d[1][dimension + "Range"]), d3.max(vis.sportInfo, d => d[1][dimension + "Range"])])
                    .range([vis.height, 0])
            }
        });

        // scales and path
        vis.x = d3.scalePoint()
            .range([0, vis.width])
            .padding(1)
            .domain(vis.dimensions);

        function path(d) {
            return d3.line()(vis.dimensions.map(p => {
                if (p === "Gender") {
                    // console.log(vis.y[p].domain())
                    return [vis.x(p), vis.y[p](d[1][p])]
                } else {
                    return [vis.x(p), vis.y[p](d[1][p + "Range"])]
                }
            }))
        }

        // draw lines
        vis.svg.selectAll("myPath")
            .data(vis.sportInfo)
            .enter()
            .append("path")
            .attr("d", path)
            .style("fill", "none")
            .style("stroke", "#0286c3")
            .style("opacity", 0.5)
            .on("mouseover", displayTable);

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
            .text(d => d)
            .style("fill", "black");

        // calculate sport report card
        vis.dimensions.forEach(dimension => {
            let bucket = new Bucket(3, vis.y[dimension].domain()[0], vis.y[dimension].domain()[1])
            vis.sportInfo.forEach(sport => {

                if (dimension === "Gender") {
                    bucket.getBucketCategory(sport[0], sport[1][dimension])
                } else {
                    bucket.getBucketCategory(sport[0], sport[1][dimension + "Range"])
                }
            })
        })

        function addAxis(d, i) {
            d3.select(this)
                .call(d3.axisLeft().scale(vis.y[d]).ticks(5))
        }

        function displayTable(event, d) {

            // erase previous table
            d3.selectAll(".dimension")
                .remove()
                .exit()
                .data(d)

            // print score report card
            let score;
            let color;
            if (bucketed[d[0]] < 3) {
                score = "BRONZE"
                color = "chocolate"
            } else if (bucketed[d[0]] < 5) {
                score = "SILVER"
                color = "darkgrey"
            } else {
                score = "GOLD"
                color = "gold"
            }
            document.getElementById("sport-score").innerHTML = score;
            document.getElementById("sport-score").style.color = color;

            // display table
            let table = d3.select("#sport-table").append("table")
                .attr("class", "table dimension");
            let tbody = table.append("tbody");

            let tableData = [{"label": "Sport", "data": d[0]},
                {"label": "Gender Ratio", "data" : d3.format(".0%")(d[1].Gender) + " Female"},
                {"label": "Age Range", "data" : d[1].AgeMin + " - " + d[1].AgeMax},
                {"label": "Height Range", "data" : (d[1].HeightMin).toFixed(1) + " - " + (d[1].HeightMax).toFixed(1) + " in"},
                {"label": "Weight Range", "data" : (d[1].WeightMin).toFixed(1) + " - " + (d[1].WeightMax).toFixed(1) + " lb"}];

            let rows = tbody.selectAll("tr")
                .data(tableData)
                .enter()
                .append("tr");

            rows.append("th")
                .text(d => d.label);

            rows.append("td")
                .text(d => d.data);
        }
    }
}



