class MeasureVis {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        this.displayData = data;

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = { top: 10, right: 20, bottom: 20, left: 40 };

        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
            vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Scales and axes
        vis.x = d3.scaleLog()
            .range([0, vis.width]);

        vis.y = d3.scaleLog()
            .range([vis.height,0]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .tickFormat(d3.format(","))
            .tickSize(10)
            .ticks(10);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y)
            .tickFormat(d3.format(","))
            .tickSize(10)
            .ticks(10);

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + 10 + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .attr("transform", "translate(-10, 0)");

        // X axis title
        vis.svg.append("text")
            .attr("x", vis.width)
            .attr("y", vis.height - 10)
            .attr("text-anchor", "end")
            .attr("font-size", 13)
            .text("Weight (lb)");

        // Y axis title
        vis.svg.append("text")
            .attr("transform", "rotate(90)")
            .attr("y", 0)
            .attr("font-size", 13)
            .text("Height (in)");

        // (Filter, aggregate, modify data)
        vis.wrangleData();

    }

    wrangleData() {
        let vis = this;

        // Get selected gender
        vis.sex = d3.select("#gender").property("value")
        vis.displayData = vis.data.filter(x => {return x.Sex == vis.sex})

        // Update domains
        vis.x.domain(d3.extent(vis.displayData.map(x => +x.Weight)));
        vis.y.domain(d3.extent(vis.displayData.map(x => +x.Height)));

        // Call axis function with the new domain
        vis.svg.select(".x-axis").call(vis.xAxis);
        vis.svg.select(".y-axis").call(vis.yAxis);

        // Scale for radius of circles
        vis.radius = d3.scaleSqrt()
            .range([2, 6])
            .domain([1, 50])

        // Record height/weight frequencies for all athletes
        vis.allHeightWeightData = {};
        vis.displayData.map(x => {
            vis.allHeightWeightData[`${~~x.Weight}, ${~~x.Height}`] = (vis.allHeightWeightData[`${~~x.Weight}, ${~~x.Height}`] || 0) + 1
        })

        vis.dots = vis.svg.selectAll(".all-height-weight-dot")
            .data(Object.entries(vis.allHeightWeightData))

        vis.dots.enter().append("circle")
            .merge(vis.dots)
            .attr("class", 'all-height-weight-dot')
            .attr("cx", d => vis.x(d[0].split(", ")[0]))
            .attr("cy", d => vis.y(d[0].split(", ")[1]))
            .attr("r", d => vis.radius(d[1]))
            .style("opacity", .1)
            .attr("fill", "grey")

        vis.dots.exit().remove();

        vis.svg.selectAll(".height-weight-dot").remove();


    }

    highlightVis(sport) {
        let vis = this;

        // Get currently selected sex
        vis.sex = d3.select("#gender").property("value")

        // Record frequency of athlete ages
        vis.heightWeightData = {};

        vis.displayData.map(x => {
            if (x.Sport == sport) {
                vis.heightWeightData[`${~~x.Weight}, ${~~x.Height}`] = (vis.heightWeightData[`${~~x.Weight}, ${~~x.Height}`] || 0) + 1
            }
        })

        vis.heightWeight = vis.svg.selectAll(".height-weight-dot")
            .data(Object.entries(vis.heightWeightData))

        vis.heightWeight.enter().append("circle")
            .merge(vis.heightWeight)
            .attr("class", "height-weight-dot")
            .attr("cx", d => vis.x(d[0].split(", ")[0]))
            .attr("cy", d => vis.y(d[0].split(", ")[1]))
            .attr("r", d => vis.radius(d[1]))
            .attr("fill", d => {
                if (vis.sex == "F") {
                    return "orange"
                } else {
                    return "green"
                }
            })

        vis.heightWeight.exit().remove();



    }


}