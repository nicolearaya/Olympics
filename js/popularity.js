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
            .style("stroke-width", 3)
            .style("stroke", "var(--lighterpurple)")
            .style("fill", "none");

        vis.color = d3.scaleLinear()
            .range(["#050224", "#110554"])
            .domain([0, 6])

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
            .style("stroke-width", 3)
            .style("stroke", "var(--lighterpurple)")

        // Regression line
        vis.linearRegression = d3.regressionLinear()
            .x(d => d.x)
            .y(d => d.y)

        vis.regressionLine = [vis.linearRegression(vis.hexData)[0], vis.linearRegression(vis.hexData)[1]]

        vis.line = d3.line()
            .x(d => vis.x(d[0]))
            .y(d => vis.y(d[1]))

        vis.svg.append('path')
            .classed('regressionLine', true)
            .datum(vis.regressionLine)
            .attr('d', vis.line)
            .style("stroke-dasharray", ("5, 5"))
            .attr("stroke", "white");

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
                    .attr("stroke", "#5923fc")
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
                    .attr("stroke", "#530e0e")
                    .attr("stroke-width", "1")
            })
            .attr("cx", d => vis.x(d[2]))
            .attr("cy", d => vis.y(+d[1]))
            .attr("stroke", "#530e0e")
            .attr("r", 6)
            .attr("fill", "var(--red)")

        vis.sport.exit().remove();
    }
}