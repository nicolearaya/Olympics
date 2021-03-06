class IncomeVis {

    constructor(parentElement, geoData, cityData, homeData, incomeData) {
        this.parentElement = parentElement;
        this.geoData = geoData;
        this.cityData = cityData;
        this.homeData = homeData;
        this.incomeData = incomeData;
        this.displayData = [];

        this.initVis()
    }

    initVis() {
        let vis = this;

        //margin conventions, title, tooltip, legend, and scales
        vis.margin = {top: 10, right: 20, bottom: 3, left: 10};
        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate(${vis.margin.left/2}, 0)`);

        vis.projection = d3.geoAlbersUsa();
        vis.path = d3.geoPath().projection(vis.projection);

        vis.county = topojson.feature(vis.geoData, vis.geoData.objects.counties).features;
        vis.state = topojson.feature(vis.geoData, vis.geoData.objects.states).features;

        vis.viewpoint = {'width': 975, 'height': 610};
        vis.zoom = (vis.width) / vis.viewpoint.width;

        // draw counties
        vis.counties = vis.svg.append("g")
            .attr("class", "counties")
            .selectAll("path")
            .data(vis.county)
            .enter().append("path")
            .attr("d", vis.path)
            .attr("fill", "#C7C7C7")
            .attr("transform", `scale(${vis.zoom} ${vis.zoom})`);

        // draw borders
        vis.svg.append("path")
            .datum(topojson.mesh(vis.geoData, vis.geoData.objects.states, function(a, b) { return a !== b; }))
            .attr("class", "county-borders")
            .style("stroke", "white")
            .style("fill", "transparent")
            .attr("d", vis.path)
            .attr("transform", `scale(${vis.zoom} ${vis.zoom})`);

        // add city points
        vis.cities = vis.svg.selectAll(".cities")
            .data(vis.cityData)
            .enter()
            .append("circle")
            .attr("class", "cities")
            .attr("cx", d=> vis.projection(d.geometry.coordinates)[0])
            .attr("cy", d=> vis.projection(d.geometry.coordinates)[1])
            .attr("r", 3)
            .attr("fill", d => {
                console.log(d.properties.Season)
                if (d.properties.Season == "Summer"){
                    return "#ee2f4d"
                }
                else {
                    return "#000000"
                }
            })
            .attr("transform", `scale(${vis.zoom} ${vis.zoom})`);

        // draw states
        vis.states = vis.svg.append("g")
            .selectAll(".states")
            .data(vis.state)
            .enter()
            .append("path")
            .attr("class", "states")
            .attr("d", vis.path)
            .attr("transform", `scale(${vis.zoom} ${vis.zoom})`)
            .style("fill", "transparent");

        // append tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'incomeMapTooltip')

        vis.axis = d3.axisBottom()

        vis.legend = d3.select(".counties").append("g")
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width /1.5}, ${vis.height - 40})`)

        vis.svg.append("text")
            .attr("class", "income-legend-label")
            .attr("transform", `translate(${vis.width /1.5 - 20}, ${vis.height - 50})`)
            .text("2018 US median household income")

        vis.linearGradient = vis.legend.append("linearGradient")
            .attr("id", "linear-gradient");

        vis.linearGradient.append('stop')
            .attr('class', 'stop-left')
            .attr('offset', '0')
            .attr('stop-color','#C7DFFF');

        vis.linearGradient.append('stop')
            .attr('class', 'stop-right')
            .attr('offset', '1')
            .attr('stop-color','#003ea0');

        vis.legend.append("rect")
            .attr("x", 0)
            .attr("width", "160")
            .attr("y", 0)
            .attr("height", "20")
            .attr("fill", "url(#linear-gradient)")

        vis.Xaxis = vis.legend.append("g")
            .attr('transform', `translate(0, 20)`)

        vis.circleLegend = vis.svg.append("g")


        vis.circleLegend.append("rect")
            .attr("x", 20)
            .attr("y", vis.height-50)
            .attr("width", 300)
            .attr("height", 40)
            .attr("rx", "5")
            .attr("fill", "rgba(255,255,255,.15)")

        vis.circleLegend.append("circle")
            .attr("r", 3)
            .attr("cx", 50)
            .attr("cy", vis.height-30)
            .attr("fill", "#ee2f4d")

        vis.circleLegend.append("text")
            .attr("transform", `translate(60, ${vis.height - 30})`)
            .attr("fill", "white")
            .attr("class", "income-plot-label")
            .attr("dominant-baseline", "middle")
            .text("Summer Athlete")

        vis.circleLegend.append("circle")
            .attr("r", 3)
            .attr("cx", 200)
            .attr("cy", vis.height-30)
            .attr("fill", "#000000")

        vis.circleLegend.append("text")
            .attr("transform", `translate(210, ${vis.height - 30})`)
            .attr("fill", "white")
            .attr("class", "income-plot-label")
            .attr("dominant-baseline", "middle")
            .text("Winter Athlete")

        vis.wrangleData()
    }

    wrangleData(){
        let vis = this;

        vis.color = d3.scaleLinear()
            .domain(d3.extent(vis.incomeData, d=>d.ESTIMATE))
            .range(["#C7DFFF", "#003ea0"]);

        let displayData = vis.homeData;

        // prepare hometown data by grouping all rows by state
        let athleteDataByState = Array.from(d3.group(displayData, d =>d.State), ([key, value]) => ({key, value}))

        // have a look
        //console.log(athleteDataByState)

        // init final data structure in which both data sets will be merged into
        vis.stateInfo = []

        // merge
        vis.geoData.objects.states.geometries.forEach( d => {

            //init counters
            let stateName = d.properties["name"];
            let athleteCount = 0;
            let sports = {}

            athleteDataByState.forEach( state => {

                if (nameConverter.getFullName(state.key) === stateName) {
                    // sum up number of athletes for each state
                    state.value.forEach(entry => {
                        athleteCount += 1;

                        if (entry["Sport"] in sports) {
                            sports[entry["Sport"]] += 1;
                        } else {
                            sports[entry["Sport"]] = 1;
                        }
                    });
                }
            })

            // sort the sports for each state by most popular based on number of athletes of each sport
            let topSports = Object.entries(sports).sort(([,a],[,b]) => b- a);

            // populate the final data structure
            vis.stateInfo[stateName] = {
                state: stateName,
                athleteCount: athleteCount,
                topSports: topSports.slice(0,5)
            }

        })


        vis.updateVis()
    }


    updateVis(){
        let vis = this;

        let selected = $("#toggleIncomeMap").val();
        if (selected === "On") {

            // display legend
            vis.legend.attr("display", "null");
            vis.Xaxis.attr("display", "null");
            vis.svg.select(".income-legend-label").attr("display", "null");

            vis.counties
                .attr("fill", function(d) {
                    let result = vis.incomeData.find(obj => {
                        return obj.GEOID === d.id
                    })
                    if (result){
                        return vis.color(result.ESTIMATE)
                    }
                    else {
                        return "#CCCCCC"
                    }
                })
                .attr("opacity", 1)

            //update legend scale
            vis.legendScale = d3.scaleLinear()
                .domain(d3.extent(vis.incomeData, d=>d.ESTIMATE))
                .range([0,160])

            //update legend axis
            vis.axis
                .scale(vis.legendScale)
                .tickValues([d3.min(vis.incomeData, d=>d.ESTIMATE), d3.max(vis.incomeData, d=>d.ESTIMATE)])
                .tickFormat(x => {return "$" + d3.format(",.0f")(x)});

            vis.Xaxis.call(vis.axis)
        } else {
            vis.counties
                .attr("fill", "#6389ba")
                .attr("opacity", 0.7);

            // hide legend
            vis.legend.attr("display", "none");
            vis.Xaxis.attr("display", "none");
            vis.svg.select(".income-legend-label").attr("display", "none");
        }

        let toggleSeason = $("#toggleIncomeSeason").val();
        console.log(toggleSeason)
        if (toggleSeason === "Both") {
            d3.selectAll(".cities")
                .attr("visibility", "visible")
        }
        else if (toggleSeason === "Summer") {
            d3.selectAll(".cities")
                .attr("visibility", d => {
                    console.log(d)
                    if (d.properties.Season == "Summer") {
                        return "visible"
                    }
                    else {
                        return "hidden"
                    }
                })
        }
        else if (toggleSeason === "Winter"){
            d3.selectAll(".cities")
                .attr("visibility", d => {
                    console.log(d)
                    if (d.properties.Season == "Winter") {
                        return "visible"
                    } else {
                        return "hidden"
                    }
                })
        }
        else {
            d3.selectAll(".cities")
                .attr("visibility", "hidden")
        }

        // get name of top sports
        function insertSport (d) {
            let output = ``;
            let unit = "athletes";
            vis.stateInfo[d.properties.name].topSports.forEach(sport => {
                if (sport[1] === 1) {
                    unit = "athlete"
                }
                output += `<h6>${sport[0]}: ${sport[1]} ${unit}</h6>`
            })
            return output
        }

        vis.states
            .on("mouseover", function(event, d) {

                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                     <div class="text-light">
                         <h5 id="income-map-tooltip-title">${d.properties.name}<h3>
                         <h6>Total number of athletes: ${vis.stateInfo[d.properties.name].athleteCount}</h6>
                         <h6><u>Top Sports:</u></h6>
                         ${insertSport(d)}
                     </div>`)
            })
            .on("mouseout", function(event, d){

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            });
    }
}