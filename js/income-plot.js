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
            .text("Athlete Hometown County Median Household Income");

        vis.yAxisg = vis.visArea.append("g")
            .attr("transform",
                "translate(" + 20 + " ," +
                vis.height/2 + ")")

        vis.yAxisg.append("text")
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .text("Number of Athletes");

        //show baseline median incomes for comparison
        vis.medIncome2016 = vis.visArea.append("line")
            .attr("x1", vis.x(5.7617))
            .attr("y1", -20)
            .attr("x2", vis.x(5.7617))
            .attr("y2", vis.height-50)
            .attr("stroke-width", "1.5")
            .attr("stroke", "green")
            .attr("opacity", ".5")
            .style("visibility", "hidden");
        //
        vis.baseline = d3.select("#baseline").append("text")
            .attr("y","0")
            .attr("x",vis.x(5.7617))
            .text("2018 Median Household Income: $63,179")
            .style("text-anchor", "middle")
            .style("visibility", "hidden")


        vis.medIncome2018 = vis.visArea.append("line")
            .attr("x1", vis.x(6.318))
            .attr("y1", -20)
            .attr("x2", vis.x(6.318))
            .attr("y2", vis.height-50)
            .attr("stroke-width", "1.5")
            .attr("stroke", "steelblue")
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
            .attr("stroke", "steelblue")
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
            .attr("fill", "steelblue")
            .style("opacity", ".7")
            .style("visibility", "visible");

        vis.wintDot
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("stroke-width", "1px")
                    .attr("stroke", "black")
                vis.medIncome2018
                    .style("visibility", "visible")
                vis.baseline
                    .attr("y","0")
                    .attr("x",(vis.x(6.318)-100))
                    .text("2018 Median Household Income: $63,179")
                    .style("text-anchor", "middle")
                    .style("visibility", "visible")
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                     <div style="border: thin solid #d0cccc; border-radius: 5px; background: #D0CCCC; padding: 10px">
                         <h5>Income: $${d.bracket} per year<h3>
                         <h6>Number of Winter Athletes: ${d.winter}</h6> 
                        
                     </div>`)
            })
            .on("mouseout", function(event, d){
                d3.select(this)
                    .attr('stroke-width', "0px")
                vis.medIncome2018
                    .style("visibility", "hidden")
                vis.baseline
                    .style("visibility", "hidden")
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
                    .attr("stroke", "black")
                vis.medIncome2016
                    .style("visibility", "visible");
                vis.baseline
                    .attr("x",(vis.x(5.7617)))
                    .text("2016 Median Household Income: $57,617")
                    .style("text-anchor", "middle")
                    .style("visibility", "visible");
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                     <div style="border: thin solid #d0cccc; border-radius: 5px; background: #D0CCCC; padding: 10px">
                         <h5>Income: $${d.bracket} per year<h3>
                         <h6>Number of Summer Athletes: ${d.summer}</h6> 
                        
                     </div>`)
            })
            .on("mouseout", function(event, d){
                d3.select(this)
                    .attr('stroke-width', "0px")
                vis.medIncome2016
                    .style("visibility", "hidden")
                vis.baseline
                    .style("visibility", "hidden")
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);

            })


        vis.legend = vis.svg.append("g")
            .attr("transform",
                "translate(" + (vis.width-80) + " ," +
                20 + ")");

        vis.legend.append("rect")
            .attr("x","0")
            .attr("y", "0")
            .attr("rx", "2")
            .attr("ry", "2")
            .attr("width", "119")
            .attr("height", "80")
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
            .attr("fill", "steelblue")
            .style("opacity", ".7");

        //legend text
        vis.legend.append("text")
            .attr("x",35)
            .attr("y",20)
            .attr("alignment-baseline", "central")
            .text("Summer");

        vis.legend.append("text")
            .attr("x",35)
            .attr("y",60)
            .attr("alignment-baseline", "central")
            .text("Winter");

        vis.legend
            .append("foreignObject")
            .attr('x', 15)
            .attr('y',  15)
            .attr('width', 30)
            .attr('height', 20)
            .append("xhtml:tree")

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
            vis.wintLine
                .transition()
                .duration(800)
                .style("opacity","0");
            d3.selectAll(".dot-wint")
                .transition()
                .duration(800)
                .style("opacity","0");
            vis.sumLine
                .transition()
                .duration(800)
                .style("opacity","1");
            d3.selectAll(".dot-sum")
                .transition()
                .duration(800)
                .style("opacity","0.7")
        }
        if (selectValue === "Winter"){
            vis.sumLine
                .transition()
                .duration(800)
                .style("opacity","0");
            d3.selectAll(".dot-sum")
                .transition()
                .duration(800)
                .style("opacity","0")
            vis.wintLine
                .transition()
                .duration(800)
                .style("opacity","1");
            d3.selectAll(".dot-wint")
                .transition()
                .duration(800)
                .style("opacity","0.7")
        }
        if (selectValue === "Both"){
            vis.sumLine
                .transition()
                .duration(800)
                .style("opacity","1");
            d3.selectAll(".dot-sum")
                .transition()
                .duration(800)
                .style("opacity","0.7")
            vis.wintLine
                .transition()
                .duration(800)
                .style("opacity","1");
            d3.selectAll(".dot-wint")
                .transition()
                .duration(800)
                .style("opacity","0.7")
        }
    }
}

