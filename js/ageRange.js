class AgeRange {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;

        this.initVis()
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
        vis.radius = d3.scaleSqrt()
            .range([4, 10])
            .domain([1, 10])

        vis.x = d3.scaleLinear()
            .range([0, vis.width])
            .domain([15,55]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .tickFormat(d3.format(","))
            .tickSize(10)
            .ticks(10);

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0, 10)");

        vis.svg.select(".x-axis").call(vis.xAxis);


        vis.wrangleData();

    }

    wrangleData() {
        let vis = this;

        // Filter for gender
        vis.sex = d3.select("#gender").property("value")
        vis.displayData = vis.data.filter(x => {return x.Sex == vis.sex})

        // Record ages for all athletes
        vis.allAgeData = {};
        vis.displayData.map(x => {
            vis.allAgeData[x.Age] = (vis.allAgeData[x.Age] || 0) + 1
        })

        // Create dots for all athlete ages
        vis.allAges = vis.svg.selectAll(".all-ages-dots")
            .data(Object.entries(vis.allAgeData))

        vis.allAges.enter().append("circle")
            .merge(vis.allAges)
            .attr("class", 'all-ages-dots')
            .attr("cx", d => vis.x(d[0]))
            .attr("cy", 10)
            .attr("r", d => vis.radius(d[1]))
            .attr("fill", "gray")
            .style("opacity", .1)

        vis.allAges.exit().remove();

        vis.svg.selectAll(".age-dot").remove();


    }

    highlightVis(sport) {
        let vis = this;

        // Get currently selected sex
        vis.sex = d3.select("#gender").property("value")

        // Record frequency of athlete ages
        vis.ageData = {};

        vis.displayData.map(x => {
            if (x.Sport == sport) {
                vis.ageData[x.Age] = (vis.ageData[x.Age] || 0) + 1
            }
        })

        vis.ages = vis.svg.selectAll(".age-dot")
            .data(Object.entries(vis.ageData))

        vis.ages.enter().append("circle")
            .merge(vis.ages)
            .attr("class", "age-dot")
            .attr("cx", d => vis.x(d[0]))
            .attr("cy", 10)
            .attr("r", d => vis.radius(d[1]))
            .attr("stroke", "black")
            .attr("fill", d => {
                if (vis.sex == "F") {
                    return "orange"
                } else {
                    return "green"
                }
            })

        vis.ages.exit().remove();




    }
}