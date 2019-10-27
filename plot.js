"use-strict";

let data = "";
let plotContainer = "";
const msm = {
    width: 1200,
    height: 800,
    marginAll: 50,
    marginLeft: 50,
}

const colors = {
    "Bug": "#4E79A7",
    "Dark": "#A0CBE8",
    "Electric": "#F28E2B",
    "Fairy": "#FFBE&D",
    "Fighting": "#59A14F",
    "Fire": "#8CD17D",
    "Ghost": "#B6992D",
    "Grass": "#499894",
    "Ground": "#86BCB6",
    "Ice": "#86BCB6",
    "Normal": "#E15759",
    "Poison": "#FF9D9A",
    "Psychic": "#79706E",
    "Steel": "#BAB0AC",
    "Water": "#D37295"
}

window.onload = function () {
    plotContainer = d3.select("#plot")
        .append('svg')
        .attr('width', msm.width)
        .attr('height', msm.height);
    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("pokemon.csv")
        .then((d) => makeScatterPlot(d))
}

function makeScatterPlot(d) {
    data = d;
    let spDef = data.map((row) => parseInt(row["Sp. Def"]));
    let total = data.map((row) => parseInt(row["Total"]));
    let axesMinMax = findMinMax(spDef, total);
    let scalers = getScalers(axesMinMax);
    drawAxes(scalers);
    drawAxesLabels();
    plotData(scalers);
}

function plotData(scalers) {
    // make tooltip
    let tooltipDiv = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    
    // add dots
    plotContainer.append('g')
        .selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function (d) { return scalers.xScale(d["Sp. Def"]); } )
        .attr("cy", function (d) { return scalers.yScale(d["Total"]); } )
        .attr("r", 10)
        .attr('stroke', "black")
        .attr('stroke-width', 1)
        .attr('fill', function (d) { return colors[d["Type 1"]]})
        .on("mouseover", (d) => {
            tooltipDiv.transition()
                .duration(200)
                .style("opacity", 1)
            tooltipDiv.html("<b>" + d["Name"] + "</b> <br/>" +
                            d["Type 1"] + "<br/>" +
                            d["Type 2"] + "<br/>")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 10) + "px");
        })
        .on("mouseout", (d) => {
            tooltipDiv.transition()
                .duration(500)
                .style("opacity", 0);
        });

}

// find min and max for arrays of x and y
function findMinMax(x, y) {
    // return formatted min/max data as an object
    return {
        xMin: d3.min(x),
        xMax: d3.max(x),
        yMin: d3.min(y),
        yMax: d3.max(y)
    };
}

function getScalers(axesMinMax) {
    // function to scale x value
    let xScale = d3.scaleLinear()
        .domain([axesMinMax.xMin - 10, axesMinMax.xMax + 10])
        .range([msm.marginAll, msm.width - msm.marginAll]);

        // function to scale y
    let yScale = d3.scaleLinear()
        .domain([axesMinMax.yMax + 50, axesMinMax.yMin - 50]) // give domain buffer
        .range([msm.marginAll, msm.height - msm.marginAll]);

    return {
        xScale: xScale,
        yScale: yScale
    };
}

// draw the axes and ticks
function drawAxes(scalers) {
    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(scalers.xScale);
    plotContainer.append("g")
        .attr('transform', 'translate(0, ' + (msm.height - msm.marginAll) + ')')
        .call(xAxis);
    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(scalers.yScale);
    plotContainer.append('g')
        .attr('transform', 'translate(' + msm.marginAll + ', 0)')
        .call(yAxis);
}

function drawAxesLabels() {
    plotContainer.append('text')
        .attr('x', (msm.width - 2 * msm.marginAll) / 2 - 130)
        .attr('y', msm.marginAll / 2 + 10)
        .style('font-size', '14pt')
        .text("Pokemon: Special Defense vs Total Stats");

    plotContainer.append('text')
        .attr('x', (msm.width - 2 * msm.marginAll) / 2 - 10)
        .attr('y', msm.height - 10)
        .style('font-size', '10pt')
        .text("Special Defense");

    plotContainer.append('text')
        .attr('transform', 'translate( 15,' + (msm.height / 2 + 30) + ') rotate(-90)')
        .style('font-size', '10pt')
        .text("Total Stats");
}

// returns the width of the text if the font is helvetica
function measureText(string, fontSize = 14) {
    const widths = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.0546875,0.4,0.6,0.8,0.8,1.1,0.9,0.4,0.6,0.5,0.6,0.8,0.4,0.5,0.4,0.5,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.4,0.4,0.8,0.8,0.8,0.8,1.2,0.9,0.9,0.9,0.9,0.9,0.8,1,0.9,0.4,0.7,0.9,0.8,1,0.9,1,0.9,1,0.9,0.9,0.8,0.9,0.9,1.2,0.9,0.9,0.8,0.5,0.5,0.5,0.7,0.9,0.5,0.8,0.8,0.7,0.7,0.8,0.5,0.7,0.7,0.4,0.5,0.8,0.4,1,0.7,0.8,0.8,0.7,0.6,0.7,0.5,0.7,0.7,1.1,0.7,0.7,0.7,0.6,0.4,0.6,0.8]
    const avg = 0.7342598684210524
    return string
      .split('')
      .map(c => c.charCodeAt(0) < widths.length ? widths[c.charCodeAt(0)] : avg)
      .reduce((cur, acc) => acc + cur) * fontSize
}