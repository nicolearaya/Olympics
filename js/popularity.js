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
                vis.displayData.push([sport.Sport, (+sport.Popularity * 10).toFixed(1), (+vis.accessibilityScores[sport.Sport].total).toFixed(2)])
            }
        })

        vis.margin = { top: 75, right: 75, bottom: 100, left: 100 };

        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
            vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;


        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.svg.append('rect').attr("width", vis.width).attr("height", vis.height)
            .style("fill", "#130e35")

        // Scales and axes
        // Scale for accessibility score
        vis.x = d3.scaleLinear()
            .range([0, vis.width])
            .domain([-.25,8]);

        // Scale for popularity
        vis.y = d3.scaleLinear()
            .range([vis.height,0])
            .domain([1.5,7.5]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .tickFormat(d3.format(","))
            .tickSize(5)
            .ticks(8);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y)
            .tickFormat(d3.format(","))
            .tickSize(5);


        // x axis title
        vis.svg.append("text")
            .attr("class", "chart-titles")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + 70)
            .text("Accessibility Score")

        // Y axis title
        vis.svg.append("text")
            .attr("class", "chart-titles")
            .attr("transform", `rotate(-90)translate(-${vis.height/2}, -50)`)
            .text("Popularity Score")

        // Create tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "popularity-tooltip")
            .style("opacity", 0)

        // Reformat the data: d3.hexbin() needs a specific format
        vis.hexData = []
        vis.displayData.forEach(function(d) {
            vis.hexData.push({x: +d[2], y: +d[1]} )
        })

        // Compute the hexbin data
        var hexbin = d3.hexbin()
            .radius(25 * vis.width / (vis.height - 1)) // size of the bin in px
            .x(d => vis.x(d.x))
            .y(d => vis.y(d.y))
            .extent([ [0, 0], [vis.width, vis.height] ])

        vis.svg.append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("class", "mesh")
            .attr("width", vis.width)
            .attr("height", vis.height);

        vis.svg.append("svg:path")
            .attr("clip-path", "url(#clip)")
            .attr("d", hexbin.mesh())
            .style("stroke-width", 1)
            .style("stroke", "var(--darkpurple)")
            .style("fill", "none");

        vis.color = d3.scaleLinear()
            .range(["#130e35", "#3C8EFF"])
            .domain([0, 10])

        // Plot the hexbins
        vis.svg.append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height)

        vis.svg.append("g")
            .attr("clip-path", "url(#clip)")
            .selectAll("path")
            .data( hexbin(vis.hexData) )
            .enter().append("path")
            .attr("d", hexbin.hexagon())
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
            .attr("fill", d => vis.color(d.length))
            .style("stroke-width", 1)
            .style("stroke", "var(--darkpurple)")

        // Regression line
        vis.linearRegression = d3.regressionLinear()
            .x(d => d.x)
            .y(d => d.y)
            .domain([-.25, 8])

        vis.regressionLine = [vis.linearRegression(vis.hexData)[0], vis.linearRegression(vis.hexData)[1]]

        vis.line = d3.line()
            .x(d => vis.x(d[0]))
            .y(d => vis.y(d[1]))

        vis.svg.append('path')
            .classed('regressionLine', true)
            .datum(vis.regressionLine)
            .attr('d', vis.line)
            .style("stroke-dasharray", ("5, 5"))
            .attr("stroke-width", 1)
            .attr("stroke", "var(--purplewhite)");

        // Create dots for sports
        vis.sport = vis.svg.selectAll(".popularity-dot")
            .data(vis.displayData)

        vis.sport.enter().append("circle")
            .merge(vis.sport)
            .attr("class", "popularity-dot")
            .on("mouseover", function(e, d) {
                d3.select(this)
                    .transition()
                    .duration(400)
                    .attr("r", 12)
                    .attr("stroke", "var(--highlightpurple)")
                    .attr("stroke-width", "3")
                vis.tooltip.transition()
                    .transition()
                    .duration(400)
                    .style("opacity", 1);
                vis.tooltip
                    .html(`<h3>${d[0]}</h3><br>Popularity: ${d[1]}<br>Accessibility: ${d[2]}`)
                    .style("left", (e.pageX + 20) + "px")
                    .style("top", (e.pageY - 50) + "px");
            })
            .on("mouseout", function(d) {
                vis.tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
                d3.select(this)
                    .transition()
                    .duration(400)
                    .attr("r", 6)
                    .attr("stroke", "var(--lighterpurple)")
                    .attr("stroke-width", "1")
            })
            .attr("cx", d => vis.x(d[2]))
            .attr("cy", d => vis.y(+d[1]))
            .attr("stroke", "var(--lighterpurple)")
            .attr("r", 6)
            .attr("fill", "var(--blue)")

        vis.sport.exit().remove();

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + (vis.height) + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .attr("transform", "translate(0, 0)");

        // Call axis function
        vis.svg.select(".x-axis").call(vis.xAxis);

        vis.svg.select(".y-axis").call(vis.yAxis);
    }
}