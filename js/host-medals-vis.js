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
        vis.years = [1964,1968,1972,1976,1980,1984,1988,1992,1996,2000,2004,2008,2012,2016]

        //chart area
        vis.chartArea = vis.svg.append("g")
            .attr("transform", "translate(0,10)")

        //x scale
        vis.x = d3.scaleLinear()
            .domain([0,13])
            .range([0, (vis.width)]);

        //x scale
        vis.x2 = d3.scaleLinear()
            .domain([1964,2016])
            .range([0, (vis.width)]);

        //x axis
        vis.xAxis = d3.axisBottom()
            .scale(vis.x2)
            .tickFormat(d3.format("d"))
            //.tickFormat((d,i) => vis.years[i])

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


        //color scale
        vis.color = d3.scaleLinear()
            .domain([0,15])
            .range(["#3c6dff", "#000a40"]);

        vis.svgLegend = d3.select("#hostVisLegend").append("svg")
            .attr("width", $("#hostVisLegend").width())
            .attr("height", $("#hostVisLegend").height());

        //legend group
        vis.legend = vis.svgLegend.append("g")
            .attr("transform",
                "translate(5,5)");



        //legend circles
        vis.legend
            .append("circle")
            .attr("r", 4)
            .attr("cx", 10)
            .attr("cy",10)
            .style("fill", "#3c8eff")
            .style("stroke-width", "0.5")
            .style("stroke", "black");

        //legend text
        vis.legend.append("text")
            .attr("x",25)
            .attr("y",10)
            .attr("alignment-baseline", "central")
            .attr("font-size", 13)
            .text("Host Year, Cost under 5 billion USD");


        //legend circles
        vis.legend
            .append("circle")
            .attr("r", 4)
            .attr("cx", 10)
            .attr("cy", 35)
            .style("fill", "#000a40")
            .style("stroke-width", "0.5")
            .style("stroke", "black");

        //legend text
        vis.legend.append("text")
            .attr("x",25)
            .attr("y",35)
            .attr("alignment-baseline", "central")
            .attr("font-size", 13)
            .text("Host Year, Cost over 5 billion USD");

        vis.legendLine = vis.legend.append("g")
            .attr("transform",
                "translate(" + ($("#hostVisLegend").width()-280) + " ," +
                (10) + ")")


        vis.legendLine.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 50)
            .attr("y2", 0)
            .attr("stroke", "black")
            .attr("stroke-width", "2")
            .style("opacity", "0.5")

        vis.legendLine.append("text")
            .attr("x",60)
            .attr("y",0)
            .attr("alignment-baseline", "central")
            .attr("font-size", 13)
            .text("Peak Medals During Host Year");


        vis.legendLine.append("line")
            .attr("x1", 0)
            .attr("y1", 25)
            .attr("x2", 50)
            .attr("y2", 25)
            .attr("stroke", "#dddddd")
            .attr("stroke-width", "2")

        vis.legendLine.append("text")
            .attr("x",60)
            .attr("y",25)
            .attr("alignment-baseline", "central")
            .attr("font-size", 13)
            .text("Peak Medals Not During Host Year");

        vis.wrangleData()
    }

    wrangleData(){
        let vis = this;

        vis.peaks = ["Russia", "United-States", "China", "Australia", "Spain", "Greece", "Brazil"];

        //this will be the array of countries
        vis.countryArray = []
        vis.i = -1
        //country win data
        vis.data.forEach( obj => {
            let array = Object.entries(obj)
            //the last entry is the name of the country
            var str = array.pop()[1];
            str = str.replace(/\s+/g, '-')
            vis.countryArray.push(str)
            vis.i += 1
            // Removing element with zero  value from the array
            for (var i = 0; i < array.length; i++) {
                if (array[i][1] === 0) {
                    array.splice(i, 1);
                }
            }
            array.forEach( d => {
                //convert string year to int
                d[0] = +d[0]
                }
            )
            vis.line = vis.chartArea
                .append("path")
                .datum(array)
                .attr("fill", "none")
                .attr("stroke",  (d,i) => {
                    if (vis.peaks.includes(vis.countryArray[vis.i])) {
                        return "#000000";
                    }
                    else {
                        return "#bbbbbb";
                    }
                })
                .attr("class", "hostVis")
                .attr("stroke-width", 2)
                .attr("id", vis.countryArray[vis.i]);
            vis.line
                .attr("d", d3.line()
                    .x(function(d,i) {
                        return vis.x2(d[0])+30 })
                    .y(function(d) {
                        return vis.y(d[1])
                    })
                )
                .style("opacity", 0.5);
        })


        //draw dots
        vis.hostDot = vis.chartArea.selectAll(".host-dot")
            .data(vis.cost)
            .enter()
            .append("circle")
            .attr("class", "host-dot")
            .attr("class", (d,i) => d.country.replace(/\s+/g, '-') +"Dot")
            .attr("r", 4)
            .attr("cx", function(d){
                return vis.x2(d.year)+30;
            })
            .attr("cy", function(d){
                return vis.y(d.medals);
            })
            .attr("fill", d => {
                if (d.cost < 5)
                    return "#3c8eff"
                else {
                    return  "#000a40"
                }
            })
            .attr("stroke-width", "0.5")
            .attr("stroke", "black")

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
                    .attr("stroke", "blue")
                    .attr("stroke-width", "3")
                    .style("opacity", 1)
                d3.selectAll("." + this.id + "Dot")
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
                    .attr("stroke",  (d,i) => {
                        if (vis.peaks.includes(this.id)) {
                            return "#000000";
                        }
                        else {
                            return "#bbbbbb";
                        }
                    })
                    .attr("stroke-width", "2")
                    .style("opacity", 0.5);
                d3.selectAll("." + this.id + "Dot")
                    .attr("stroke", "black")
                    .attr("fill", d => {
                        if (d.cost < 5)
                            return "#3c8eff"
                        else {
                            return  "#000a40"
                        }
                    })
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
                    .attr("stroke", "black")
                    .attr("fill", "red");
                d3.select("#" + d.country.replace(/\s+/g, '-'))
                    .attr("stroke", "blue")
                    .attr("stroke-width", "3")
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
                    .attr("stroke", "black")
                    .attr("fill", d => {
                        if (d.cost < 5)
                            return "#3c8eff"
                        else {
                            return  "#000a40"
                        }
                    })
                d3.select("#" + d.country.replace(/\s+/g, '-'))
                    .attr("stroke",  (d,i) => {
                        if (vis.peaks.includes(vis.countryArray[vis.i])) {
                            return "#000000";
                        }
                        else {
                            return "#bbbbbb";
                        }
                    })
                    .attr("stroke-width", "2")
                    .style("opacity", 0.5);
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);

            })

        vis.updateVis()
    }


    updateVis(){
        let vis = this;

        let selectValue = $("#hostVisSelect").val();
        if (selectValue === "All"){
            d3.selectAll(".hostVis")
                .style("visibility","visible")
            vis.hostDot
                .style("visibility","visible")
        }
        if (selectValue === "United-States"){
            d3.selectAll(".hostVis")
                .style("visibility","hidden")
            d3.select("#United-States")
                .style("visibility","visible")
            vis.hostDot
                .style("visibility","hidden")
            d3.select(".United-StatesDot")
                .style("visibility","visible")
        }
        if (selectValue === "Russia"){
            d3.selectAll(".hostVis")
                .style("visibility","hidden")
            d3.select("#Russia")
                .style("visibility","visible")
            vis.hostDot
                .style("visibility","hidden")
            d3.select(".RussiaDot")
                .style("visibility","visible")
        }
        if (selectValue === "China"){
            d3.selectAll(".hostVis")
                .style("visibility","hidden")
            d3.select("#China")
                .style("visibility","visible")
            vis.hostDot
                .style("visibility","hidden")
            d3.select(".ChinaDot")
                .style("visibility","visible")
        }
        if (selectValue === "Australia"){
            d3.selectAll(".hostVis")
                .style("visibility","hidden")
            d3.select("#Australia")
                .style("visibility","visible")
            vis.hostDot
                .style("visibility","hidden")
            d3.select(".AustraliaDot")
                .style("visibility","visible")
        }
        if (selectValue === "Japan"){
            d3.selectAll(".hostVis")
                .style("visibility","hidden")
            d3.select("#Japan")
                .style("visibility","visible")
            vis.hostDot
                .style("visibility","hidden")
            d3.select(".JapanDot")
                .style("visibility","visible")
        }
        if (selectValue === "Greece"){
            d3.selectAll(".hostVis")
                .style("visibility","hidden")
            d3.select("#Greece")
                .style("visibility","visible")
            vis.hostDot
                .style("visibility","hidden")
            d3.select(".GreeceDot")
                .style("visibility","visible")
        }
        if (selectValue === "Brazil"){
            d3.selectAll(".hostVis")
                .style("visibility","hidden")
            d3.select("#Brazil")
                .style("visibility","visible")
            vis.hostDot
                .style("visibility","hidden")
            d3.select(".BrazilDot")
                .style("visibility","visible")
        }
        if (selectValue === "Spain"){
            d3.selectAll(".hostVis")
                .style("visibility","hidden")
            d3.select("#Spain")
                .style("visibility","visible")
            vis.hostDot
                .style("visibility","hidden")
            d3.select(".SpainDot")
                .style("visibility","visible")
        }
        if (selectValue === "Germany"){
            d3.selectAll(".hostVis")
                .style("visibility","hidden")
            d3.select("#Germany")
                .style("visibility","visible")
            vis.hostDot
                .style("visibility","hidden")
            d3.select(".GermanyDot")
                .style("visibility","visible")
        }
        if (selectValue === "Canada"){
            d3.selectAll(".hostVis")
                .style("visibility","hidden")
            d3.select("#Canada")
                .style("visibility","visible")
            vis.hostDot
                .style("visibility","hidden")
            d3.select(".CanadaDot")
                .style("visibility","visible")
        }
        if (selectValue === "United-Kingdom"){
            d3.selectAll(".hostVis")
                .style("visibility","hidden")
            d3.select("#United-Kingdom")
                .style("visibility","visible")
            vis.hostDot
                .style("visibility","hidden")
            d3.select(".United-KingdomDot")
                .style("visibility","visible")
        }



    }
}