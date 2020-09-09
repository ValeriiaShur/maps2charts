/**
 * Toolltips.js:
 * D3 based tooltips for HTML and/or SVG graphics
 * Needs D3.js lib loaded
 *
 * Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 License.
 * see http://creativecommons.org/licenses/by-nc-sa/3.0/
 *
 * @author Barend Köbben - b.j.kobben@utwente.nl
 * * @version 1.0 [October 2017] *
 */

ToolTips = {
  // parent = HTML or SVG element to be attached to (usually: "body")
  Init: function (parent) {
    tooltip = d3
      .select(parent)
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
    tooltip.append("div").attr("class", "tooltip-text");
  },
  Show: function (txt) {
    tooltip.transition().duration(250).style("opacity", 1);
    tooltip.select(".tooltip-text").text(txt);
  },
  Move: function (event) {
    tooltip
      .style("left", event.pageX + 7 + "px")
      .style("top", event.pageY + 12 + "px");
  },
  Hide: function () {
    tooltip.transition().duration(250).style("opacity", 0);
  },
};
