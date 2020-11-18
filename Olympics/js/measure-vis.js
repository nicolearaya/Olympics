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

        vis.sex = d3.select("#gender").property("value")
        vis.displayData = vis.data.filter(x => {return x.Sex == vis.sex})

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // Update domains
        vis.x.domain(d3.extent(vis.displayData.map(x => x.Weight)));
        vis.y.domain(d3.extent(vis.displayData.map(x => x.Height)));

        // Call axis function with the new domain
        vis.svg.select(".x-axis").call(vis.xAxis);
        vis.svg.select(".y-axis").call(vis.yAxis);

        // Create a list of all of the sports
        vis.sportsList = [...new Set(vis.displayData.map(x => x.Sport))]

        // Create scale for different sports
        vis.colorScale = d3.scaleOrdinal()
            .domain(vis.sportsList)
            .range(['#000000',
                    '#222034',
                    '#45283c',
                    '#663931',
                    '#8f563b',
                    '#df7126',
                    '#d9a066',
                    '#eec39a',
                    '#fbf236',
                    '#99e550',
                    '#6abe30',
                    '#37946e',
                    '#4b692f',
                    '#524b24',
                    '#323c39',
                    '#3f3f74',
                    '#306082',
                    '#5b6ee1',
                    '#639bff',
                    '#5fcde4',
                    '#cbdbfc',
                    '#dbdbdb',
                    '#9badb7',
                    '#847e87',
                    '#696a6a',
                    '#595652',
                    '#76428a',
                    '#ac3232',
                    '#d95763',
                    '#d77bba',
                    '#8f974a',
                    '#8a6f30']);

        // function for mouseover
        let mouseOver = function(e, d) {
            d3.selectAll(".dot")
                .transition()
                .duration(200)
                .style("opacity", .1)
            d3.selectAll(`.dot.${d.Sport.replace(/ /g,'')}`)
                .transition()
                .duration(200)
                .style("opacity", 1)
                .style("stroke-width", 3)
                .style("stroke", "black")
        }

        let mouseLeave = function(e) {
            d3.selectAll(`.dot`)
                .transition()
                .duration(200)
                .style("stroke", "transparent")
                .style("opacity", .8)
        }

        vis.dots = vis.svg.selectAll(".dot")
            .data(vis.displayData)

        vis.dots.enter().append("circle")
            .merge(vis.dots)
            .attr("class", d => `dot ${d.Sport.replace(/ /g,'')}`)
            .attr("cx", d => vis.x(d.Weight))
            .attr("cy", d => vis.y(d.Height))
            .attr("r", 4)
            .attr("fill", d => {return vis.colorScale(d.Sport)})
            .on("mouseover", mouseOver)
            .on("mouseout", mouseLeave)

        vis.dots.exit().remove();

    }


}