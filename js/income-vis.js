class IncomeVis {

    constructor(parentElement, geoData, incomeData) {
        this.parentElement = parentElement;
        this.geoData = geoData
        this.incomeData = incomeData;
        this.displayData = [];

        this.initVis()
    }

    initVis() {
        let vis = this;

        console.log(d3.min(vis.incomeData, d=>d.ESTIMATE))
        //margin conventions, title, tooltip, legend, and scales
        vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;
        console.log(vis.width, vis.margin.left)
        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left/2}, ${vis.margin.top})`);

        vis.path = d3.geoPath();

        vis.USA = topojson.feature(vis.geoData, vis.geoData.objects.counties).features;

        vis.viewpoint = {'width': 975, 'height': 610};
        vis.zoom = (vis.width) / vis.viewpoint.width;

        vis.counties = vis.svg.append("g")
            .attr("class", "counties")
            .selectAll("path")
            .data(vis.USA)
            .enter().append("path")
            .attr("d", vis.path)
            .attr("fill", "#C7C7C7")
            .attr("transform", `scale(${vis.zoom} ${vis.zoom})`);


        vis.svg.append("path")
            .datum(topojson.mesh(vis.geoData, vis.geoData.objects.states, function(a, b) { return a !== b; }))
            .attr("class", "county-borders")
            .style("stroke", "white")
            .style("fill", "transparent")
            .attr("d", vis.path)
            .attr("transform", `scale(${vis.zoom} ${vis.zoom})`);

        // append tooltip
        /*vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'mapTooltip')*/

        vis.axis = d3.axisBottom()

        vis.legend = d3.select(".counties").append("g")
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width /2 - 80}, ${vis.height - 100})`)

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


        vis.updateVis()
    }


    updateVis(){
        let vis = this;
        console.log(vis.incomeData)

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

    }
}

