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
    .center([6.7, 52.2])
    .scale(20000)
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
        "https://raw.githubusercontent.com/ValeriiaShur/geo-data/master/nl_5_static.json"
      )
      .catch((err) => {
        console.error(err);
      });

    const state_features = topojson.feature(
      myTopoJson,
      myTopoJson.objects.nl_5_static
    ).features;

    // sort the features descending based on aant_inw property
    /* state_features.sort(function (a, b) {
          return b.properties.value - a.properties.value;
        }); */

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
      .style("opacity", 1);

    x_axis_g
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", "-.4em")
      .attr("transform", "rotate(-90)")
      .style("opacity", 1);

    // y-axis
    const y_axis_g = svg
      .append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .style("opacity", 1);

    // color scale
    var colorScale = d3
      .scaleQuantize()
      .domain(y_domain)
      .range(d3.schemeBlues[5]);

    // create new svg paths:
    // const pPaths = [];
    const polyLayer = svg.append("g").attr("id", "polyLayer");
    polyLayer
      .selectAll("path")
      // bind the data:
      .data(state_features)
      .enter()
      // for each d create a path:
      .append("path")
      .attr("id", "polygonPathElement")
      .attr("class", "municipality-choropleth")
      .attr("d", svgpath)
      .attr("fill", (d) => colorScale(d.properties.value));
    polyLayer.style("opacity", 0.01);

    // create bar chart AS PATHS , but dont draw them:
    const bPaths = []; // array for the paths, for later use in KUTE animation
    const barsLayer = svg.append("g").attr("id", "barsLayer");
    barsLayer
      .selectAll("path")
      // bind the data:
      .data(state_features)
      .enter()
      // for each d create a bar (as a PATH):
      .append("path") // just an empty g because we need no real svg drawing
      //.attr("class", "bars")
      .attr("fill", (d) => colorScale(d.properties.value))
      .style("opacity", 0.9)
      .style("stroke", "#bebdb8")
      .attr("id", function (d, i) {
        return `elem${i}`;
      })
      .attr("d", function (d, i) {
        // make a path out of the original polygon:
        bPaths[i] = SVGTag2Path.Rect(
          xScale(d.properties.name),
          yScale(d.properties.value),
          xScale.bandwidth(),
          height + margin.top - yScale(d.properties.value)
        );
        return bPaths[i];
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

    // create svg polygons of units AS PATHS :
    const pPaths = []; // array for the paths, for later use in KUTE animation
    const pPathsStart = [];
    const choroPoly = svg.append("g").attr("id", "choroPoly");
    choroPoly
      .selectAll("path")
      // bind the data:
      .data(state_features)
      .enter()
      // for each d create & draw a circle:
      .append("path")
      .attr("class", "propChoroPoly")
      .attr("id", function (d, i) {
        return `elem${i}`;
      })
      .attr("d", function (d, i) {
        // make a path out of the polygons:
        pPaths[i] = svgpath(d);
        return pPaths[i];
      });

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
        return d.properties.id;
      });
    labelLayer.style("opacity", 0.01);

    // Create the array of KUTE tweens for in and out tweening:
    const tweenIns = [];
    const tweenOuts = [];
    try {
      for (let i = 0; i < pPaths.length; i++) {
        tweenIns[i] = KUTE.fromTo(
          `#elem${i}`,
          { path: pPaths[i] },
          { path: bPaths[i] },
          { duration: 3000 }
        );
        tweenOuts[i] = KUTE.fromTo(
          `#elem${i}`,
          { path: bPaths[i] },
          { path: pPaths[i] },
          { duration: 3000 }
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
    // Tween to Choropleth
    //
    // --------------------------
    addButton("Tween to Choropleth", function () {
      // hide axis
      x_axis_g.transition().duration(3000).style("opacity", 0);
      y_axis_g.transition().duration(3000).style("opacity", 0);

      // run KUTE tweenOuts:
      for (let i = 0; i < pPaths.length; i++) {
        tweenOuts[i].start();
      }

      polyLayer
        .transition()
        .duration(4500) // slightly longer to avoid taking attention
        .style("opacity", 1);
      labelLayer
        .transition()
        .duration(4500) // slightly longer to avoid taking attention
        .style("opacity", 1);
    });
  }
  drawMap();
});
