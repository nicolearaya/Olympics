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
        vis.margin = {top: 30, right: 20, bottom: 20, left: 20};
        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left/2}, 0)`);

        vis.projection = d3.geoAlbersUsa();
        vis.path = d3.geoPath().projection(vis.projection);

        vis.county = topojson.feature(vis.geoData, vis.geoData.objects.counties).features;
        vis.state = topojson.feature(vis.geoData, vis.geoData.objects.states).features;

        vis.viewpoint = {'width': 975, 'height': 610};
        vis.zoom = (vis.width - 100) / vis.viewpoint.width;

        vis.counties = vis.svg.append("g")
            .attr("class", "counties")
            .selectAll("path")
            .data(vis.county)
            .enter().append("path")
            .attr("d", vis.path)
            .attr("fill", "#C7C7C7")
            .attr("transform", `scale(${vis.zoom} ${vis.zoom})`);

        vis.states = vis.svg.append("g")
            .selectAll(".states")
            .data(vis.state)
            .enter()
            .append("path")
            .attr("class", "states")
            .attr("d", vis.path)
            .attr("transform", `scale(${vis.zoom} ${vis.zoom})`)
            .style("fill", "transparent");

        vis.svg.append("path")
            .datum(topojson.mesh(vis.geoData, vis.geoData.objects.states, function(a, b) { return a !== b; }))
            .attr("class", "county-borders")
            .style("stroke", "white")
            .style("fill", "transparent")
            .attr("d", vis.path)
            .attr("transform", `scale(${vis.zoom} ${vis.zoom})`);

        // add city points
        vis.svg.selectAll(".cities")
            .data(vis.cityData)
            .enter()
            .append("circle")
            .attr("class", "cities")
            .attr("cx", d=> vis.projection(d.geometry.coordinates)[0])
            .attr("cy", d=> vis.projection(d.geometry.coordinates)[1])
            .attr("r", 3)
            .attr("transform", `scale(${vis.zoom} ${vis.zoom})`);

        // append tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'incomeMapTooltip')

        vis.axis = d3.axisBottom()

        vis.legend = d3.select(".counties").append("g")
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width /2 - 80}, ${vis.height - 50})`)

        vis.linearGradient = vis.legend.append("linearGradient")
            .attr("id", "linear-gradient");

        vis.linearGradient.append('stop')
            .attr('class', 'stop-left')
            .attr('offset', '0')
            .attr('stop-color','#C7DFFF');

        vis.linearGradient.append('stop')
            .attr('class', 'stop-right')
            .attr('offset', '1')
            .attr('stop-color','#08306B');

        vis.legend.append("rect")
            .attr("x", 0)
            .attr("width", "160")
            .attr("y", 0)
            .attr("height", "20")
            .attr("fill", "url(#linear-gradient)")

        vis.Xaxis = vis.legend.append("g")
            .attr('transform', `translate(0, 20)`)

        vis.wrangleData()
    }

    wrangleData(){
        let vis = this;

        vis.color = d3.scaleLinear()
            .domain(d3.extent(vis.incomeData, d=>d.ESTIMATE))
            .range(["#C7DFFF", "#08306B"]);

        let displayData = vis.homeData;

        // prepare hometown data by grouping all rows by state
        let athleteDataByState = Array.from(d3.group(displayData, d =>d.State), ([key, value]) => ({key, value}))

        // have a look
        console.log(athleteDataByState)

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

        //update legend scale
        vis.legendScale = d3.scaleLinear()
            .domain(d3.extent(vis.incomeData, d=>d.ESTIMATE))
            .range([0,160])

        //update legend axis
        vis.axis
            .scale(vis.legendScale)
            .tickValues([d3.min(vis.incomeData, d=>d.ESTIMATE), d3.max(vis.incomeData, d=>d.ESTIMATE)])

        vis.Xaxis.call(vis.axis)

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
                     <div>
                         <h5>${d.properties.name}<h3>
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

