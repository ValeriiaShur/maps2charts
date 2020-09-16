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
    .scale(10000)
    .center([11.2, 48.25])
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
        "https://raw.githubusercontent.com/ValeriiaShur/geo-data/master/de_8_staged.json"
      )
      .catch((err) => {
        console.error(err);
      });

    const state_features = topojson.feature(
      myTopoJson,
      myTopoJson.objects.de_8_staged
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
      .attr("transform", "rotate(-90)");

    // y-axis
    const y_axis_g = svg
      .append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .style("opacity", 1);

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
    polyLayer.style("opacity", 0.01);

    // create bars AS PATHS , but dont draw them:
    const bPaths = []; // array for the paths, for later use in KUTE animation
    const cPaths2 = [];
    const barsLayer = svg.append("g").attr("id", "barsLayer");
    barsLayer
      .selectAll("path")
      // bind the data:
      .data(state_features)
      .enter()
      // for each d create a bar (as a PATH):
      .append("path") // just an empty g because we need no real svg drawing
      .attr("class", "bars")
      .style("fill", "rgba(255, 0, 0)")
      .attr("id", function (d, i) {
        return `elem${i}`;
      })
      .attr("d", function (d, i) {
        // make a path out of the original bars:
        bPaths[i] = SVGTag2Path.Rect(
          xScale(d.properties.name),
          yScale(d.properties.value),
          xScale.bandwidth(),
          height + margin.top - yScale(d.properties.value)
        );
        cPaths2[i] = SVGTag2Path.Circle(
          xScale(d.properties.name) + xScale.bandwidth() / 2,
          yScale(d.properties.value) +
            (height - yScale(d.properties.value)) / 2,
          (height + margin.top - yScale(d.properties.value)) / 3
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

    // create svg circles AS PATHS :
    const cPaths = []; // array for the paths, for later use in KUTE animation
    const circleLayer = svg.append("g").attr("id", "circleLayer");
    circleLayer
      .selectAll("g")
      // bind the data:
      .data(state_features)
      .enter()
      // for each d create & draw a circle:
      .append("g")
      .attr("d", function (d, i) {
        // make a path out of the original circles:
        cPaths[i] = SVGTag2Path.Circle(
          svgpath.centroid(d)[0],
          svgpath.centroid(d)[1],
          (Math.sqrt(d.properties.value) / Math.PI) * 5
        );
      });
    circleLayer.remove(); // clean up

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
    labelLayer.style("opacity", 0);

    // Create the array of KUTE tweens for in and out tweening:
    const tweenIns = [];
    const tweenOuts = [];
    const tweenOuts2 = [];
    try {
      for (let i = 0; i < cPaths.length; i++) {
        tweenIns[i] = KUTE.fromTo(
          `#elem${i}`,
          { path: cPaths[i] },
          { path: bPaths[i] },
          { duration: 500 }
        );
        tweenOuts[i] = KUTE.fromTo(
          `#elem${i}`,
          { path: bPaths[i] },
          { path: cPaths2[i] },
          { duration: 500 }
        );
        tweenOuts2[i] = KUTE.fromTo(
          `#elem${i}`,
          { path: cPaths2[i] },
          { path: cPaths[i] },
          { duration: 1500 }
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
    // Tween to Proportional symbol map
    //
    // --------------------------
    addButton("Tween to Proportional symbol", function () {
      // hide axis
      x_axis_g.transition().duration(2000).style("opacity", 0);
      y_axis_g.transition().duration(3000).style("opacity", 0);

      // run KUTE tweenOuts:
      for (let i = 0; i < cPaths.length; i++) {
        tweenOuts[i].start().chain(tweenOuts2[i]);
      }

      polyLayer
        .transition()
        .duration(4500) // slightly longer to avoid taking attention
        .ease(d3.easeLinear)
        .style("opacity", 1);
      labelLayer
        .transition()
        .duration(4500) // slightly longer to avoid taking attention
        .ease(d3.easeLinear)
        .style("opacity", 1);
    });
  }
  drawMap();
});
