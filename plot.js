"use-strict";

let allData;
let filteredData;
let plotContainer;
let legendContainer;
const msm = {
    width: 1000,
    height: 800,
    marginAll: 50,
    marginLeft: 50,
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

window.onload = function () {
    plotContainer = d3.select("#plot")
        .append('svg')
        .attr('width', msm.width)
        .attr('height', msm.height);
    legendContainer = d3.select("#legend")
        .append('svg')
        .attr('width', 200)
        .attr('height', msm.height);
    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("pokemon.csv")
        .then((d) => main(d))
}

function main(d) {
    allData = d;
    makeScatterPlot(d);
    addTypeLegend();
    makeGenerationFilter();
}

function makeGenerationFilter() {
    let dropDown = d3.select("#filter").append("select")
        .attr("name", "generation");

    let distinctGens = [...new Set(allData.map(d => d["Generation"]))];
    distinctGens.push("All")
    let defaultGen = "All";

    let options = dropDown.selectAll("option")
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
            return d === defaultGen
        })

    // showCircles(dropDown.node()); //this will filter initially
    dropDown.on("change", function () {
        // showCircles(this)
        let selected = this.value;
        if (selected === "All") {
            filteredData = allData;
        } else {
            filteredData = allData.filter((row) => {
                return row["Generation"] === selected
            })
        }
        plotContainer.selectAll("*").remove()
        makeScatterPlot(filteredData)
    });
}

function makeScatterPlot(data) {
    let spDef = data.map((row) => parseInt(row["Sp. Def"]));
    let total = data.map((row) => parseInt(row["Total"]));
    let axesMinMax = findMinMax(spDef, total);
    let scalers = getScalers(axesMinMax);
    drawAxes(scalers);
    drawAxesLabels();
    plotData(scalers, data);
}

function addTypeLegend() {
    let colorArray = Object.values(colors)
    legendContainer.append('g')
        .selectAll("rect")
        .data(colorArray)
        .enter()
        .append("rect")
        .attr("x", 10)
        .attr("y", function (d, i) {
            return 130 + (i * 30)
        })
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", function (d) {
            return d
        })
    let typeArray = Object.keys(colors)
    legendContainer.append('g')
        .selectAll("text")
        .data(typeArray)
        .enter()
        .append("text")
        .attr("x", 35)
        .attr("y", function (d, i) {
            return 145 + (i * 30)
        })
        .text(function (d) {
            return d
        })
}

function plotData(scalers, data) {
    // make tooltip
    let tooltipDiv = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    const mouseOverFunc = selection =>
        selection.transition()
        .duration(300)
        .style("opacity", 1)
        .attr("r", 16);

    const mouseOutFunc = selection =>
        selection.transition()
        .duration(500)
        .style("opacity", .8)
        .attr("r", 10)

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
        })
        .on("mouseout", (d, i, nodes) => {
            tooltipDiv.transition()
                .duration(500)
                .style("opacity", 0);
            d3.select(nodes[i])
                .call(mouseOutFunc);
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