# Visualizing the Olympics
#### Team Members: Marie Konopacki, Nicole Araya, Miu Kumakura

- URL to website: https://nicolearaya.github.io/Olympics/#1
- URL to video:

## Project Structure
- ```css/```: contains library CSS files as well as our custom style.css
- ```data/```:
    * Data on athletes' physical traits: ```athlete_events.csv```
    * Data on athletes' hometowns: ```athlete_hometowns_all.csv```, ```combined_roster.csv```
    * Data on US income: ```5Y2018_income.csv```, ```final_income_plot_data.csv```
    * Data for US map: ```uscities.csv```, ```us_cities_counties.csv```
    * Data on country GDP: ```gdp-per-capita-clio-infra.csv```, ```noc_regions.csv```
    * Data on host medal wins: ```hosts_medals.csv```, ```summer_hosts.csv```
    * Data on sport popularity: ```popularity.csv```
- js/:
    * ```main.js```: main JavaScript file for loading data and all visualizations
    * ```fullpage.js```: implement scroll feature
    * User input vis:
        * ```physical-vis.js```: interactive visualization that finds user's most likely sport
    * Physical distribution of US athlete vis:
        * ```measure-table.js```: summary table of physical traits by sport that links to following vis on hover
        * ```measure-vis.js```: scatterplot of athletes' weight and height
        * ```ageRange.js```: scale for athletes' age range for each sport
        * ```genderRatio.js```: scale for gender ratio of each sport
    * Athlete hometown map vis:
        * ```income-vis.js```: cloropleth map colored by median US household income
    * Athlete median income vis:
        * ```income-plot.js```: athletes' household income line graph 
        * ```income-plot-data-wrangling.js```: organizes data by season and county
    * Country wins and GDP vis:
        * ```animation-helper/```: play function for vis
        * ```countryMedalsGDP.js```: bubble chart of medal wins and country GDP
        * ```nouislider.js```: enable slide scroll by time
        * ```wNumb.js```: calculate size of bubble
    * Host country vis:
        * ```host-medals-vis.js```: line graph of host year and number of medals won
    * Accessibility score vis:
        * ```parallel-coord-vis```: parallel coordinates visualization for accessibility metrics
        * ```helpers.js```: calculates accessibility score
    * Popularity vis:
        * ```popularity.js```: scatterplot of sport popularity rating and accessibility score
    * Author page:
        * ```author.js```: creates blobs 
- ```img/```: contains images for intro and conclusion, headshots, etc
- ```index.html```: main html file for the website
      
        
        
    