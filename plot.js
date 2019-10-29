"use-strict";

let allData;
let filteredData;
let genSelection;
let legendSelection;
let plotContainer;
let legendContainer;
let tooltipDiv;
let scalers;
const msm = {
    width: 1000,
    height: 800,
    marginAll: 50,
}

const colors = {
    "Bug": "#A6B91A",
    "Dark": "#705746",
    "Dragon": "#6F35FC",
    "Electric": "#F7D02C",
    "Fairy": "#D685AD",
    "Fighting": "#C22E28",
    "Fire": "#EE8130",
    "Flying": "#A98FF3",
    "Ghost": "#735797",
    "Grass": "#7AC74C",
    "Ground": "#E2BF65",
    "Ice": "#96D9D6",
    "Normal": "#A8A77A",
    "Poison": "#A33EA1",
    "Psychic": "#F95587",
    "Rock": "#B6A136",
    "Steel": "#B7B7CE",
    "Water": "#6390F0"
}

const mouseOverFunc = selection =>
    selection.transition()
    .duration(300)
    .style("opacity", 1)
    .attr("r", 13);

const mouseOutFunc = selection =>
    selection.transition()
    .duration(500)
    .style("opacity", .8)
    .attr("r", 10)

window.onload = function () {
    plotContainer = d3.select("#plot")
        .append('svg')
        .attr('width', msm.width)
        .attr('height', msm.height);
    legendContainer = d3.select("#legend")
        .append('svg')
        .attr('width', 200)
        .attr('height', msm.height)
    tooltipDiv = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    d3.csv("pokemon.csv")
        .then((d) => main(d))
}

function main(d) {
    allData = d;
    filteredData = d;
    makeScatterPlot(d);
    addTypeLegend(d);
    legendSelection = "All";
    genSelection = "All";
    makeGenerationFilter();
    makeLegendaryFilter();
}

function makeLegendaryFilter() {
    d3.selectAll("input").on("change", function () {
        legendSelection = this.value;
        let toBeFiltered = allData;
        if (genSelection !== "All") {
            toBeFiltered = allData.filter((row) => {
                return row["Generation"] === genSelection
            });
        }
        if (legendSelection === "All") {
            filteredData = toBeFiltered;
        } else {
            filteredData = toBeFiltered.filter((row) => {
                return row["Legendary"] === legendSelection
            });
        }
        // plotContainer.selectAll("*").remove()
        // makeScatterPlot(filteredData)
        transitionDots(filteredData);
        addTypeLegend(filteredData);
    });
}

function makeGenerationFilter() {
    let dropDown = d3.select("#filter").append("select")
        .attr("name", "generation");

    let distinctGens = [...new Set(allData.map(d => d["Generation"]))];
    distinctGens.push("All")

    dropDown.selectAll("option")
        .data(distinctGens)
        .enter()
        .append("option")
        .text(function (d) {
            return d;
        })
        .attr("value", function (d) {
            return d;
        })
        .attr("selected", function (d) {
            return d === "All"
        })

    dropDown.on("change", function () {
        let oldLength = filteredData.length;
        genSelection = this.value;
        let toBeFiltered = allData;
        if (legendSelection !== "All") {
            toBeFiltered = allData.filter((row) => {
                return row["Legendary"] === legendSelection
            });
        }
        if (genSelection === "All") {
            filteredData = toBeFiltered;
        } else {
            filteredData = toBeFiltered.filter((row) => {
                return row["Generation"] === genSelection
            });
        }
        //plotContainer.selectAll("*").remove();
        //makeScatterPlot(filteredData);
        transitionDots(filteredData);
        addTypeLegend(filteredData);
    });
}

function transitionDots(filteredData) {
    let circles = plotContainer.selectAll("circle")
        .data(filteredData)

    // add new circles if they aren't already there
    // and merge with the circles already there
    circles
        .enter()
        .append("circle")
        .on("mouseover", (d, i, nodes) => {
            dotMouseOver(d, i, nodes);
        })
        .on("mouseout", (_, i, nodes) => {
            dotMouseOut(i, nodes);
        })
        .merge(circles)
        .transition()
        .duration(1000)
        .attr("cx", function (d) {
            return scalers.xScale(d["Sp. Def"]);
        })
        .attr("cy", function (d) {
            return scalers.yScale(d["Total"]);
        })
        .attr("r", 10)
        .attr('stroke', "black")
        .attr('stroke-width', 1)
        .attr('fill', function (d) {
            return colors[d["Type 1"]]
        })
        .style('opacity', .8)
        
        

    // get rid of circles that aren't in the data anymore
    circles.exit()
        .transition()
        .duration(1000)
        .style("opacity", 0)
        .remove()
}

function makeScatterPlot(data) {
    let spDef = data.map((row) => parseInt(row["Sp. Def"]));
    let total = data.map((row) => parseInt(row["Total"]));
    let axesMinMax = findMinMax(spDef, total);
    scalers = getScalers(axesMinMax);
    drawAxes(scalers);
    drawAxesLabels();
    plotData(scalers, data);
}

function addTypeLegend(data) {
    const typeArray = Object.keys(colors)
    legendContainer.selectAll("*").remove()
    let distinctType1 = [...new Set(data.map(d => d["Type 1"]))];
    let intersection = typeArray.filter(x => distinctType1.includes(x))
    legendContainer.append('g')
        .selectAll("text")
        .data(intersection)
        .enter()
        .append("text")
        .attr("x", 35)
        .attr("y", function (d, i) {
            return 145 + (i * 30)
        })
        .text(function (d) {
            return d
        })

    let colorInter = [];
    intersection.forEach(function (element) {
        colorInter.push(colors[element])
    })
    legendContainer.append('g')
        .selectAll("rect")
        .data(colorInter)
        .enter()
        .append("rect")
        .attr("x", 10)
        .attr("y", function (_, i) {
            return 130 + (i * 30)
        })
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", function (d) {
            return d
        })

    legendContainer.append("text")
        .attr("x", 10)
        .attr("y", 110)
        .text("Type 1")
}

function plotData(scalers, data) {
    d3.selection.prototype.moveToFront = function () {
        return this.each(function () {
            this.parentNode.appendChild(this);
        });
    };

    // add dots
    plotContainer.append('g')
        .selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function (d) {
            return scalers.xScale(d["Sp. Def"]);
        })
        .attr("cy", function (d) {
            return scalers.yScale(d["Total"]);
        })
        .attr("r", 10)
        .attr('stroke', "black")
        .attr('stroke-width', 1)
        .attr('fill', function (d) {
            return colors[d["Type 1"]]
        })
        .attr("class", "circles")
        .style('opacity', .8)
        .on("mouseover", (d, i, nodes) => {
            dotMouseOver(d, i, nodes);
        })
        .on("mouseout", (_, i, nodes) => {
            dotMouseOut(i, nodes);
        });
}

function dotMouseOut(i, nodes) {
    tooltipDiv.transition()
        .duration(500)
        .style("opacity", 0);
    d3.select(nodes[i])
        .call(mouseOutFunc);
}

function dotMouseOver(d, i, nodes) {
    d3.select(nodes[i])
        .call(mouseOverFunc);
    d3.select(nodes[i]).moveToFront();
    tooltipDiv.transition()
        .duration(200)
        .style("opacity", 1)
    tooltipDiv.html("<b>" + d["Name"] + "</b> <br/>" +
            d["Type 1"] + "<br/>" +
            d["Type 2"] + "<br/>")
        .style("left", (d3.event.pageX + 5) + "px")
        .style("top", (d3.event.pageY - 10) + "px");
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
        .domain([axesMinMax.yMax + 20, axesMinMax.yMin - 20]) // give domain buffer
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