/**
 * Created by barrymoran on 25/10/2016.
 */
queue()
    .defer(d3.json, "../donorsUS/projects")
    .defer(d3.json, "../static/us-states.json")
    .await(makeGraphs);

function makeGraphs(error, projectsJson, statesJson) {

    //Clean projectsJson data
    var donorsUSProjects = projectsJson;
    var dateFormat = d3.time.format("%Y-%m-%d %H:%M:%S");


    donorsUSProjects.forEach(function (d) {
        d["date_posted"] = dateFormat.parse(d["date_posted"]);
        d["date_posted"].setDate(1);
        d["total_donations"] = +d["total_donations"];
    });


    //Create a Crossfilter instance
    var ndx = crossfilter(donorsUSProjects);
    var ndx1 = crossfilter(donorsUSProjects);

    //Define Dimensions
    var dateDim = ndx.dimension(function (d) {
        return d["date_posted"];
    });
    var resourceTypeDim = ndx.dimension(function (d) {
        return d["resource_type"];
    });
    var povertyLevelDim = ndx.dimension(function (d) {
        return d["poverty_level"];
    });

    var gradeLevelDim = ndx1.dimension(function (d) {
        return d["grade_level"];
    });

    var focusDim = ndx1.dimension(function (d) {
        return d["primary_focus_area"];
    });

    var stateDim = ndx.dimension(function (d) {
        return d["school_state"];
    });

    var totalDonationsDim = ndx.dimension(function (d) {
        return d["total_donations"];
    });

    var fundingStatus = ndx.dimension(function (d) {
        return d["funding_status"];
    });


    //Calculate metrics
    var numProjectsByDate = dateDim.group();
    var numProjectsByResourceType = resourceTypeDim.group();
    var numProjectsByPovertyLevel = povertyLevelDim.group();
    var numProjectsByGradeLevel = gradeLevelDim.group();
    var numProjectsByArea = focusDim.group();
    var numProjectsByFundingStatus = fundingStatus.group();


    var totalDonationsByState = stateDim.group().reduceSum(function (d) {
        return d["total_donations"];
    });
    var stateGroup = stateDim.group();


    var all = ndx.groupAll();
    var totalDonations = ndx.groupAll().reduceSum(function (d) {
        return d["total_donations"];
    });

    var max_state = totalDonationsByState.top(1)[0].value;

    //Define values (to be used in charts)
    var minDate = dateDim.bottom(1)[0]["date_posted"];
    var maxDate = dateDim.top(1)[0]["date_posted"];

    //Charts
    var timeChart = dc.barChart("#time-chart");
    var resourceTypeChart = dc.rowChart("#resource-type-row-chart");
    var povertyLevelChart = dc.rowChart("#poverty-level-row-chart");
    var gradeLevelChart = dc.rowChart("#grade-level-row-chart");
    var focusChart = dc.rowChart("#focus-area-row-chart");
    var numberProjectsND = dc.numberDisplay("#number-projects-nd");
    var totalDonationsND = dc.numberDisplay("#total-donations-nd");
    var fundingStatusChart = dc.pieChart("#funding-chart");
    var fundingStatusmap = dc.geoChoroplethChart("#funding-map");
    var stuffND = dc.numberDisplay("#total-donations-stuff");


    selectField = dc.selectMenu('#menu-select')
        .dimension(stateDim)
        .group(stateGroup);


    numberProjectsND
        .formatNumber(d3.format("d"))
        .valueAccessor(function (d) {
            return d;
        })
        .group(all);

    totalDonationsND
        .formatNumber(d3.format("d"))
        .valueAccessor(function (d) {
            return d;
        })
        .group(totalDonations)
        .formatNumber(d3.format(".3s"));

    stuffND
        .formatNumber(d3.format("d"))
        .valueAccessor(function (d) {
            return d;
        })
        .group(totalDonations)
        .formatNumber(d3.format(".3s"));

    timeChart
        .width(960)
        .height(200)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(dateDim)
        .group(numProjectsByDate)
        .transitionDuration(500)
        .x(d3.time.scale().domain([minDate, maxDate]))
        .elasticY(true)
        .xAxisLabel("Year")
        .yAxis().ticks(4);

    resourceTypeChart
        .width(300)
        .height(250)
        .dimension(resourceTypeDim)
        .group(numProjectsByResourceType)
        .xAxis().ticks(4);

    povertyLevelChart
        .width(380)
        .height(330)
        .dimension(povertyLevelDim)
        .group(numProjectsByPovertyLevel)
        .xAxis().ticks(4);

    focusChart
        .width(380)
        .height(330)
        .dimension(focusDim)
        .group(numProjectsByArea)
        .xAxis().ticks(4);


    fundingStatusChart
        .height(220)
        .radius(90)
        .innerRadius(40)
        .transitionDuration(1500)
        .dimension(fundingStatus)
        .group(numProjectsByFundingStatus);

    gradeLevelChart
        .width(300)
        .height(400)
        .dimension(gradeLevelDim)
        .group(numProjectsByGradeLevel)
        .xAxis().ticks(4);

    fundingStatusmap
        .width(500)
        .height(330)
        .dimension(stateDim)
        .group(totalDonationsByState)
        .colors(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#7C151D"])
        .colorDomain([0, max_state])
        .overlayGeoJson(statesJson["features"], "state", function (d) {
            return d.properties.name;
        })
        .projection(d3.geo.albersUsa()
            .scale(500)
            .translate([340, 150]))
        .title(function (p) {
            return "State: " + p["key"]
                + "\n"
                + "Total Donations: " + Math.round(p["value"]) + " $";
        });


    dc.renderAll();
}