class IncomePlot {

    constructor(parentElement, incomeData) {
        this.parentElement = parentElement;
        this.data = incomeData;
        this.initVis()
    }

    initVis() {
        let vis = this;

        //margin conventions
        vis.margin = {top: 20, right: 20, bottom: 50, left: 20};
        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;
        // init drawing area
        vis.brackets = ["0", "0-10k", "10-20k", "20-30k", "30-40k", "40-50k", "50-60k", "60-70k", "70-80k", "80-90k", "90-100k", "100-110k", "110-120k", "120-130k", "130-140k", "140-150k", "150-160k"]
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.right + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom);

        vis.visArea = vis.svg.append("g")
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`)


        //Add tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .attr("id", "incomeChartTip");

        vis.x = d3.scaleLinear()
            .domain([0,16])
            .range([ 0, vis.width ]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .ticks(17)
            .tickFormat((d,i) => vis.brackets[i])

        vis.visArea.append("g")
            .attr("transform", "translate(0," + (vis.height - 50) + ")")
            .call(vis.xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // Add Y axis
        vis.y = d3.scaleLinear()
            .domain([0, d3.max(vis.data, d => d.summer )])
            .range([ vis.height - 50, 0 ]);
        vis.visArea.append("g")
            .call(d3.axisLeft(vis.y));
        //y axis label

        vis.xlabel = vis.svg.append("text")
            .attr("transform",
                "translate(" + (vis.width/2) + " ," +
                (vis.height+35) + ")")
            .style("text-anchor", "middle")
            .attr("class", "chart-titles")
            .text("Athlete County Median Household Income");

        vis.yAxisg = vis.visArea.append("g")
            .attr("transform",
                "translate(" + 10 + " ," +
                (100) + ")")

        vis.yAxisg.append("text")
            .attr("transform", "rotate(90)")
            .attr("class", "chart-titles")
            .text("Number of Athletes");

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


        vis.displayTextGroup = vis.visArea.append("g")
            .attr("transform",
                "translate(" + (vis.width/4*3) + " ," +
                (vis.height/4) + ")")


        vis.displayText = vis.displayTextGroup.append("text")


        //show baseline median incomes for comparison
        vis.medIncome2016 = vis.visArea.append("line")
            .attr("x1", vis.x(6))
            .attr("y1", -20)
            .attr("x2", vis.x(6))
            .attr("y2", vis.height-50)
            .attr("stroke-width", "1.5")
            .attr("stroke", "green")
            .attr("opacity", ".5")
            .style("visibility", "hidden");
        //
        vis.baseline = d3.select("#baseline").append("text")
            .attr("y","0")
            .attr("x",vis.x(6))
            .text("2018 Median Household Income: $63,179")
            .style("text-anchor", "middle")
            .style("visibility", "hidden")


        vis.medIncome2018 = vis.visArea.append("line")
            .attr("x1", vis.x(7))
            .attr("y1", -20)
            .attr("x2", vis.x(7))
            .attr("y2", vis.height-50)
            .attr("stroke-width", "1.5")
            .attr("stroke", "blue")
            .attr("opacity", ".5")
            .style("visibility", "hidden");

        // Add the line
        vis.sumLine = vis.visArea.append("path")
            .datum(vis.data)
            .attr("fill", "none")
            .attr("stroke", "green")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(function(d) { return vis.x(d.incomeBracket) })
                .y(function(d) { return vis.y(d.summer) })
            )
            .style("visibility", "visible");

        vis.wintLine = vis.visArea.append("path")
            .datum(vis.data)
            .attr("fill", "none")
            .attr("stroke", "blue")
            .attr("id", "wintLine")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(function(d) { return vis.x(d.incomeBracket) })
                .y(function(d) { return vis.y(d.winter) })
            )
            .style("visibility", "visible")

        vis.wintDot = vis.visArea.selectAll(".dot-wint")
            .data(vis.data)
            .enter()
            .append("circle")
            .attr("class", "dot-wint")
            .attr("r", 5)
            .attr("cx", function(d){
                return vis.x(d.incomeBracket);
            })
            .attr("cy", function(d){
                return vis.y(d.winter);
            })
            .attr("fill", "blue")
            .style("opacity", ".7")
            .style("visibility", "visible");

        vis.wintDot
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("stroke-width", "1px")
                    .attr("stroke", "white")
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                     <div>
                         <h5>Income: $${d.bracket} per year<h3>
                         <h6>Number of Winter Athletes: ${d.winter}</h6> 
                        
                     </div>`)
            })
            .on("mouseout", function(event, d){
                d3.select(this)
                    .attr('stroke-width', "0px")
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            });



        vis.sumDot = vis.visArea.selectAll(".dot-sum")
            .data(vis.data)
            .enter()
            .append("circle")
            .attr("class", "dot-sum")
            .attr("r", 5)
            .attr("cx", function(d){
                return vis.x(d.incomeBracket);
            })
            .attr("cy", function(d){
                return vis.y(d.summer);
            })
            .attr("fill", "green")
            .style("opacity", ".7");

        vis.sumDot
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("stroke-width", "1px")
                    .attr("stroke", "white")
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                     <div>
                         <h5>Income: $${d.bracket} per year<h3>
                         <h6>Number of Summer Athletes: ${d.summer}</h6> 
                     </div>`)
            })
            .on("mouseout", function(event, d){
                d3.select(this)
                    .attr('stroke-width', "0px")
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);

            })


        //data above the national median:
        vis.summerAbove = [[6,23],[7,94],[8,44],[9,52],[10,35],[11,9],[12,16],[13,2],[14,1],[15,0],[16,0]]
        vis.winterAbove = [[7,49],[8,59],[9,39],[10,10],[11,11],[12,5],[13,2],[14,1],[15,0],[16,0]]

        vis.sumAbove = vis.visArea.append("path")
            .datum(vis.summerAbove)
            .attr("fill", "#9edecf")
            .style("opacity", "0.4")
            .attr("stroke", "green")
            .attr("stroke-width", 1)
            .attr("d", d3.area()
                .x(function(d) { return vis.x(d[0]) })
                .y0(vis.height-50)
                .y1(function(d) { return vis.y(d[1]) })

            )
            .style("visibility", "visible");

        vis.wintAbove = vis.visArea.append("path")
            .datum(vis.winterAbove)
            .attr("fill", "#9eacde")
            .style("opacity", "0.4")
            .attr("stroke", "blue")
            .attr("stroke-width", 1)
            .attr("d", d3.area()
                .x(function(d) { return vis.x(d[0]) })
                .y0(vis.height-50)
                .y1(function(d) { return vis.y(d[1]) })

            )
            .style("visibility", "visible");

        //text displaying data about median income
        vis.wintAbove
            .on("mouseover", function(event, d) {
                d3.select(this).moveToFront();
                d3.select(this)
                    .attr("stroke-width", "1.5")
                    .attr("stroke", "white")
                    .attr("opacity", "1")
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                     <div>
                         <h5>Winter Athletes Above National Median Household Income:<h3>
                         <h6>179 Winter Athletes</h6>
                         <h6>Percent of Total Winter Athletes: 65%</h6>
                         <h6>2018 Median Household Income: $63,179</h6> 
                     </div>`)

            })
            .on("mouseout", function(event, d){
                d3.select(this)
                    .attr("stroke", "blue")
                    .attr("stroke-width", 1)
                d3.select(".dot-wint")
                    .moveToFront()
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            });


        vis.sumAbove
            .on("mouseover", function(event, d) {
                d3.select(this).moveToFront();
                d3.select(this)
                    .attr("stroke-width", "1.5")
                    .attr("stroke", "white")
                    .attr("opacity", "1")
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                     <div>
                         <h5>Summer Athletes Above National Median Household Income:<h3>
                         <h6>276 Summer Athletes</h6>
                         <h6>Percent of Total Summer Athletes: 67%</h6>
                         <h6>2016 Median Household Income: $57,617</h6> 
                     </div>`)

            })
            .on("mouseout", function(event, d){
                d3.select(this)
                    .attr("stroke", "green")
                    .attr("stroke-width", 1)
                d3.select(this).moveToBack();
                d3.select(".dot-sum")
                    .moveToFront()
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            });

        vis.legend = vis.svg.append("g")
            .attr("transform",
                "translate(" + (vis.width-100) + " ," +
                20 + ")");

        vis.legend.append("rect")
            .attr("x","0")
            .attr("y", "0")
            .attr("rx", "2")
            .attr("ry", "2")
            .attr("width", "139")
            .attr("height", "190")
            .attr("stroke", "#777777")
            .attr("fill", "transparent")

        //legend circles
        vis.legend
            .append("circle")
            .attr("r",5)
            .attr("cx",20)
            .attr("cy",20)
            .attr("fill", "green")
            .style("opacity", ".7");
        vis.legend
            .append("circle")
            .attr("r", 5)
            .attr("cx", 20)
            .attr("cy",60)
            .attr("fill", "blue")
            .style("opacity", ".7");

        vis.legend
            .append("rect")
            .attr("x",15)
            .attr("y",100)
            .attr("width",10)
            .attr("height",10)
            .attr("fill", "#9edecf")
            .style("opacity", "0.6");
        vis.legend
            .append("rect")
            .attr("x", 15)
            .attr("y",150)
            .attr("width",10)
            .attr("height",10)
            .attr("fill", "#9eacde")
            .style("opacity", "0.6");

        //legend text
        vis.legend.append("text")
            .attr("x",35)
            .attr("y",20)
            .attr("alignment-baseline", "central")
            .attr("class", "income-plot-label")
            .text("Summer 2016");

        vis.legend.append("text")
            .attr("x",35)
            .attr("y",60)
            .attr("alignment-baseline", "central")
            .attr("class", "income-plot-label")
            .text("Winter 2018");

        //legend text
        vis.legend.append("text")
            .attr("x",35)
            .attr("y",97)
            .append("tspan")
            .attr("dy","0em")
            .attr("class", "income-plot-label")
            .text("Above National")
            .append("tspan")
            .attr("x",35)
            .attr("dy","1em")
            .attr("class", "income-plot-label")
            .text("Median Income")
            .append("tspan")
            .attr("x",35)
            .attr("dy","1em")
            .attr("class", "income-plot-label")
            .text("(Summer)");


        vis.legend.append("text")
            .attr("x",35)
            .attr("y",147)
            .append("tspan")
            .attr("dy","0em")
            .attr("class", "income-plot-label")
            .text("Above National")
            .append("tspan")
            .attr("x",35)
            .attr("dy","1em")
            .attr("class", "income-plot-label")
            .text("Median Income")
            .append("tspan")
            .attr("x",35)
            .attr("dy","1em")
            .attr("class", "income-plot-label")
            .text("(Winter)");


        vis.wrangleData()
    }

    wrangleData(){
        let vis = this;

        vis.updateVis()
    }
    updateVis(){
        let vis = this;
        let selectValue = $("#toggleIncomePlot").val();
        if (selectValue === "Summer"){
            //disable winter
            vis.wintLine
                .transition()
                .duration(800)
                .style("opacity","0")
                .transition()
                .delay(800)
                .style("visibility","hidden");
            vis.wintAbove
                .transition()
                .duration(800)
                .style("opacity",0)
                .transition()
                .delay(800)
                .style("visibility","hidden");
            d3.selectAll(".dot-wint")
                .transition()
                .duration(800)
                .style("opacity","0")
                .transition()
                .delay(800)
                .style("visibility","hidden");
            //enable summer
            vis.sumLine
                .transition()
                .duration(800)
                .style("opacity","1")
                .style("visibility","visible");
            vis.sumAbove
                .transition()
                .duration(800)
                .style("opacity",0.5)
                .style("visibility","visible");
            d3.selectAll(".dot-sum")
                .transition()
                .duration(800)
                .style("opacity","1")
                .style("visibility","visible");
        }
        if (selectValue === "Winter"){
            //disable summer
            vis.sumLine
                .transition()
                .duration(800)
                .style("opacity","0")
                .transition()
                .delay(800)
                .style("visibility","hidden");
            vis.sumAbove
                .transition()
                .duration(800)
                .style("opacity",0)
                .transition()
                .delay(800)
                .style("visibility","hidden");
            d3.selectAll(".dot-sum")
                .transition()
                .duration(800)
                .style("opacity","0")
                .transition()
                .delay(800)
                .style("visibility","hidden");

            //enable winter
            vis.wintLine
                .transition()
                .duration(800)
                .style("opacity","1")
                .style("visibility","visible");
            vis.wintAbove
                .transition()
                .duration(800)
                .style("opacity",0.5)
                .style("visibility","visible");
            d3.selectAll(".dot-wint")
                .transition()
                .duration(800)
                .style("opacity","1")
                .style("visibility","visible");
        }
        if (selectValue === "Both"){
            vis.sumLine
                .transition()
                .duration(800)
                .style("opacity","1")
                .style("visibility","visible");
            vis.wintAbove
                .transition()
                .duration(800)
                .style("opacity",0.5)
                .style("visibility","visible");
            vis.sumAbove
                .transition()
                .duration(800)
                .style("opacity",0.5)
                .style("visibility","visible");
            d3.selectAll(".dot-sum")
                .transition()
                .duration(800)
                .style("opacity","0.7")
                .style("visibility","visible");
            vis.wintLine
                .transition()
                .duration(800)
                .style("opacity","1")
                .style("visibility","visible");
            d3.selectAll(".dot-wint")
                .transition()
                .duration(800)
                .style("opacity","0.7")
                .style("visibility","visible");
        }
    }
}

