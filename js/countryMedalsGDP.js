
// Record olympic years and olympic countries
// Only going to olympic year 2010, since GDP data only goes to there
let olympicYears = [1952, 1956, 1960, 1964, 1968, 1972, 1976, 1980, 1984, 1988, 1992, 1994, 1996, 1998, 2000, 2002, 2004, 2006, 2008, 2010, 2012, 2014, 2016];
let olympicCountries = ['United Kingdom', 'Germany', 'Spain', 'Italy', 'France', 'United States', 'Canada', 'Finland', 'Sweden', 'Switzerland', 'Norway', 'Netherlands', 'Poland', 'Denmark', 'Australia', 'Austria', 'Belgium', 'Hungary', 'New Zealand', 'Hungary', 'Greece', 'Portugal', 'Romania', 'Serbia', 'Bulgaria', 'Czech Republic', 'Iceland', 'Ireland', 'Croatia', 'Slovakia', 'Slovenia', 'Macedonia', 'Montenegro', "Taiwan", "Azerbaijan", "Russia", "Belarus", "Cameroon", "Iran", "Pakistan", "Uzbekistan", "Tajikistan", "Japan", "South Africa", "Turkey", "Egypt", "Jordan", "Mexico", "Ghana", "Morocco", "Argentina", "Cuba", "Uruguay", "Nigeria", "Brazil", "Lithuania", "Chile", "Ukraine", "Uganda", "Syria", "Saudi Arabia", "Armenia", "Niger", "India", "Algeria", "Jamaica", "Colombia", "Botswana", "Tunisia", "South Korea", "North Korea", "China", "Israel", "Kazakhstan", "Georgia", "Kenya", "Malaysia", "Iraq", "Paraguay", "Guatemala", "Tanzania", "Lebanon", "Kyrgyzstan", "Venezuela", "Thailand", "Togo", "Peru", "Estonia", "Zimbabwe", "Mongolia", "Senegal", "Dominican Republic", "Philippines", "Latvia", "Singapore", "Namibia", "Vietnam", "Bahrain", "Sri Lanka", "Mauritius", "Panama", "Zambia", "Mozambique", "Afghanistan", "Burundi", "Gabon", "Ecuador", "Costa Rica", "Djibouti"]

// Load data files
let gdppromises = [
    d3.csv("data/athlete_events.csv"),
    d3.csv("data/noc_regions.csv"),
    d3.csv("data/gdp-per-capita-clio-infra.csv")
];

Promise.all(gdppromises)
    .then( function(data){ formatData(data)})
    .catch( function (err){console.log(err)} );


// Wrangle athlete events data in order to get each country's amount of medal wins per year
function formatData(dataArray) {

    // Define variables
    let data = dataArray[0].filter(x => x.Year >= 1952);
    let regionNOCData = dataArray[1];
    let GDPdata = dataArray[2].filter(x =>  olympicYears.includes(+x.Year) && olympicCountries.includes(x.Entity))

    // Use regionNOCData to change the country code to country name
    // Also combine winter and summer Olympics after 1992 for continuity
    data.forEach(x => {
        x.NOC = regionNOCData.find(country => country.NOC == x.NOC).region;
        if (x.Year == 1994 || x.Year == 1998 || x.Year == 2002 || x.Year == 2006 || x.Year == 2010 || x.Year == 2014) {
            x.Year = +x.Year + 2
        }
    });

    // Create empty dictionary for each country for each Olympic year
    let countryData = {};
    olympicCountries.forEach(country => {
        countryData[country] = {};
        // Create array for each year to store Medal Count, GDP values, and athlete count, respectively
        olympicYears.forEach(year => countryData[country][year] = [0, 0, 0])
    })

    // Go through each athlete, adding their medal win to their respective country by year
    data.forEach(athlete => {
        // If the athlete has a medal and comes from a country that's being recorded
        if (athlete.Medal !== 'NA' && olympicCountries.includes(athlete.NOC)) {
            countryData[athlete.NOC][athlete.Year][0] += 1;
        }
    })

    // Add GDP Data
    GDPdata.forEach(row => {
        countryData[row.Entity][row.Year][1] = row.GDP;
    })

    // Get athlete count from each country for each year
    athleteCount = d3.rollup(data, v => v.length, d => d.NOC, d => d.Year)

    // Remove rows from country data that doesn't have GDP data, and add athlete count
    olympicCountries.forEach(country => {
        olympicYears.forEach(year => {
            if (countryData[country][year][1] == 0) {
                delete countryData[country][year]
            } else {
                countryData[country][year][2] = athleteCount.get(country).get(`${year}`) || 0;
            }
        })
    })

    // Create vis
    medalGDPVis = new MedalGDPvis("gdp-vis", countryData, GDPdata)

}


class MedalGDPvis {
    constructor(parentElement, countryData, GDPdata) {
        this.parentElement = parentElement;
        this.countryData = countryData;
        this.GDPdata = GDPdata;

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = { top: 70, right: 70, bottom: 100, left: 100 };

        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
            vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;


        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Background fill
        vis.svg.append('rect')
            .attr("width", vis.width + 10)
            .attr("height", vis.height + 10)
            .attr("x", -10)
            .style("fill", "#130e35")

        // Scales and axes
        vis.x = d3.scaleSymlog()
            .range([0, vis.width])
            .domain(d3.extent(vis.GDPdata.map(x => +x.GDP)));

        vis.y = d3.scaleSymlog()
            .range([vis.height,0])
            .domain([0,400]);

        vis.radius = d3.scaleSqrt()
            .range([0, 30])
            .domain([0, 700])

        // Create legend for radius
        vis.legend = d3.select("#gdp-size-legend").append('svg')
            .attr("width", $("#gdp-size-legend").width())
            .attr("height", $("#gdp-size-legend").height())

        vis.center = 50;

        // Circle outline for larger athlete sendoff
        vis.legend.append('circle')
            .attr("cx", $("#gdp-size-legend").width() / 2)
            .attr("cy", vis.center)
            .attr("r", vis.radius(700))
            .attr("stroke", "white")
            .attr("fill", "none")

        // Smaller athlete sendoff
        vis.legend.append('circle')
            .attr("cx", $("#gdp-size-legend").width() / 2)
            .attr("cy", vis.center + (vis.radius(700) - vis.radius(200)))
            .attr("r", vis.radius(200))
            .attr("stroke", "white")
            .attr("fill", "none")

        // Line for large
        vis.legend.append("line")
            .attr("class", "size-legend-line")
            .attr("x1", ($("#gdp-size-legend").width() / 2) + vis.radius(700))
            .attr("y1", vis.center)
            .attr("x2", $("#gdp-size-legend").width() - 40)
            .attr("y2", vis.center)

        // Line for small
        vis.legend.append("line")
            .attr("class", "size-legend-line")
            .attr("x1", ($("#gdp-size-legend").width() / 2) + vis.radius(200))
            .attr("y1", vis.center + (vis.radius(700) - vis.radius(200)))
            .attr("x2", $("#gdp-size-legend").width() - 40)
            .attr("y2", vis.center + (vis.radius(700) - vis.radius(200)))

        // Legend text
        vis.legend.append('text')
            .attr("class", "size-legend-text")
            .attr("x", $("#gdp-size-legend").width() - 35)
            .attr("y", vis.center + 5)
            .text("700")

        // Legend text
        vis.legend.append('text')
            .attr("class", "size-legend-text")
            .attr("x", $("#gdp-size-legend").width() - 35)
            .attr("y", vis.center + 5 + (vis.radius(700) - vis.radius(200)))
            .text("200")

        // Title for legend
        vis.legend.append('text')
            .attr("class", "size-legend-title")
            .attr("x", $("#gdp-size-legend").width() / 2)
            .attr("y", 20 + 90)
            .text(`Athletes Sent`)
        vis.legend.append('text')
            .attr("class", "size-legend-title")
            .attr("x", $("#gdp-size-legend").width() / 2)
            .attr("y", 37 + 90)
            .text(`to Compete`)




        // X axis
        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .tickFormat(d3.format(","))
            .tickSize(5)
            .ticks(8);

        // Y axis
        vis.yAxis = d3.axisLeft()
            .scale(vis.y)
            .tickFormat(d3.format(","))
            .tickSize(5);

        // add the X gridlines
        vis.svg.append("g")
            .attr("class", "grid")
            .attr("transform", "translate(0," + vis.height + ")")
            .call(d3.axisBottom(vis.x)
                .ticks(5)
                .tickSize(-vis.height)
                .tickFormat("")
            )

        // add the Y gridlines
        vis.svg.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(vis.y)
                .ticks(5)
                .tickSize(-vis.width)
                .tickFormat("")
            )

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + (vis.height + 10) + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .attr("transform", "translate(-10, 0)");

        // chart year
        vis.svg.append("text")
            .attr("class", "gdp-year")
            .attr("x", vis.width / 2 - 15)
            .attr("y", -30)
            .text("1952")


        // X axis byline
        vis.svg.append("text")
            .attr("class", "gdp-bylines")
            .attr("x", vis.width - 10)
            .attr("y", vis.height)
            .attr("text-anchor", "end")
            .text("USD ($) per Person");

        // Y axis byline
        vis.svg.append("text")
            .attr("class", "gdp-bylines")
            .attr("transform", "rotate(90)")
            .attr("x", 10)
            .text("Bronze, Silver, & Gold Medals");

        // x axis title
        vis.svg.append("text")
            .attr("class", "chart-titles")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + 70)
            .text("Real GDP per Capita")

        // Y axis title
        vis.svg.append("text")
            .attr("class", "chart-titles")
            .attr("transform", `rotate(-90)translate(-${vis.height/2}, -50)`)
            .text("Total Medals Won")

        // Call axis function with the new domain
        vis.svg.select(".x-axis").call(vis.xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .attr("x", -20)
            .attr("y", 5);
        vis.svg.select(".y-axis").call(vis.yAxis);


        // Create range slider
        var rangeSlider = document.getElementById('slider');

        noUiSlider.create(rangeSlider, {
            start: [1952],
            range: {
                'min': [1952, 4],
                'max': [2016]
            },
            format: wNumb({
                decimals: 0
            })
        });

        vis.rangeSliderValueElement = document.getElementById('slider-range-value');

        rangeSlider.noUiSlider.on('update', function (values, handle) {
            vis.rangeSliderValueElement.innerHTML = values[handle];
            vis.showYear(values[handle])
            d3.select(".gdp-year").text(values[handle])
        });

        // Create button to play
        vis.playButton = document.getElementById('play-button');

        vis.playButton.addEventListener('click', function () {
            var i = 0
            for(i = 0; i <= 16; i++){
                (function(i) {
                    setTimeout(function() {rangeSlider.noUiSlider.set(1952 + (4 * i))}, 500 * i);
                })(i);
            }
        });

        // Create tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "gdp-tooltip")
            .style("opacity", 0)

    }

    showYear(year) {
        let vis = this;

        vis.countries = vis.svg.selectAll(".gdp-country-circles")
            .data(olympicCountries)

        vis.countries.enter().append("circle")
            .merge(vis.countries)
            .attr("class", 'gdp-country-circles')
            .on("mouseover", function(e, d) {
                console.log(d)
                console.log(e)
                d3.select(this)
                    .transition()
                    .duration(400)
                    .attr("stroke", "var(--highlightpurple)")
                    .attr("stroke-width", "4")
                    .attr("transform", `translate(${-this.cx.baseVal.value*(1.4-1)}, ${-this.cy.baseVal.value*(1.4-1)}) scale(1.4)`);

                vis.tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);
                vis.tooltip.html(`<h3>${d} <span>in ${year}</span></h3>
                        <table class="table">
                            <tbody>
                                <tr><th>Medal Count</th><td>${vis.countryData[d][year][0]}</td></tr>
                                <tr><th>GDP ($)</th><td>${(vis.countryData[d][year][1]).toLocaleString()}</td></tr>
                                <tr><th>Athletes Sent</th><td>${vis.countryData[d][year][2]}</td></tr>
                            </tbody>
                        </table>`)
                    .style("left", (e.pageX + 20) + "px")
                    .style("top", (e.pageY - 50) + "px");
            })
            .on("mouseout", function(e, d) {
                d3.select(this)
                    .transition()
                    .duration(400)
                    .attr("stroke", "var(--lighterpurple)")
                    .attr("stroke-width", "1")
                    .attr("transform", `translate(${-this.cx.baseVal.value*(1-1)}, ${-this.cy.baseVal.value*(1-1)}) scale(1)`);

                vis.tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .transition()
            .ease(d3.easeLinear)
            .duration(800)
            .attr("cx", d => {
                if (vis.countryData[d][year]) {
                    return vis.x(vis.countryData[d][year][1]);
                }
            })
            .attr("cy", d => {
                if (vis.countryData[d][year]) {
                    return vis.y(vis.countryData[d][year][0]);
                }
            })
            .attr("r", d => {
                if (vis.countryData[d][year]) {
                    return vis.radius(vis.countryData[d][year][2])
                }
            })
            .attr("stroke", "var(--lighterpurple)")
            .style("opacity", d => { if (vis.countryData[d][year]) { return .85 } else { return 0}})
            .attr("fill", d => {
                switch(d) {

                    case 'Turkey': return 'var(--green)'; break;
                    case 'India': return 'var(--green)'; break
                    case 'Pakistan': return 'var(--green)'; break
                    case 'Iran': return 'var(--green)'; break;
                    case 'Lebanon': return 'var(--green)'; break
                    case 'Syria': return 'var(--green)'; break;
                    case 'Israel': return 'var(--green)'; break
                    case 'Saudi A2rabia': return 'var(--green)'; break
                    case 'Bahrain': return 'var(--green)'; break
                    case 'Iraq': return 'var(--green)'; break
                    case 'Afghanistan': return 'var(--green)'; break
                    case 'Sri Lanka': return 'var(--green)'; break
                    case 'Jordan': return 'var(--green)'; break

                    case 'Russia': return "var(--red)"; break;
                    case 'Azerbaijan': return 'var(--red)'; break
                    case 'Tajikistan': return 'var(--red)'; break
                    case 'Armenia': return 'var(--red)'; break
                    case 'Belarus': return "var(--red)"; break;
                    case 'Georgia': return 'var(--red)'; break
                    case 'Kazakhstan': return 'var(--red)'; break;
                    case 'Kyrgyzstan': return 'var(--red)'; break
                    case 'Ukraine': return "var(--red)"; break;
                    case 'Uzbekistan': return 'var(--red)'; break
                    case 'Estonia': return "var(--red)"; break;
                    case 'Latvia': return "var(--red)"; break;
                    case 'Lithuania': return "var(--red)"; break;

                    case 'China': return "#FE7F2D"; break;
                    case 'Japan': return "#FE7F2D"; break;
                    case 'Taiwan': return "#FE7F2D"; break;
                    case 'Philippines': return "#FE7F2D"; break;
                    case 'South Korea': return "#FE7F2D"; break;
                    case 'Vietnam': return "#FE7F2D"; break;
                    case 'Thailand': return "#FE7F2D"; break;
                    case 'Singapore': return "#FE7F2D"; break;
                    case 'Mongolia': return "#FE7F2D"; break;
                    case 'Malaysia': return "#FE7F2D"; break;
                    case 'North Korea': return "#FE7F2D"; break;

                    case 'Argentina': return "var(--blue)"; break;
                    case 'Brazil': return "var(--blue)"; break;
                    case 'Mexico': return "var(--blue)"; break;
                    case 'Colombia': return "var(--blue)"; break;
                    case 'Cuba': return "var(--blue)"; break;
                    case 'Dominican Republic': return "var(--blue)"; break;
                    case 'Jamaica': return "var(--blue)"; break;
                    case 'Venezuela': return "var(--blue)"; break;
                    case 'Uruguay': return "var(--blue)"; break;
                    case 'Chile': return "var(--blue)"; break;
                    case 'Peru': return "var(--blue)"; break;
                    case 'Guatemala': return "var(--blue)"; break;
                    case 'Ecuador': return "var(--blue)"; break;
                    case 'Paraguay': return "var(--blue)"; break;
                    case 'Costa Rica': return "var(--blue)"; break;
                    case 'Panama': return "var(--blue)"; break;

                    case 'Kenya': return "var(--yellow)"; break;
                    case 'Ghana': return "var(--yellow)"; break;
                    case 'Nigeria': return "var(--yellow)"; break;
                    case 'Zimbabwe': return "var(--yellow)"; break;
                    case 'South Africa': return "var(--yellow)"; break;
                    case 'Uganda': return "var(--yellow)"; break;
                    case 'Egypt': return "var(--yellow)"; break;
                    case 'Morocco': return "var(--yellow)"; break;
                    case 'Cameroon': return "var(--yellow)"; break;
                    case 'Tunisia': return "var(--yellow)"; break;
                    case 'Zambia': return "var(--yellow)"; break;
                    case 'Tanzania': return "var(--yellow)"; break;
                    case 'Niger': return "var(--yellow)"; break;
                    case 'Algeria': return "var(--yellow)"; break;
                    case 'Mozambique': return "var(--yellow)"; break;
                    case 'Senegal': return "var(--yellow)"; break;
                    case 'Botswana': return "var(--yellow)"; break;
                    case 'Togo': return "var(--yellow)"; break;
                    case 'Namibia': return "var(--yellow)"; break;
                    case 'Mauritius': return "var(--yellow)"; break;
                    case 'Burundi': return "var(--yellow)"; break;
                    case 'Gabon': return "var(--yellow)"; break;
                    case 'Djibouti': return "var(--yellow)"; break;

                    default: return "var(--blueoverlay)";
                }
            })


        vis.countries.exit().remove();
    }


}




