class PhysicalVis {
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

        vis.sportInfo = d3.rollups(vis.data, v => {return {"Weight":d3.mean(v, d => d.Weight), "Height":d3.mean(v, d => d.Height), "Age":d3.mean(v, d => d.Age), "Female":d3.count(v, femaleCount)/d3.count(v, d=> 1), "NumAthletes": d3.count(v, d=> 1)}}, d => d.Sport)

        // Draw circles
        vis.rScale = d3.scaleLinear()
            .domain([d3.min(vis.sportInfo, d => d[1]["NumAthletes"]), d3.max(vis.sportInfo, d => d[1]["NumAthletes"])])
            .range([10,75]);

        // Generate colors (Source: http://jnnnnn.github.io/category-colors-constrained.html)
        vis.colors = ["#3957ff", "#d3fe14", "#c9080a", "#fec7f8", "#0b7b3e", "#0bf0e9", "#c203c8", "#fd9b39",
                      "#888593", "#906407", "#98ba7f", "#fe6794", "#10b0ff", "#ac7bff", "#fee7c0", "#964c63",
                      "#1da49c", "#0ad811", "#bbd9fd", "#fe6cfe", "#297192", "#d1a09c", "#78579e", "#81ffad",
                      "#739400", "#ca6949", "#d9bf01", "#646a58", "#d5097e", "#bb73a9", "#ccf6e9", "#9cb4b6"];
        vis.sportColors = vis.sportInfo.map(function (val, i) {
            return [val[0], vis.colors[i]];
        });

        // Init circle nodes at center of the page (Source: https://www.d3-graph-gallery.com/graph/circularpacking_basic.html)
        vis.node = vis.svg.append("g")
            .attr("class", "node")
            .selectAll("circle")
            .data(vis.sportInfo, d=>d[0])
            .enter()
            .append("circle")
            .attr("fill", function(d) {
                for (let i = 0; i < vis.sportColors.length; i++) {
                    if (vis.sportColors[i][0] === d[0]) {
                        return vis.sportColors[i][1];
                    }
                }
            })
            .attr("opacity", 0.5);


        //Add tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .attr("id", "nodeTooltip");

        vis.node
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("stroke-width", "1px")
                    .attr("stroke", "black")

                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                     <div>
                         <h5><strong>${d[0]}</strong><h3>
                         <h6>Avg Age: ${d[1]["Age"].toFixed(1)}</h6> 
                         <h6>Gender Ratio: ${d3.format(".0%")(1 - d[1]["Female"])} M, ${d3.format(".0%")(d[1]["Female"])} F</h6>      
                         <h6>Avg Height: ${displayHeight(d[1]["Height"])}</h6> 
                         <h6>Avg Weight: ${d[1]["Weight"].toFixed(1)} lb</h6>                      
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

        // Add sports labels
        vis.label = vis.svg.append("g")
            .attr("class", "node-labels")
            .selectAll("text")
            .data(vis.sportInfo)
            .enter()
            .append("text")
            .attr("display", d => {
                if (d[1]["NumAthletes"] < 25) {
                    return "none"
                } else {
                    return "null"
                }
            })
            .attr("font-size", d => {
                if (d[1]["NumAthletes"] < 100) {
                    return "8px"
                } else {
                    return "10px"
                }
            });

        // Apply forces to the nodes
        vis.simulation = d3.forceSimulation(vis.sportInfo)
            .force("x", d3.forceX().x((d,i)=> {
                if (i < 10) {
                    return vis.width/3.5
                } else if (i < 20) {
                    return vis.width/2.5
                } else {
                    return vis.width/1.5
                }
            }))
            .force("y", d3.forceY().y(vis.height / 2))
            .force("charge", d3.forceManyBody().strength(3))
            .force("collide", d3.forceCollide().radius(d => vis.rScale(d[1]["NumAthletes"])))

        // Apply forces to the positions
        vis.simulation
            .on("tick", function(d){
                // console.log(d)
                vis.node
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                    .attr("r", d => vis.rScale(d[1]["NumAthletes"]))

                vis.label
                    .attr("x", d => d.x)
                    .attr("y", d => d.y)
                    .text(d => {
                        if (d[0] === "Rugby Sevens") {
                            return "Rugby" //shorten name to fit into node diameter
                        } else {
                            return d[0]
                        }
                    })
            });

        // Add legend
        vis.legendScale = d3.scaleSqrt()
            .domain([d3.min(vis.sportInfo, d => d[1]["NumAthletes"]), d3.max(vis.sportInfo, d => d[1]["NumAthletes"])])
            .range([10,75]);

        vis.legendCircle = vis.svg.append("g")
            .attr("class", "bubble-legend")
            .attr("transform", `translate(${vis.width*.5}, ${vis.height-40}`);

        // vis.legendCircle = circleLegend()
        //     .scale(vis.legendScale)
        //     .tickExtend(15)
        //     // .orient("right")

        // function circleLegend() {
        //     'use strict';
        //
        //     var scale,
        //         orient = 'left',
        //         tickPadding = 3,
        //         tickExtend = 5,
        //         tickArguments_ = [10],
        //         tickValues = null,
        //         tickFormat_,
        //         ε = 1e-6;
        //
        //     function key(selection) {
        //         selection.each(function() {
        //             var g = d3.select(this);
        //
        //             g.attr('class', 'circle-legend');
        //
        //             // Stash a snapshot of the new scale, and retrieve the old snapshot.
        //             var scale0 = this.__chart__ || vis.legendScale,
        //                 scale1 = this.__chart__ = vis.legendScale.copy();
        //
        //             // Ticks, or domain values for ordinal scales.
        //             var ticks = tickValues == null ? (vis.legendScale.ticks ? vis.legendScale.ticks.apply(vis.legendScale, tickArguments_) : vis.legendScale.domain()) : tickValues,
        //                 ticks = ticks.slice().filter(function(d) { return d > 0 }).sort(d3.descending),
        //                 tickFormat = tickFormat_ == null ? (vis.legendScale.tickFormat ? vis.legendScale.tickFormat.apply(vis.legendScale, tickArguments_) : String) : tickFormat_,
        //                 tick = vis.svg.selectAll('.tick').data(ticks, scale1),
        //                 tickEnter = tick.enter().insert('g', '.tick').attr('class', 'tick').style('opacity', ε),
        //                 tickExit = d3.transition(tick.exit()).style('opacity', ε).remove(),
        //                 tickUpdate = d3.transition(tick.order()).style('opacity', 1),
        //                 tickTransform;
        //
        //             tickEnter.each(function(tick) {
        //                 var gg = d3.select(this);
        //
        //                 var tickText = tickFormat(tick);
        //
        //                 if (!tickText) return;
        //
        //                 gg.append('circle')
        //                     .attr('cx', 0)
        //                     .attr('cy', 0)
        //                     .attr('r', vis.legendScale(tick));
        //
        //                 gg.append('line')
        //                     .attr('y1', 0)
        //                     .attr('y2', 0)
        //                     .attr('stroke', '#000')
        //                     .text(tick);
        //
        //                 gg.append('text')
        //                     .attr('dy', '.35em')
        //                     .style('text-anchor', 'left' == orient ? 'end' : 'start')
        //                     .text(tickText);
        //
        //             });
        //             tickEnter.call(d3_svg_legend, scale0);
        //             tickUpdate.call(d3_svg_legend, scale1);
        //             tickExit.call(d3_svg_legend, scale1);
        //
        //             function d3_svg_legend(selection, scale) {
        //                 selection.select('circle')
        //                     .attr('r', scale);
        //
        //                 var x2 = scale(ticks[0]) + tickExtend;
        //                 var sign = 'left' == orient ? -1 : 1;
        //
        //                 selection.select('text')
        //                     .attr('transform', 'translate(' + (x2 + tickPadding) * sign + ', 0)');
        //
        //                 selection.select('line')
        //                     .attr('x1', function(d) { return scale(d) * sign })
        //                     .attr('x2', x2 * sign);
        //
        //                 selection.attr('transform', function(d) { return 'translate(0,' + -scale(d) + ')'; });
        //             }
        //
        //         });
        //     }
        //
        //     key.scale = function(value) {
        //         if (!arguments.length) return vis.legendScale;
        //         vis.legendScale = value;
        //         return key;
        //     };
        //
        //     key.orient = function(value) {
        //         if (!arguments.length) return orient;
        //         orient = value;
        //         return key;
        //     };
        //
        //     key.ticks = function() {
        //         if (!arguments.length) return tickArguments_;
        //         tickArguments_ = arguments;
        //         return key;
        //     };
        //
        //     key.tickFormat = function(x) {
        //         if (!arguments.length) return tickFormat_;
        //         tickFormat_ = x;
        //         return key;
        //     };
        //
        //     key.tickValues = function(x) {
        //         if (!arguments.length) return tickValues;
        //         tickValues = x;
        //         return key;
        //     };
        //
        //     key.tickPadding = function(x) {
        //         if (!arguments.length) return tickPadding;
        //         tickPadding = +x;
        //         return key;
        //     };
        //
        //     key.tickExtend = function(x) {
        //         if (!arguments.length) return tickExtend;
        //         tickExtend = +x;
        //         return key;
        //     };
        //
        //     key.width = function(value) {
        //         if (!arguments.length) return vis.width;
        //         vis.width = value;
        //         return key;
        //     };
        //
        //     key.height = function(value) {
        //         if (!arguments.length) return vis.height;
        //         vis.height = value;
        //         return key;
        //     };
        //
        //     return key;
        // }

    }


    wrangleData() {
        let vis = this;

        // Check user provided inputs for all fields
        let invalid = false;

        $(".userInput").each(function() {
            if ($(this).val() === '') {
                invalid = true
            }
        })

        if (invalid) {
            alert("Input values in all fields before clicking 'Find'");
        } else {
            // Get user input
            vis.user = {};
            let HeightFt;

            $(".userInput").each(function() {
                let type = $(this).attr("id").slice(4,);
                if (type === "HeightFt") {
                    HeightFt = +$(this).val()
                } else {
                    let val = $(this).val();
                    // convert feet and inches input into just inches
                    if (type === "HeightIn") {
                        val = +val + 12 * HeightFt
                        type = "Height"
                    }
                    vis.user[type] = val;
                }
            })

            // Check user's gender against most common gender of athletes for each sport
            let genderMatch;
            vis.sportInfo.forEach(sport => {
                if (sport[1].Female < 0.5 && vis.user.Gender === "Male") {
                    genderMatch = 0
                } else if (sport[1].Female > 0.5 && vis.user.Gender === "Female") {
                    genderMatch = 0
                } else if (sport[1].Female == 0.5) {
                    genderMatch = 0.5
                } else {
                    genderMatch = 1
                }
            })

            // Filter data for gender based on user input
            vis.displayData = vis.data.filter(x => {return x.Sex === vis.user.Gender.charAt(0)})
            vis.filteredInfo = d3.rollups(vis.displayData, v => {return {"Weight":d3.mean(v, d => d.Weight), "Height":d3.mean(v, d => d.Height), "Age":d3.mean(v, d => d.Age), "Female":d3.count(v, femaleCount)/d3.count(v, d=> 1), "NumAthletes": d3.count(v, d=> 1)}}, d => d.Sport)

            // Sum up the difference in value for the user's inputs and the averages of each sport
            let differences = {}
            vis.filteredInfo.forEach(sport => {

                // Check user's physical traits against averages of each sport
                let ageDiff = Math.abs(sport[1].Age - +vis.user.Age)
                let heightDiff = Math.abs(sport[1].Height - +vis.user.Height)
                let weightDiff = Math.abs(sport[1].Weight - +vis.user.Weight)

                differences[sport[0]] = ageDiff + heightDiff + weightDiff + genderMatch;

            })

            // Find sport that matches user's traits the most based on smallest deviation from average values
            let minDiff = Math.min(...Object.values(differences));
            vis.userSport = Object.keys(differences).find(key => differences[key] === minDiff);

            vis.updateVis();
        }

    }


    updateVis() {
        let vis = this;

        // Update node position and labels
        vis.displayData = vis.sportInfo.filter(function(d){
                return d[0] === vis.userSport;
            })

        let parent = document.getElementById(vis.parentElement);
        parent.lastChild.remove();

        // change button display and header
        document.getElementById("btn-physical").innerHTML = "Find Again";
        document.getElementById("physical-right-header1").style.display = "none";
        document.getElementById("physical-right-header2").style.display = "block";
        document.getElementById("user-sport").innerHTML = vis.displayData[0][0];
        document.getElementById("user-sport").style.display = "block";

        // display table
        let table = d3.select("#physical-vis-table").append("table")
            .attr("class", "table user-match");
        let tbody = table.append("tbody");

        console.log(vis.displayData)

        let tableData = [
            {"label": "Avg Age", "data": vis.displayData[0][1]["Age"].toFixed(1)},
            {"label": "Gender Ratio", "data": d3.format(".0%")(1 - vis.displayData[0][1]["Female"]) + "M, " + d3.format(".0%")(vis.displayData[0][1]["Female"]) + "F"},
            {"label": "Avg Height", "data": displayHeight(vis.displayData[0][1]["Height"])},
            {"label": "Avg Weight", "data": vis.displayData[0][1]["Weight"].toFixed(1) + " lb"},];

        let rows = tbody.selectAll("tr")
            .data(tableData)
            .enter()
            .append("tr");

        rows.append("th")
            .text(d => d.label);

        rows.append("td")
            .text(d => d.data);

        // legend
        vis.bubbleLegendSizes = [d3.quantile(vis.legendScale.domain(), .25),
            d3.quantile(vis.legendScale.domain(), .60),
            d3.quantile(vis.legendScale.domain(), 1)]

        vis.xCircle = 100;
        vis.yCircle = 100;
        vis.xLabel = 200;

        // Make bubbles for legend
        vis.legendCircle.selectAll(".bubble-legend-circles").remove()
        vis.legendCircle.selectAll(".bubble-legend-circles").data(vis.bubbleLegendSizes).enter()
            .append('circle')
            .attr("class", "bubble-legend-circles")
            .attr("cx", vis.xCircle)
            .attr("cy", d => vis.yCircle - vis.legendScale(d))
            .attr("r", d => vis.legendScale(d))
            .attr("fill", "none")
            .attr("stroke", "white")

        // Make bubble label lines
        vis.legendCircle.selectAll(".bubble-legend-lines").remove()
        vis.legendCircle.selectAll(".bubble-legend-lines").data(vis.bubbleLegendSizes).enter()
            .append("line")
            .attr("class", "bubble-legend-lines")
            .attr('x1', d => vis.xCircle + vis.legendScale(d) )
            .attr('x2', vis.xLabel)
            .attr('y1', d => vis.yCircle - vis.legendScale(d) )
            .attr('y2', d => vis.yCircle - vis.legendScale(d) )
            .attr('stroke', 'black')
            .style('stroke-dasharray', ('2,2'))

        vis.legendCircle.selectAll(".bubble-legend-labels").remove()
        vis.legendCircle.selectAll(".bubble-legend-labels").data(vis.bubbleLegendSizes).enter()
            .append("text")
            .attr("class", "bubble-legend-labels")
            .attr('x', vis.xLabel)
            .attr('y', d => vis.yCircle - vis.legendScale(d) )
            .text(d => Math.round(d))
            .style("font-size", 8)

        vis.updateAgain()
    }

    updateAgain() {
        let vis = this;

        // Revert nodes to original position and let user input values multiple times
        let count = 0;
        let inputs = ["userAge", "userGender", "userWeight", "userHeightFt", "userHeightIn"];
        inputs.forEach(i => {
            document.getElementById(i).onchange = function() {
                count += 1;
                console.log(count)

                if (count === 1) {

                    document.getElementById("physical-right-header1").style.display = "block";
                    document.getElementById("physical-right-header2").style.display = "none";
                    document.getElementById("user-sport").style.display = "none";


                    $("#physical-vis-table").empty();

                    vis.initVis();
                }
        }})

    }

}

// Find averages of each sport
function femaleCount (d) {
    if (d.Sex === "F") {
        return 1
    } else {
        return NaN
    }
}

// Find height in ft and inches
function displayHeight(val) {
    var quotient = Math.floor(val/12);
    var remainder = val % 12;
    return quotient + "ft " + remainder.toFixed(0) + "in"
}