/**
 * SVGTag2Path.js:
 *
 * Simple utility to convert SVG tags to basic SVG paths.
 * supports for now: circle, rect
 *
 * parts based on code from jbleuzen @  https://github.com/Waest/SVGPathConverter

 Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 License.
 see http://creativecommons.org/licenses/by-nc-sa/3.0/

 @author Barend Köbben - b.j.kobben@utwente.nl
 @version 1.0 [July 2020] *
 */

SVGTag2Path = {
  Init: function () {
    // nothing as of now
  },
  Circle: function (cx, cy, r) {
    var startX = cx - r,
      startY = cy;
    var endX = parseFloat(cx) + parseFloat(r),
      endY = cy;
    var newElementPath =
      "M" +
      startX +
      "," +
      startY +
      "A" +
      r +
      "," +
      r +
      " 0,1,1 " +
      endX +
      "," +
      endY +
      "A" +
      r +
      "," +
      r +
      " 0,1,1 " +
      startX +
      "," +
      endY +
      "Z";
    return newElementPath;
  },
  Rect: function (x, y, width, height) {
    var newElementPath =
      "M" +
      x +
      "," +
      y +
      "L" +
      (x + width) +
      "," +
      y +
      "L" +
      (x + width) +
      "," +
      (y + height) +
      "L" +
      x +
      "," +
      (y + height) +
      "L" +
      x +
      "," +
      y +
      "Z";
    return newElementPath;
  },
};
