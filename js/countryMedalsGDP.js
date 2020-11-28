
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

        vis.margin = { top: 100, right: 100, bottom: 100, left: 100 };

        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
            vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;


        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Create blur filter for edges of graph
        vis.defs = vis.svg.append("defs");

        vis.filter = vis.defs.append("filter")
            .attr("id", "edge-blur")
            .attr("height", "140%")
            .attr("width", "140%");

        vis.filter.append("feGaussianBlur")
            .attr("in", "SourceGraphic")
            .attr("stdDeviation", 30)
            .attr("result", "blur")
            .attr("x", -30)
            .attr("y", -40);

        vis.clipPath = vis.defs.append("clipPath")
            .attr("id", "clipMask")
            .style("pointer-events", "none")
            .append("rect")
            .attr("x", -10)
            .attr("y", -60)
            .attr("width", vis.width + 60)
            .attr("height", vis.height + 70)

        // Background fill
        vis.background = vis.svg.append('rect')
            .attr("width", vis.width + 20)
            .attr("height", vis.height + 20)
            .attr("x", -30)
            .attr("y", 30)
            .attr("fill", "#d9d9d9")
            .attr("filter", "url(#edge-blur)")
            .attr("clip-path", "url(#clipMask)")


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
            .tickSize(5)
            .ticks(8);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y)
            .tickFormat(d3.format(","))
            .tickSize(5);

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + (vis.height + 10) + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .attr("transform", "translate(-10, 0)");

        // chart year
        vis.svg.append("text")
            .attr("class", "gdp-year")
            .attr("x", vis.width / 2)
            .attr("y", -30)
            .text("1952")

        // X axis byline
        vis.svg.append("text")
            .attr("class", "gdp-bylines")
            .attr("x", vis.width)
            .attr("y", vis.height)
            .attr("text-anchor", "end")
            .text("USD ($) per Person");

        // Y axis byline
        vis.svg.append("text")
            .attr("class", "gdp-bylines")
            .attr("transform", "rotate(90)")
            .attr("y", 0)
            .text("Bronze, Silver, & Gold Medals");

        // x axis title
        vis.svg.append("text")
            .attr("class", "gdp-titles")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + 70)
            .text("Real GDP per Capita")

        // Y axis title
        vis.svg.append("text")
            .attr("class", "gdp-titles")
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
            setInterval(update, 500);
            rangeSlider.noUiSlider.set(1952)
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
            .style("opacity", d => { if (vis.countryData[d][year]) { return .8 } else { return 0}})
            .attr("fill", d => {
                switch(d) {

                    case 'Turkey': return '#A1C181'; break;
                    case 'India': return '#A1C181'; break
                    case 'Pakistan': return '#A1C181'; break
                    case 'Iran': return '#A1C181'; break;
                    case 'Lebanon': return '#A1C181'; break
                    case 'Syria': return '#A1C181'; break;
                    case 'Israel': return '#A1C181'; break
                    case 'Saudi Arabia': return '#A1C181'; break
                    case 'Bahrain': return '#A1C181'; break
                    case 'Iraq': return '#A1C181'; break
                    case 'Afghanistan': return '#A1C181'; break
                    case 'Sri Lanka': return '#A1C181'; break
                    case 'Jordan': return '#A1C181'; break

                    case 'Russia': return "#C44D5B"; break;
                    case 'Azerbaijan': return '#C44D5B'; break
                    case 'Tajikistan': return '#C44D5B'; break
                    case 'Armenia': return '#C44D5B'; break
                    case 'Belarus': return "#C44D5B"; break;
                    case 'Georgia': return '#C44D5B'; break
                    case 'Kazakhstan': return '#C44D5B'; break;
                    case 'Kyrgyzstan': return '#C44D5B'; break
                    case 'Ukraine': return "#C44D5B"; break;
                    case 'Uzbekistan': return '#C44D5B'; break
                    case 'Estonia': return "#C44D5B"; break;
                    case 'Latvia': return "#C44D5B"; break;
                    case 'Lithuania': return "#C44D5B"; break;

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

                    case 'Argentina': return "#233D4D"; break;
                    case 'Brazil': return "#233D4D"; break;
                    case 'Mexico': return "#233D4D"; break;
                    case 'Colombia': return "#233D4D"; break;
                    case 'Cuba': return "#233D4D"; break;
                    case 'Dominican Republic': return "#233D4D"; break;
                    case 'Jamaica': return "#233D4D"; break;
                    case 'Venezuela': return "#233D4D"; break;
                    case 'Uruguay': return "#233D4D"; break;
                    case 'Chile': return "#233D4D"; break;
                    case 'Peru': return "#233D4D"; break;
                    case 'Guatemala': return "#233D4D"; break;
                    case 'Ecuador': return "#233D4D"; break;
                    case 'Paraguay': return "#233D4D"; break;
                    case 'Costa Rica': return "#233D4D"; break;
                    case 'Panama': return "#233D4D"; break;

                    case 'Kenya': return "#FCCA46"; break;
                    case 'Ghana': return "#FCCA46"; break;
                    case 'Nigeria': return "#FCCA46"; break;
                    case 'Zimbabwe': return "#FCCA46"; break;
                    case 'South Africa': return "#FCCA46"; break;
                    case 'Uganda': return "#FCCA46"; break;
                    case 'Egypt': return "#FCCA46"; break;
                    case 'Morocco': return "#FCCA46"; break;
                    case 'Cameroon': return "#FCCA46"; break;
                    case 'Tunisia': return "#FCCA46"; break;
                    case 'Zambia': return "#FCCA46"; break;
                    case 'Tanzania': return "#FCCA46"; break;
                    case 'Niger': return "#FCCA46"; break;
                    case 'Algeria': return "#FCCA46"; break;
                    case 'Mozambique': return "#FCCA46"; break;
                    case 'Senegal': return "#FCCA46"; break;
                    case 'Botswana': return "#FCCA46"; break;
                    case 'Togo': return "#FCCA46"; break;
                    case 'Namibia': return "#FCCA46"; break;
                    case 'Mauritius': return "#FCCA46"; break;
                    case 'Burundi': return "#FCCA46"; break;
                    case 'Gabon': return "#FCCA46"; break;
                    case 'Djibouti': return "#FCCA46"; break;

                    default: return "#b0b0b0";
                }
            })


        vis.countries.exit().remove();
    }


}




