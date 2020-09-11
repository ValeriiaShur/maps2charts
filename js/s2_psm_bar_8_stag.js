$(document).ready(function () {
  //clean up if exists:
  if (d3.select("svg")) {
    d3.select("svg").remove();
  }

  const margin = { top: 30, right: 50, bottom: 100, left: 50 };
  const width = 750 - margin.left - margin.right;
  const height = 280 - margin.top - margin.bottom;
  // let animation;

  ToolTips.Init("body");

  const mapProjection = d3
    .geoMercator()
    .center([4.95, 52.05])
    .scale(29000)
    .translate([width / 2, height / 2]);

  const svgpath = d3.geoPath().projection(mapProjection);

  const svg = d3
    .select("#map")
    .append("svg")
    /* .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom) */
    .attr(
      "viewBox",
      `0 0 ` +
        (width + margin.left + margin.right) +
        ` ` +
        (height + margin.top + margin.bottom)
    )
    .attr("class", "mapSVG")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // asynchronously load geojson:
  async function drawMap() {
    const myTopoJson = await d3
      .json(
        "https://raw.githubusercontent.com/ValeriiaShur/geo-data/master/nl_8_staged_s2.json"
      )
      .catch((err) => {
        console.error(err);
      });

    const state_features = topojson.feature(
      myTopoJson,
      myTopoJson.objects.nl_8_staged_s2
    ).features;

    // sort the features descending based on aant_inw property
    state_features.sort(function (a, b) {
      return b.properties.value - a.properties.value;
    });

    // create domains, scales & axes from data:
    const x_domain = [];
    for (let i = 0; i < state_features.length; i++) {
      x_domain[i] = state_features[i].properties.name;
    }

    // setup x
    // const xScale = d3.scaleLinear().range([0, width]).domain(feature_domain); // value -> display
    const xScale = d3.scaleBand().range([0, width]).domain(x_domain);
    xScale.paddingInner(0.1);
    xScale.paddingOuter(0.5);

    const xAxis = d3.axisBottom().scale(xScale);

    // setup y
    // const yScale = d3.scaleLinear().range([height, 0]).domain(feature_domain); // value -> display
    const y_domain = [
      0,
      d3.max(state_features, function (d) {
        // return d.properties.aant_inw;
        return d.properties.value;
      }),
    ];
    const yScale = d3
      .scaleLinear()
      .range([height + margin.top, 0])
      .domain(y_domain);
    const yAxis = d3.axisLeft().scale(yScale);

    // x-axis
    const x_axis_g = svg
      .append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0,${height + margin.top})`)
      .call(xAxis)
      .style("opacity", 0);

    x_axis_g
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", "-.4em")
      .attr("transform", "rotate(-90)");

    // y-axis
    const y_axis_g = svg
      .append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .style("opacity", 0);

    // radius for legend
    const radius = d3.scaleLinear().domain([0, 100]).range([0, 15]);

    var legend = svg
      .append("g")
      .attr("fill", "none")
      .attr("transform", `translate(${width - 150},${height + 20})`)
      .attr("text-anchor", "middle")
      .style("font", "9px sans-serif")
      .selectAll("g")
      .data([10, 50, 100])
      .enter()
      .append("g");

    legend
      .append("circle")
      .attr("fill", function (d) {
        if (d.data == 10) {
          return "orange";
        }
        if (d.data == 50) {
          return "green";
        }
        if (d.data == 100) {
          return "yellow";
        }
      })
      .attr("fill-opacity", 0.5)
      .attr("stroke", "#ccc")
      .attr("cy", (d) => -radius(d))
      .attr("r", radius);

    // Add legend: segments
    legend
      .append("text")
      .attr("fill", "#ccc")
      .attr("y", (d) => -2 * radius(d))
      .attr("dy", "0.8em")
      .attr("dx", "2.5em")
      .text(d3.format(".1s"));

    // create new svg paths:
    const polyLayer = svg.append("g").attr("id", "polyLayer");
    polyLayer
      .selectAll("path")
      // bind the data:
      .data(state_features)
      .enter()
      // for each d create a path:
      .append("path")
      .attr("id", "polygonPathElement")
      .attr("class", "municipality")
      .attr("d", svgpath);

    // create bar chart AS PATHS , but dont draw them:
    const bPaths = []; // array for the paths, for later use in KUTE animation
    const bPaths2 = [];
    const barsLayer = svg.append("g").attr("id", "barsLayer");
    barsLayer
      .selectAll("g")
      // bind the data:
      .data(state_features)
      .enter()
      // for each d create a bar (as a PATH):
      .append("g") // just an empty g because we need no real svg drawing
      .attr("d", function (d, i) {
        // make a path out of the original circles:
        bPaths[i] = SVGTag2Path.Rect(
          xScale(d.properties.name),
          yScale(d.properties.value),
          xScale.bandwidth(),
          height + margin.top - yScale(d.properties.value)
        ); // no "return path" because we dont need them drawn!
      });
    barsLayer.remove(); // clean up

    // create svg circles AS PATHS :
    const cPaths = []; // array for the paths, for later use in KUTE animation
    const circleLayer = svg.append("g").attr("id", "circleLayer");
    circleLayer
      .selectAll("path")
      // bind the data:
      .data(state_features)
      .enter()
      // for each d create & draw a circle:
      .append("path")
      .attr("class", "propCircle")
      .attr("id", function (d, i) {
        return `elem${i}`;
      })
      .attr("d", function (d, i) {
        bPaths2[i] = SVGTag2Path.Rect(
          svgpath.centroid(d)[0] - 5,
          svgpath.centroid(d)[1] - 5,
          xScale.bandwidth() / 10,
          (height - yScale(d.properties.value)) / 10
        );
        // make a path out of the original circles:
        cPaths[i] = SVGTag2Path.Circle(
          svgpath.centroid(d)[0],
          svgpath.centroid(d)[1],
          (Math.sqrt(d.properties.value) / Math.PI) * 5
        );
        return cPaths[i];
      });
    // add ToolTips:
    /* .on("mouseenter", function (d) {
        const msg = `${d.properties.value}`; // ${d.properties.name}:
        ToolTips.Show(msg);
      })
      .on("mousemove", function (d) {
        ToolTips.Move(d3.event);
      })
      .on("mouseout", function () {
        ToolTips.Hide();
      }) */

    // create labels:
    const labelLayer = svg.append("g").attr("id", "labelLayer");
    labelLayer
      .selectAll("text")
      // bind the data:
      .data(state_features)
      .enter()
      // for each d create a label INSIDE a g(roup) for easy transformation later:
      .append("g")
      .attr("transform", function (d, i) {
        const xFrom = svgpath.centroid(d)[0];
        const yFrom = svgpath.centroid(d)[1];
        const transStr = `translate(${xFrom},${yFrom})`;
        return transStr;
      })
      .append("text")
      .attr("x", 0)
      .attr("y", 4)
      .attr("class", "labelText")
      .attr("font-size", 11)
      .style("text-anchor", "middle")
      .text(function (d) {
        return d.properties.name;
      });

    // Create the array of KUTE tweens for in and out tweening:
    const tweenIns = [];
    const tweenIns2 = [];
    const tweenOuts = [];
    try {
      for (let i = 0; i < cPaths.length; i++) {
        tweenIns[i] = KUTE.fromTo(
          `#elem${i}`,
          { path: cPaths[i] },
          { path: bPaths2[i] },
          { duration: 500 }
        );
        tweenIns2[i] = KUTE.fromTo(
          `#elem${i}`,
          { path: bPaths2[i] },
          { path: bPaths[i] },
          { duration: 2000 }
        );
        tweenOuts[i] = KUTE.fromTo(
          `#elem${i}`,
          { path: bPaths[i] },
          { path: cPaths[i] },
          { duration: 2000 }
        );
      }
    } catch (e) {
      console.error(e);
    }

    function addButton(text, callback) {
      d3.select("#buttons")
        .append("button")
        .text(text)
        .on("click", function () {
          this.disabled = true;
          callback.call(this);
        });
    }

    // --------------------------
    //
    // Tween to Bar Chart
    //
    // --------------------------
    addButton("Tween to Bar Chart", function (d, i) {
      // hide axis
      x_axis_g.transition().duration(1000).style("opacity", 1);
      y_axis_g.transition().duration(1000).style("opacity", 1);

      // run KUTE tweenIns:
      for (var i = 0; i < cPaths.length; i++) {
        tweenIns[i].start().chain(tweenIns2[i]);
      }

      legend.transition().duration(3000).style("opacity", 0);
      polyLayer.transition().duration(3000).style("opacity", 0);
      labelLayer.transition().duration(3000).style("opacity", 0);
    });
  }
  drawMap();
});
