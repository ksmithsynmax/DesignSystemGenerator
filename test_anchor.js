var sizes = ["xs", "sm", "md", "lg", "xl"];
var underlines = ["always", "hover", "never"];
var weights = ["regular", "semibold", "bold"];
var states = ["default", "hover", "visited", "disabled"];

function cap(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

var names = new Set();
for (var si = 0; si < sizes.length; si++) {
  var size = sizes[si];
  var capSize = size.toUpperCase();
  for (var ui = 0; ui < underlines.length; ui++) {
    var underline = underlines[ui];
    var capUnderline = cap(underline);
    for (var wi = 0; wi < weights.length; wi++) {
      var weight = weights[wi];
      var capWeight = cap(weight);
      for (var sti = 0; sti < states.length; sti++) {
        var state = states[sti];
        var capState = cap(state);
        var name = "Size=" + capSize + ", Underline=" + capUnderline + ", Weight=" + capWeight + ", State=" + capState;
        if (names.has(name)) {
          console.log("DUPLICATE:", name);
        }
        names.add(name);
      }
    }
  }
}
console.log("Total unique names:", names.size);
