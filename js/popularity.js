class PopularityVis {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.popularityData = data;
        this.accessibilityScores = bucketed;

        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.displayData = [];

        // Aggregate the sport name, popularity ranking, and accessibility score
        vis.popularityData.forEach(sport => {
            if (vis.accessibilityScores[sport.Sport]) {
                vis.displayData.push([sport.Sport, sport.Popularity, vis.accessibilityScores[sport.Sport].total])
            }
        })


        console.log(vis.displayData)

        vis.margin = { top: 100, right: 100, bottom: 100, left: 100 };

        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
            vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;


        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Scales and axes
        // Scale for accessibility score
        vis.x = d3.scaleLinear()
            .range([0, vis.width])
            .domain(d3.extent(vis.displayData.map(x => x[2])));

        // Scale for popularity
        vis.y = d3.scaleLinear()
            .range([vis.height,0])
            .domain(d3.extent(vis.displayData.map(x => +x[1])));

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .tickFormat(d3.format(","))
            .tickSize(5)
            .ticks(8);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y)
            .tickFormat(d3.format(","))
            .tickSize(5);

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + (vis.height + 10) + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .attr("transform", "translate(-10, 0)");

        // Call axis function
        vis.svg.select(".x-axis").call(vis.xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .attr("x", -20)
            .attr("y", 5);
        vis.svg.select(".y-axis").call(vis.yAxis);

        // Create tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "gdp-tooltip")
            .style("opacity", 0)


        vis.sport = vis.svg.selectAll(".popularity-dot")
            .data(vis.displayData)

        vis.sport.enter().append("circle")
            .merge(vis.sport)
            .attr("class", "popularity-dot")
            .on("mouseover", function(e, d) {
                vis.tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                vis.tooltip.html(d[0])
                    .style("left", (e.pageX) + "px")
                    .style("top", (e.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                vis.tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .attr("cx", d => vis.x(d[2]))
            .attr("cy", d => vis.y(+d[1]))
            .attr("r", 10)
            .attr("stroke", "black")
            .attr("fill", "blue")

        vis.sport.exit().remove();
    }
}