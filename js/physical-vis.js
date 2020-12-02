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
                         <h6>Avg Height: ${d[1]["Height"].toFixed(1)} in</h6> 
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

        // Display hover instruction
        hovertext.style.display = "block";

        // Update node position and labels
        vis.displayData = vis.sportInfo.filter(function(d){
                return d[0] === vis.userSport;
            })

        vis.node.data(vis.displayData, d=> d[0])
            .exit().remove();

        // vis.label.data(vis.displayData, d=> d[0])
        //     .exit().remove();

        vis.simulation = d3.forceSimulation(vis.displayData)
            .force("x", d3.forceX().x(vis.width / 2))
            .force("y", d3.forceY().y(vis.height / 2))

        vis.simulation
            .on("tick", function(d) {

                vis.node
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                    .attr("r", 60)

                vis.label
                    .attr("x", d => d.x)
                    .attr("y", d => d.y)
                    .attr("display", d=> {
                        if (d[0] === vis.userSport) {
                            return "null"
                        } else {
                            return "none"
                        }
                    })
                    .text(d=> {
                        if (d[0] === vis.userSport) {
                            return "You play..."
                        }
                    })
                    .attr("font-size", "16px");
            });

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

                    // Hide hover instructions
                    hovertext.style.display = "none";

                    let parent = document.getElementById(vis.parentElement);
                    while (parent.firstChild) {
                        parent.firstChild.remove();
                    }
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