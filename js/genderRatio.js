class GenderRatio {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;

        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = { top: 20, right: 20, bottom: 10, left: 40 };

        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
            vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Scales and axes
        vis.x = d3.scaleLinear()
            .range([0, vis.width])
            .domain([0,1]);

        vis.xAxis = d3.axisTop()
            .scale(vis.x)
            .tickFormat(d3.format(".1"))
            .tickSize(5)
            .ticks(4);

        vis.svg.append("line")
            .attr("class", "gender-line")
            .attr("x1", vis.width / 2)
            .attr("y1", -20)
            .attr("x2", vis.width / 2)
            .attr("y2", 30)

        vis.svg.append('rect')
            .attr("width", vis.width)
            .attr("height", 5)
            .attr("fill", "rgba(255,255,255,.1)")

        vis.wrangleData();

    }

    wrangleData() {
        let vis = this;

        // Get sum of female and male athletes in selected sport
        vis.sportInfo = d3.rollup(vis.data, v => v.length, d => d.Sport, d => d.Sex)

    }

    displayData(sport) {
        let vis = this;

        // Get the data for a particular sport
        vis.genderData = vis.sportInfo.get(sport);

        // Make variables for female/gender athlete count
        vis.femaleCount = vis.sportInfo.get(sport).get("F");
        vis.maleCount = vis.sportInfo.get(sport).get("M");

        if (vis.maleCount == undefined) { vis.maleCount = 0};

        vis.femalePercent = vis.femaleCount / (vis.femaleCount + vis.maleCount);

        vis.svg.selectAll('rect').remove();
        vis.svg.selectAll(".count").remove();

        // Append female count rectangle
        vis.svg.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", vis.x(vis.femalePercent))
            .attr("height", 5)
            .attr("fill", "orange")

        // Append male count rectangle
        vis.svg.append("rect")
            .attr("x", vis.x(vis.femalePercent))
            .attr("y", 0)
            .attr("width", vis.x(1 - vis.femalePercent))
            .attr("height", 5)
            .attr("fill", "green")

        vis.svg.append("text")
            .attr("class", "count")
            .text(vis.femaleCount + " Female Athletes")
            .attr("font-size", 12)
            .attr("y", 24)

        vis.svg.append("text")
            .attr("class", "count")
            .text(vis.maleCount + " Male Athletes")
            .attr("font-size", 12)
            .attr("x", vis.width)
            .attr("y", 24)
            .attr("text-anchor", "end")

    }
}