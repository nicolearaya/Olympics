class MeasureTable {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        this.displayData = data;

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.tableBody = d3.select("#" + vis.parentElement)

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        // Update for gender
        vis.sex = d3.select("#gender").property("value")
        vis.displayData = vis.data.filter(x => {return x.Sex == vis.sex})

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // Roll up data to find averages of each sport
        vis.sportInfo = d3.rollups(vis.displayData, v => {return {"Weight":d3.mean(v, d => d.Weight), "Height":d3.mean(v, d => d.Height), "Age":d3.mean(v, d => d.Age)}}, d => d.Sport)

        // Create an array for the sortable table to parse through
        vis.sportInfoArray = vis.sportInfo.map(row => {
            return {"sport":row[0], "weight":row[1].Weight.toFixed(1), "height": row[1].Height.toFixed(1), "age": row[1].Age.toFixed(1)}
        })

        console.log(vis.sportInfoArray)

        // Parse through data to create table
        $('table').bootstrapTable({})

        $('table').bootstrapTable("load", vis.sportInfoArray)





    }
}

$(document).ready(function() {

    $('tbody').on('mouseover', 'tr', function() {
        let selectedSport = $(this).children(":first").text().replace(/ /g,'');
        d3.selectAll(".dot")
            .transition()
            .duration(200)
            .style("stroke", "transparent")
            .style("opacity", .1)
        d3.selectAll(`.dot.${selectedSport}`)
            .transition()
            .duration(200)
            .style("opacity", 1)
            .style("stroke-width", 3)
            .style("stroke", "black")
    })

    $('tbody').on('mouseout', 'tr', function() {
        d3.selectAll(`.dot`)
            .transition()
            .duration(200)
            .style("stroke", "transparent")
            .style("opacity", .8)
    })

});