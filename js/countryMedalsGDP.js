
// Record olympic years and olympic countries
// Only going to olympic year 2010, since GDP data only goes to there
let olympicYears = [1952, 1956, 1960, 1964, 1968, 1972, 1976, 1980, 1984, 1988, 1992, 1994, 1996, 1998, 2000, 2002, 2004, 2006, 2008, 2010, 2012, 2014, 2016];
let olympicCountries = ["Finland", "Norway", "Taiwan", "Netherlands", "France", "Italy", "Spain", "Azerbaijan", "Russia", "Belarus", "Cameroon", "United States", "Hungary", "Australia", "Iran", "Canada", "Pakistan", "Uzbekistan", "Tajikistan", "Japan", "Germany", "South Africa", "Turkey", "Bulgaria", "Egypt", "United Kingdom", "Sweden", "Jordan", "Romania", "Switzerland", "Mexico", "Ghana", "Morocco", "New Zealand", "Argentina", "Cuba", "Uruguay", "Poland", "Czech Republic", "Nigeria", "Brazil", "Lithuania", "Chile", "Ukraine", "Greece", "Uganda", "Syria", "Saudi Arabia", "Croatia", "Armenia", "Serbia", "Niger", "India", "Algeria", "Austria", "Jamaica", "Colombia", "Botswana", "Tunisia", "South Korea", "North Korea", "China", "Denmark", "Israel", "Kazakhstan", "Georgia", "Kenya", "Malaysia", "Iraq", "Slovakia", "Belgium", "Paraguay", "Montenegro", "Ireland", "Portugal", "Guatemala", "Tanzania", "Lebanon", "Kyrgyzstan", "Venezuela", "Thailand", "Togo", "Peru", "Estonia", "Slovenia", "Zimbabwe", "Mongolia", "Senegal", "Dominican Republic", "Philippines", "Latvia", "Singapore", "Namibia", "Vietnam", "Macedonia", "Bahrain", "Sri Lanka", "Mauritius", "Panama", "Zambia", "Mozambique", "Afghanistan", "Burundi", "Gabon", "Ecuador", "Costa Rica", "Djibouti"];

// Load data files
let promises = [
    d3.csv("data/athlete_events.csv"),
    d3.csv("data/noc_regions.csv"),
    d3.csv("data/gdp-per-capita-clio-infra.csv")
];

Promise.all(promises)
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
            console.log(athlete)
            countryData[athlete.NOC][athlete.Year][0] += 1;
        }
        // if (!olympicCountries.includes(athlete.NOC)) {
        //     console.log(athlete.NOC)
        // }
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

        vis.margin = { top: 40, right: 20, bottom: 40, left: 40 };

        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
            vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Scales and axes
        vis.x = d3.scaleSymlog()
            .range([0, vis.width])
            .domain(d3.extent(vis.GDPdata.map(x => +x.GDP)));

        vis.y = d3.scaleSymlog()
            .range([vis.height,0])
            .domain([0,400]);

        vis.radius = d3.scaleSqrt()
            .range([0, 20])
            .domain([0, 400])

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .tickFormat(d3.format(","))
            .tickSize(10)
            .ticks(8);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y)
            .tickFormat(d3.format(","))
            .tickSize(10);

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + (vis.height + 10) + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .attr("transform", "translate(-10, 0)");

        // X axis title
        vis.svg.append("text")
            .attr("x", vis.width)
            .attr("y", vis.height - 10)
            .attr("text-anchor", "end")
            .attr("font-size", 13)
            .text("GDP");

        // Y axis title
        vis.svg.append("text")
            .attr("transform", "rotate(90)")
            .attr("y", 0)
            .attr("font-size", 13)
            .text("Number of Wins");

        // Call axis function with the new domain
        vis.svg.select(".x-axis").call(vis.xAxis);
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

        var rangeSliderValueElement = document.getElementById('slider-range-value');

        rangeSlider.noUiSlider.on('update', function (values, handle) {
            rangeSliderValueElement.innerHTML = values[handle];
            vis.showYear(values[handle])
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
                vis.tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                vis.tooltip.html(d)
                    .style("left", (e.pageX) + "px")
                    .style("top", (e.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
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
            .style("opacity", d => { if (vis.countryData[d][year]) { return .2 } else { return 0}})
            .attr("fill", d => {
                switch(d) {
                    case 'United Kingdom': return "darkblue"; break;
                    case 'Germany': return "darkblue"; break;
                    case 'Spain': return "darkblue"; break;
                    case 'Italy': return "darkblue"; break;
                    case 'France': return "darkblue"; break;
                    case 'United States': return "lightblue"; break;
                    case 'Canada': return "lightblue"; break;
                    case 'Russia': return "red"; break;
                    case 'North Korea': return "red"; break;
                    case 'China': return "orange"; break;
                    case 'Japan': return "orange"; break;
                    case 'Taiwan': return "orange"; break;
                    case 'Philippines': return "orange"; break;
                    case 'South Korea': return "orange"; break;
                    case 'Vietnam': return "orange"; break;
                    case 'Thailand': return "orange"; break;
                    case 'Argentina': return "green"; break;
                    case 'Brazil': return "green"; break;
                    case 'Mexico': return "green"; break;
                    case 'Colombia': return "green"; break;
                    case 'Cuba': return "green"; break;
                    case 'Dominican Republic': return "green"; break;
                    case 'Jamaica': return "green"; break;
                    case 'Venezuela': return "green"; break;
                    case 'Kenya': return "yellow"; break;
                    case 'Ghana': return "yellow"; break;
                    case 'Nigeria': return "yellow"; break;
                    case 'Zimbabwe': return "yellow"; break;
                    case 'South Africa': return "yellow"; break;
                    case 'Uganda': return "yellow"; break;
                    case 'Egypt': return "yellow"; break;
                    case 'Morocco': return "yellow"; break;
                    case 'Cameroon': return "yellow"; break;
                    default: return "gray";
                }
            })


        vis.countries.exit().remove();
    }


}




