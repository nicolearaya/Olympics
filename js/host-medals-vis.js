class HostMedalsVis {

    constructor(parentElement, hostWins, hostsCost) {
        this.parentElement = parentElement;
        this.data = hostWins;
        this.cost = hostsCost;

        // parse date method
        this.parseDate = d3.timeParse("%Y");
        this.initVis()
    }

    initVis() {
        let vis = this;


        //margin conventions
        vis.margin = {top: 20, right: 20, bottom: 40, left: 20};
        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;
        // init drawing area

        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom);

        vis.data.forEach( d => {
            d[1964] = +d[1964];
            d[1968] = +d[1968];
            d[1972] = +d[1972];
            d[1976] = +d[1976];
            d[1980] = +d[1980];
            d[1984] = +d[1984];
            d[1988] = +d[1988];
            d[1992] = +d[1992];
            d[1996] = +d[1996];
            d[2000] = +d[2000];
            d[2004] = +d[2004];
            d[2008] = +d[2008];
            d[2012] = +d[2012];
            d[2016] = +d[2016];
        })
        console.log(vis.data)

        vis.years = [1964,1968,1972,1976,1980,1984,1988,1992,1996,2000,2004,2008,2012,2016]

        //chart area
        vis.chartArea = vis.svg.append("g")
            .attr("transform", "translate(0,10)")

        //x scale
        vis.x = d3.scaleLinear()
            .domain([0,13])
            .range([0, (vis.width-40)]);

        //x axis
        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .tickFormat((d,i) => vis.years[i])

        vis.chartArea.append("g")
            .attr("transform", "translate(30," + (vis.height) + ")")
            .call(vis.xAxis);

        //x axis label
        vis.xlabel = vis.chartArea.append("text")
            .attr("transform",
                "translate(" + (vis.width/2) + " ," +
                (vis.height + 40) + ")")
            .style("text-anchor", "middle")
            .attr("font-size", 13)
            .text("Olympic Games Year")


        // y scale
        vis.y = d3.scaleLinear()
            .domain([0, 195])
            .range([ vis.height, 0 ]);

        //y axis
        vis.chartArea.append("g")
            .call(d3.axisLeft(vis.y))
            .attr("transform",
                "translate(" + 30 + " ,0)");

        //y axis label
        vis.chartArea.append("text")
            .attr("transform", "rotate(90)")
            .attr("y", -40)
            .attr("font-size", 13)
            .text("Number of Medals")

        //Add tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .attr("id", "incomeChartTip");

        vis.color = d3.scaleLinear()
            .domain([0,14])
            .range(["#ffcbbe", "#000834"]);

        vis.legend = vis.svg.append("g")
            .attr("transform",
                "translate(" + (vis.width-100) + " ," +
                vis.height/6 + ")");

        vis.legend.append("rect")
            .attr("x","0")
            .attr("y", "0")
            .attr("width", "120")
            .attr("height", "40")
            .attr("stroke", "black")
            .attr("fill", "transparent")

        //legend circles
        vis.legend
            .append("circle")
            .attr("r", 5)
            .attr("cx", 20)
            .attr("cy",20)
            .attr("fill", "steelblue")
            .style("opacity", ".7");

        //legend text

        vis.legend.append("text")
            .attr("x",35)
            .attr("y",20)
            .attr("alignment-baseline", "central")
            .text("Host Year");


        vis.wrangleData()
    }

    wrangleData(){
        let vis = this;
        vis.i = -1
        vis.countryArray = []
        console.log(vis.data)
        //country win data
        vis.data.forEach( obj => {
            //array.push(Object.entries(obj))
            //let names = Object.keys(obj);
            //let values = Object.values(obj);
            //et array =
            let array = Object.entries(obj)
            var str = array.pop()[1];
            str = str.replace(/\s+/g, '-')
            vis.countryArray.push(str)
            vis.i += 1
            vis.line = vis.chartArea
                .append("path")
                .datum(array)
                .attr("fill", "none")
                .attr("stroke",vis.color(vis.i))
                .attr("class", "hostVis")
                .attr("stroke-width", 1.5)
                .attr("id", vis.countryArray[vis.i]);
            vis.line
                .attr("d", d3.line()
                    .x(function(d,i) {
                        return vis.x(i)+30 })
                    .y(function(d) {
                        return vis.y(d[1])
                    })
                    .defined(function(d) { return d[1]; }))

        })

        console.log(vis.countryArray)
        //draw dots
        vis.hostDot = vis.chartArea.selectAll(".host-dot")
            .data(vis.cost)
            .enter()
            .append("circle")
            .attr("class", "host-dot")
            .attr("class", (d,i) => d.country.replace(/\s+/g, '-') +"Dot")
            .attr("r", 4)
            .attr("cx", function(d){
                return vis.x(d.id)+30;
            })
            .attr("cy", function(d){
                return vis.y(d.medals);
            })
            .attr("fill", "steelblue")
        vis.updateVis()
    }


    updateVis(){
        let vis = this;
        d3.selectAll(".hostVis")
            .attr("stroke", "#bbbbbb")
            .style("opacity", 0.7)
        //move to front
        d3.selection.prototype.moveToFront = function() {
            return this.each(function(){
                this.parentNode.appendChild(this);
            });
        };

        //move to back
        d3.selection.prototype.moveToBack = function() {
            return this.each(function() {
                var firstChild = this.parentNode.firstChild;
                if (firstChild) {
                    this.parentNode.insertBefore(this, firstChild);
                }
            });
        };

        d3.selectAll(".hostVis")
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("stroke-width", "1.5px")
                    .attr("stroke", "black")
                    .style("opacity", 1)
                d3.selectAll("." + this.id + "Dot")
                    .attr("stroke-width", "1px")
                    .attr("stroke", "black")
                    .attr("fill", "red")
                d3.select(this).moveToFront();
                d3.selectAll("." + this.id + "Dot").moveToFront();
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY - 40 + "px")
                    .html(`
                            <div style="border: thin solid #d0cccc; border-radius: 5px; background: #D0CCCC; padding: 10px">
                                <h6>Country: ${this.id.replace(/-/g, ' ')} </h6>
                            </div>`)
            })
            .on("mouseout", function(event, d){
                d3.select(this)
                    .attr('stroke', "#bbbbbb")
                    .style("opacity", 0.7);
                d3.selectAll("." + this.id + "Dot")
                    .attr("stroke-width", "0px")
                    .attr("fill", "steelblue")
                d3.select(this).moveToBack();
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            });

        vis.hostDot
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("stroke-width", "1px")
                    .attr("stroke", "black")
                    .attr("fill", "red");
                d3.select("#" + d.country.replace(/\s+/g, '-'))
                    .attr("stroke-width", "1.5px")
                    .attr("stroke", "black")
                    .style("opacity", 1)
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY - 125 + "px")
                    .html(`
                     <div style="border: thin solid #d0cccc; border-radius: 5px; background: #D0CCCC; padding: 10px">
                         <h5>Country: ${d.country}<h5>
                         <h6>Host Year: ${d.year}<h6>
                         <h6>Cost of Hosting ${d.year} Games: ${d.cost} Billion USD<h6>
                         <h6>Number of Medals: ${d.medals}<h6>
                     </h6>`)
            })
            .on("mouseout", function(event, d){
                d3.select(this)
                    .attr('stroke-width', "0px")
                    .attr("fill", "steelblue")
                d3.select("#" + d.country.replace(/\s+/g, '-'))
                    .attr('stroke', "#bbbbbb")
                    .style("opacity", 0.7);
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);

            })
    }
}