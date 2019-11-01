    /**
   * @classdesc The visualization generation of IPSA is driven by the AngularJS directive coded below. This directive will embed an SVG element into a <div>
   *    Javascript objects are listed as attributes to the div tag and provide the script with the variables needed to generated the interactive annotated spectrum
   * @example <div annotated-spectrum plotdata="set.plotData" peptide="set.peptide" settings="set.settings" class="content"></div>
   */
var chartModule = angular.module("qtl.groups", []);

// LOD PLOT that is actually rendering
chartModule.directive("lodLineChart", function($log) {
    
    /**
    * @description The directive variable used to the initiate the 2-way binding between this template and the controller
    * @property {string} directive.restrict - Restricts the directive to attribute and elements only
    * @property {object} directive.scope - Holds objects containing spectral data, peptide data, and visualization settings
    * @property {object} directive.scope.plotdata - Contains the numerical, ordinal, and categorical data required to generate the visualization
    * @property {object} directive.scope.peptide - Contains ms2 scan number, peptide sequence, precursor mz, charge, and modifications
    * @property {object} directive.scope.settings - Contains tolerance type (ppm/Da), tolerance threshold, and ionization mode
    */
    var directive = {
      restrict: 'AE',
      scope: {
        plotdata: '=?',
        svgsize: '=?'
      }
    };

    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-15, 0]);

    /**
    * @description Links the IPSA directive to the annotatedSpectrum HTML tag and retrieves the tag attributes.
    */
    directive.link = function(scope, elements, attr) {

      scope.getSvgSize = function () {
        return scope.svgsize;
      }

      scope.initialize = function() {
        var svgSize = scope.getSvgSize();

        // create svg element to hold charts
        scope.svg = d3.select(elements[0]).append("svg").attr("class", "chart");

        // main svg container to hold spectrum annotations
        scope.container = scope.svg.append("g");

        scope.lodContainer = scope.container.append("g").attr("id", "lodContainer");

        scope.lodMouseover = scope.container.append("rect")
          .attr("id", "lodMouseover")
          .attr("fill", "none")
          .attr("x", "0")
          .attr("y", "0")
          .attr("pointer-events", "all")
          .attr('width', svgSize.width - svgSize.width * svgSize.padding)
          .attr('height', svgSize.height);

        scope.lodMouseover.call(tip);
        
        scope.container.append("g")
          .attr("class", "xLod")

        scope.container.append("g")
          .attr("class", "yLod")
          .append("text")
          .attr("class", "yLodLabel")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - svgSize.margin.left)
          .attr("x", 0 - (svgSize.height * 1 / 2))
          .attr("dy", "1em")
          .text("LOD Score");

        // dummy top axis
        scope.container.append("g")
          .attr("class", "xBorder");

        scope.container.append("g")
          .attr("class", "yBorder");

        // place a clip mask over the annotated spectrum container to prevent svg elements from displaying out of the SVG when zooming. 
        scope.lodContainer.append("clipPath")
          .attr("id", "lodClippy")
          .append("rect")
          .attr("x", "0")
          .attr("y", "0")
          .attr('width', svgSize.width - svgSize.width * svgSize.padding)
          .attr('height', svgSize.height);

        scope.container.attr("transform", "translate(" + svgSize.margin.left + ", " + (svgSize.margin.top) +  ")")
        scope.lodContainer.attr("clip-path", "url(#lodClippy)");

        scope.setSvgSize();
      };
       
      scope.setSvgSize = function() {
        var svgSize = scope.getSvgSize();

        scope.svg.attr('viewBox','0 0 '+ (svgSize.width + svgSize.margin.left + svgSize.margin.right) + ' ' +
            (svgSize.height  + svgSize.margin.bottom))
          //.attr('preserveAspectRatio','xMinYMin');
        scope.redraw();
      };

      scope.redraw = function() {
        scope.drawGroups();
      };

      scope.getX = function () {
        return scope.plotdata.lodPlot.x;
      };

      scope.getLodValues = function() {
        return scope.plotdata.lodPlot.y;
      };

      scope.getMax = function(alleleEffectPlots) {
        return d3.max(alleleEffectPlots, function(array) {
          return d3.max(array);
        });
      };

      scope.getMin = function(alleleEffectPlots) {
        return d3.min(alleleEffectPlots, function(array) {
          return d3.min(array);
        });
      };

      scope.getRange = function(alleleEffectPlots) {
        let max = d3.max(alleleEffectPlots, function(array) {
          return d3.max(array);
        });

        let min = d3.min(alleleEffectPlots, function(array) {
          return d3.min(array);
        });

        return max - min;
      };

      scope.getQtl = function() {
      	return scope.plotdata.qtl;
      }

      scope.formatPosition = function(genePosition) {
        var prefix = d3.formatPrefix(genePosition);

        return d3.round(prefix.scale(genePosition), 3) + " " + prefix.symbol + "bp";
      }

      scope.formatLines = function(lineXArray, lineYArray) {
        var returnArray = [];

        for (var i = 0; i < lineXArray.length; i++) {
          returnArray.push({
            x: lineXArray[i],
            y: lineYArray[i]
          });
        }

        return returnArray;
      };

      scope.convertToPlotData = function(allelePoints, names, colors) {
        var returnArray = [];

        for (var i = 0; i < allelePoints.length; i++) {
          returnArray.push({
            points: allelePoints[i], 
            name: names[i],
            color: colors[i]
          });
        }
        return returnArray;
      }

      scope.drawGroups = function() {
        var x, y, lodXAxis, lodYAxis, lineDataset, xValues = scope.getX(), lodValues = scope.getLodValues(),
          svgSize = scope.getSvgSize(), qtl = scope.getQtl(); /*names = scope.getNames()*/

        if (isNaN(d3.max(xValues))) {
          xValues = [0];
        }
        if (isNaN(d3.max(lodValues))) {
          lodValues = [0];
        }

        if (xValues && lodValues) {
          var xScaleFudgeFactor = (d3.max(xValues) - d3.min(xValues)) * .025;
          var lodYScaleFudgeFactor = (d3.max(lodValues) - d3.min(lodValues)) * .15;

          x = d3.scale.linear().domain([d3.min(xValues), d3.max(xValues)]).range([ 0, svgSize.width - svgSize.width * svgSize.padding]);
          y = d3.scale.linear().domain([0, d3.max(lodValues) + lodYScaleFudgeFactor]).range([ svgSize.height, 0 ]);

          xAxis = d3.svg.axis().scale(x).orient("bottom").tickValues([]);
          yAxis = d3.svg.axis().scale(y).orient("left").ticks(5);
          xBorder = d3.svg.axis().scale(x).tickValues([]);
					yBorder = d3.svg.axis().scale(y).orient("left").tickValues([]);

          // dummy axes 
          scope.container.selectAll("g.xBorder").attr("transform", "translate(0, 0)").call(xBorder);
          scope.container.selectAll("g.yBorder").attr("transform", "translate(" + (svgSize.width - svgSize.width * svgSize.padding) +", 0)").call(yBorder);

          var line = d3.svg.line()
          .x(function(d) { 
            return x(d.x); })
          .y(function(d) { 
            return y(d.y); 
          }).interpolate("linear");

	        var transitionLine = d3.svg.line()
	        	.x(function(d) {
	        		return x(d.x); 
	        	}).y(function(d) {
	        		return y(y.domain()[0]);
	        	});

	        if (xValues.length > 1) {
	        	// add an extra vertical path to mark where the qtl is
	          var baseLine = [{
	            lineData: 
	              [
	                {x: (qtl.position - xScaleFudgeFactor * .2), y: y.domain()[1]}, 
	                {x: (qtl.position), y: qtl.lod + (y.domain()[1] - y.domain()[0]) * .01},
	                {x: (qtl.position + xScaleFudgeFactor * .2), y: y.domain()[1]}
	              ],
	            color: "#45CCBF",
	            fill: "#cc6666"
	          }];

	          var vertLine = scope.lodContainer.selectAll(".qtlIndicator").data(baseLine);
	        
	          vertLine.enter().append("path").attr("class", "qtlIndicator");

	          vertLine.style("stroke", function(d) {
	            return d.color;
	          }).style("fill", function(d) {
	          	return d.fill;
	          }).attr("opacity", 0)
	          .attr("d", function(d) {
	            return transitionLine(d.lineData); 
	          })
	          .transition()
	          .duration(2000)
	          .attr("opacity", 1)
	          .attr("d", function(d) {
	            return line(d.lineData); 
	          });

	          vertLine.exit().remove();
	        }

          // convert all lines to points;
          var lodPoints = [];

          lodPoints.push(scope.formatLines(xValues, lodValues));

          plotData = scope.convertToPlotData(lodPoints, ["LOD"], ["#675EA8"]); 

          lodDataset = scope.lodContainer.selectAll(".line").data(plotData);
          lodDataset.enter().append("path").attr("class", "line");

          lodDataset.attr('stroke-width', function(d) { 
            return 2; 
          }).attr('stroke', function(d) {
            return d.color; 
          }).attr("d", function(d) {
          	return transitionLine(d.points);
          }).attr("opacity", .25)
          .transition()
          .duration(2000)
          .attr("d", function(d) {
          	return line(d.points);
          }).attr("opacity", 1);

          // remove unneeded lines
          lodDataset.exit().remove();
          
          // add invisible circles to use as a 'focus' when hovering over the plot
          var circleData = plotData[0];

          var circleDataset = scope.lodContainer.selectAll(".circle").data(circleData.points);

          circleDataset.enter().append("circle").attr("class", "circle");

          circleDataset.attr("opacity", 0)
          .attr('r', function(d) { 
            return 5; 
          }).attr('stroke-width', function(d) { 
            return 2; 
          }).attr('stroke', function(d) {
            return "#675EA8"; 
          }).attr('fill', function(d) {
            return "#e57777"; 
          }).attr("cx", function(d) {
            return x(d.x);
          }).attr("cy", function(d) {
            return y(d.y);
          });

          // remove unneeded lines
          circleDataset.exit().remove();

          // set a line for LOD = 6. Significance
          // Define the points
          var baseLine = [{
            lineData: 
              [
                {x: x.domain()[0], y: 6}, 
                {x: x.domain()[1], y: 6}
              ],
            color: "#777777"
          }];

          // draw the zero line
          var significanceLine = scope.lodContainer.selectAll(".zeroline").data(baseLine);
          significanceLine.enter().append("path").attr("class", "zeroline");

          significanceLine.attr("d", function(d) {
            return line(d.lineData); 
          }).attr("opacity", 0).style("stroke", function(d) {
            return d.color;
          }).transition().duration(1500).attr("opacity", 1);

          significanceLine.exit().remove();

          // add text element for qtl
          var qtlText = scope.lodContainer.selectAll(".qtlLabel").data([qtl]);

          if (qtl.hasOwnProperty("position")) {
            qtlText.enter().append("text").attr("class", "qtlLabel");

            qtlText.attr("opacity", 0)
            .attr("x", function(d) {
              if (d.position > (x.domain()[1] - x.domain()[0]) / 2) {
                return x(d.position) - 33; 
              } else {
                return x(d.position) + 9; 
              }
            }).attr("y", function(d) {
              return y(y.domain()[0]); 
            }).text("QTL")
            .transition()
            .duration(1750)
            .attr("y", function(d) {
              return y(y.domain()[1] * .90); 
            })
            .attr("opacity", 1);
          }

          qtlText.exit().remove();

          scope.container.selectAll("g.xLod").attr("transform", "translate(0, " + svgSize.height + ")").call(xAxis);
          scope.container.selectAll("g.yLod").call(yAxis);

          // bind event handlers to our mouseover box to track what point of the LOD curve should be highlighted.
          scope.lodMouseover.on("mouseout", function() {
            circleDataset.attr("opacity", function(d, i) {
              return 0;
            });

            tip.hide();
          }).on("mousemove", function() {
            // get the x svg coordinate of the mouse
            var xCoordinate = d3.mouse(this)[0];

            // translate it into our domain coordinates
            var translatedCoordinate = x.invert(xCoordinate);
            
            var circles = circleDataset[0];

            var targetCircle = {
              x: Number.MIN_VALUE,
              y: Number.MIN_VALUE,
              delta: Number.MAX_VALUE, 
              i: -1
            };

            // get closest circle to the mouse's x coordinate
            for (var i = 0; i < circleData.points.length; i++) {
              var delta = Math.abs(circleData.points[i].x - translatedCoordinate);

              if (delta < targetCircle.delta) {
                targetCircle.x = circleData.points[i].x;
                targetCircle.y = circleData.points[i].y;
                targetCircle.i = i;
                targetCircle.delta = delta;
              }
            }

            // define the inner HTML of the tooltip
            tip.html(function () {

              let tipText = "<strong style='color: #31c4ae'>Position:</strong> <span style='color: #e8e8e8'>" + scope.formatPosition(targetCircle.x) + " </span><br><br>"
                              + "<strong style='color: #31c4ae'>Logarithm Of Odds Score:</strong> <span style='color: #e8e8e8'>" + d3.format(".3f")(targetCircle.y) + " </span>";
                return tipText;
            });

            circleDataset.attr("opacity", function(d, i) {
              if (i == targetCircle.i) {
                tip.show(d, circles[i]);
                return 1;
              } else {
                return 0;
              }
            });
          });
        }
      };

      scope.handleMouseOut = function() {
        circleDataset.attr("opacity", function(d, i) {
          return 0;
        });

        tip.hide();
      };

      /**
       * Watch model changes
       */
      scope.$watch('plotdata.lodPlot', scope.redraw, true);
      scope.$watch('options', scope.setSvgSize);
       
      scope.initialize();
    };
     
    return directive; 
});

// allele effects and LOD curves
chartModule.directive("alleleEffectsChart", function($log) {
    
    /**
    * @description The directive variable used to the initiate the 2-way binding between this template and the controller
    * @property {string} directive.restrict - Restricts the directive to attribute and elements only
    * @property {object} directive.scope - Holds objects containing spectral data, peptide data, and visualization settings
    * @property {object} directive.scope.plotdata - Contains the numerical, ordinal, and categorical data required to generate the visualization
    * @property {object} directive.scope.peptide - Contains ms2 scan number, peptide sequence, precursor mz, charge, and modifications
    * @property {object} directive.scope.settings - Contains tolerance type (ppm/Da), tolerance threshold, and ionization mode
    */
    var directive = {
      restrict: 'AE',
      scope: {
        plotdata: '=?',
        svgsize: '=?'
      }
    };

    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-15, 0]);

    /**
    * @description Links the IPSA directive to the annotatedSpectrum HTML tag and retrieves the tag attributes.
    */
    directive.link = function(scope, elements, attr) {

      scope.getSvgSize = function () {
        return scope.svgsize;
      }

      scope.initialize = function() {
        var svgSize = scope.getSvgSize();

        // create svg element to hold charts
        scope.svg = d3.select(elements[0]).append("svg").attr("class", "chart");

        // main svg container to hold spectrum annotations
        scope.container = scope.svg.append("g");

        scope.alleleContainer = scope.container.append("g").attr("id", "alleleContainer");

        scope.alleleMouseover = scope.container.append("rect")
          .attr("id", "alleleMouseover")
          .attr("fill", "none")
          .attr("x", "0")
          .attr("y", "0")
          .attr("pointer-events", "all")
          .attr('width', svgSize.width - svgSize.width * svgSize.padding)
          .attr('height', svgSize.height);

        scope.alleleMouseover.call(tip);

        scope.container.append("g")
          .attr("class", "xAllele")
          .append("text")
          .attr("class", "xLodLabel")
          .attr("transform","translate(" + (svgSize.width/2) + " ," + (svgSize.margin.bottom - 5) + ")")
          .text("Genomic Position");

        scope.container.append("g")
          .attr("class", "yAllele")
          .append("text")
          .attr("class", "yAlleleLabel")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - svgSize.margin.left)
          .attr("x", 0 - (svgSize.height * 1 / 2))
          .attr("dy", "1em")
          .text("Allele Effect");

        // dummy top axis
        scope.container.append("g")
          .attr("class", "xBorder")
          .append("text");

        scope.container.append("g")
          .attr("class", "yBorder");

        scope.container.attr("transform", "translate(" + svgSize.margin.left + ", " + (svgSize.margin.top) +  ")")

        scope.alleleContainer.append("clipPath")
          .attr("id", "alleleClippy")
          .append("rect")
          .attr("x", "0")
          .attr("y", "0")
          .attr('width', svgSize.width - svgSize.width * svgSize.padding)
          .attr('height', svgSize.height);

        scope.container.attr("transform", "translate(" + svgSize.margin.left + ", " + (svgSize.margin.top) +  ")")
        scope.alleleContainer.attr("clip-path", "url(#alleleClippy)");

        scope.setSvgSize();
      };
       
      scope.setSvgSize = function() {
        var svgSize = scope.getSvgSize();

        scope.svg.attr('viewBox','0 0 '+ (svgSize.width + svgSize.margin.left + svgSize.margin.right) + ' ' +
            (svgSize.height + svgSize.margin.top + svgSize.margin.bottom))
          //.attr('preserveAspectRatio','xMinYMin');
        scope.redraw();
      };

      scope.redraw = function() {
        scope.drawGroups();
      };

      scope.getX = function () {
        return scope.plotdata.alleleEffectPlots.x;
      };

      scope.getAlleleValues = function() {
        return scope.plotdata.alleleEffectPlots.y;
      };

      scope.getNames = function() {
        return scope.plotdata.alleleEffectPlots.names;
      };

      scope.getColors = function() {
        return scope.plotdata.alleleEffectPlots.colors;
      };

      scope.getMax = function(alleleEffectPlots) {
        if (alleleEffectPlots.length > 0) {
          return d3.max(alleleEffectPlots, function(array) {
            return d3.max(array.alleleEffects);
          });
        } else {
          return null;
        }
      };

      scope.getMin = function(alleleEffectPlots) {
        if (alleleEffectPlots.length > 0) {
          return d3.min(alleleEffectPlots, function(array) {
            return d3.min(array.alleleEffects);
          });
        } else {
          return null;
        }
      };

      scope.getRange = function(alleleEffectPlots) {
        let max = scope.getMax(alleleEffectPlots);
        if (max === null) {
          return 0;
        }

        let min = scope.getMin(alleleEffectPlots);

        return max - min;
      };

      scope.getQtl = function() {
      	return scope.plotdata.qtl;
      }

      scope.formatLines = function(lineXArray, lineYArray) {
        var returnArray = [];

        for (var i = 0; i < lineXArray.length; i++) {
          returnArray.push({
            x: lineXArray[i],
            y: lineYArray[i]
          });
        }

        return returnArray;
      };

      scope.convertToPlotData = function(allelePoints, names, colors) {
        var returnArray = [];

        for (var i = 0; i < allelePoints.length; i++) {
          returnArray.push({
            points: allelePoints[i], 
            name: names[i],
            color: colors[i]
          });
        }
        return returnArray;
      }

      scope.formatPosition = function(genePosition) {
        var prefix = d3.formatPrefix(genePosition);

        return d3.round(prefix.scale(genePosition), 3) + " " + prefix.symbol + "bp";
      }

      scope.drawGroups = function() {
        var x, y, alleleXAxis, alleleYAxis, lineDataset, xValues = scope.getX(), alleleValues = scope.getAlleleValues(), colors = scope.getColors(), 
          svgSize = scope.getSvgSize(), names = scope.getNames(), qtl = scope.getQtl();

        // if we have data defined
        if (xValues.length && alleleValues.length) {
          var xScaleFudgeFactor = (d3.max(xValues) - d3.min(xValues)) * .025;
          //var yScaleFudgeFactor = scope.getRange(alleleValues) * .1;
          var yDomain = d3.max([scope.getMax(alleleValues), Math.abs(scope.getMin(alleleValues))]);

          var yScaleFudgeFactor = yDomain * .15;

          x = d3.scale.linear().domain([d3.min(xValues), d3.max(xValues)]).range([ 0, svgSize.width - svgSize.width * svgSize.padding]);
          y = d3.scale.linear().domain([-yDomain - yScaleFudgeFactor, yDomain + yScaleFudgeFactor]).range([ svgSize.height, 0]);

          alleleXAxis = d3.svg.axis().scale(x).orient("bottom").ticks(10)
            .tickFormat(function(d) { 
              return d3.format("s")(d) + "bp";
            });
          alleleYAxis = d3.svg.axis().scale(y).orient("left").ticks(5);
          xBorder = d3.svg.axis().scale(x).tickValues([]);
					yBorder = d3.svg.axis().scale(y).orient("left").tickValues([]);

          var line = d3.svg.line()
          .x(function(d) { 
            return x(d.x); })
          .y(function(d) { 
            return y(d.y); 
          }).interpolate("linear");

          var transitionLine = d3.svg.line()
	        	.x(function(d) {
	        		return x(d.x); 
	        	}).y(function(d) {
	        		return y(0);
	        	});

	        var transitionVertLine = d3.svg.line()
	        	.x(function(d) {
	        		return x(d.x); 
	        	}).y(function(d) {
	        		return y(y.domain()[1]);
	        	});

	        if (xValues.length > 1) {
	        	// add an extra vertical path to mark where the qtl is
	          var baseLine = [{
	            lineData: [
                {x: (qtl.position - xScaleFudgeFactor * .2), y: y.domain()[1]}, 
                {x: (qtl.position), y: scope.getMax(alleleValues) + (y.domain()[1] - y.domain()[0]) * .05},
                {x: (qtl.position + xScaleFudgeFactor * .2), y: y.domain()[1]}
              ],
	            fill: "#cc6666"
	          }];

	          var vertLine = scope.alleleContainer.selectAll(".zeroline").data(baseLine);
	        
	          vertLine.enter().append("path").attr("class", "zeroline");

	          vertLine.style("stroke", function(d) {
	            return d.color;
	          }).style("fill", function(d) {
	          	return d.fill;
	          }).attr("opacity", 0)
	          .attr("d", function(d) {
	            return transitionVertLine(d.lineData); 
	          }).transition()
	          .duration(2000)
	          .attr("opacity", 1)
	          .attr("d", function(d) {
	            return line(d.lineData); 
	          });

	          vertLine.exit().remove();
	        }

          // convert all lines to points;
          var allelePoints = [];

          alleleValues.forEach( function(effectPlot) {
            allelePoints.push(scope.formatLines(xValues, effectPlot.alleleEffects));
          });

          var plotData = scope.convertToPlotData(allelePoints, names, colors); 

          // dummy axes 
          scope.container.selectAll("g.xBorder").attr("transform", "translate(0, 0)").call(xBorder);
          scope.container.selectAll("g.yBorder").attr("transform", "translate(" + (svgSize.width - svgSize.width * svgSize.padding) +", 0)").call(yBorder);

          alleleDataset = scope.alleleContainer.selectAll(".line").data(plotData);

          alleleDataset.enter().append("path").attr("class", "line");

          alleleDataset
          	.attr('stroke', function(d) {
            	return d.color; 
          	}).attr("d", function(d) {
          		return transitionLine(d.points);
          	}).transition()
          	.duration(2000)
          	.attr("d", function(d) {
          		return line(d.points);
          	}).attr("opacity", 1);

          // remove unneeded lines
          alleleDataset.exit().remove();

          // add text element for qtl
          var qtlText = scope.alleleContainer.selectAll(".qtlLabel").data([qtl]);

          if (qtl.hasOwnProperty("position")) {
            qtlText.enter().append("text").attr("class", "qtlLabel");

            qtlText.attr("opacity", 0)
            .attr("x", function(d) {
              if (d.position > (x.domain()[1] - x.domain()[0]) / 2) {
                return x(d.position) - 33; 
              } else {
                return x(d.position) + 9; 
              }
            }).attr("y", function(d) {
              return y(y.domain()[0]); 
            }).text("QTL")
            .transition()
            .duration(1750)
            .attr("y", function(d) {
              return y(y.domain()[1] * .80); 
            })
            .attr("opacity", 1);
          }

          qtlText.exit().remove();

          var markerLine = [{
            lineData: 
              [
                {x: 0, y: y.domain()[0]}, 
                {x: 0, y: y.domain()[1]}
              ],
            color: "#675EA8",
            strokeWidth: 3
          }];

          var interactiveMarker = scope.alleleContainer.selectAll(".markerline").data(markerLine);

          interactiveMarker.enter().append("path").attr("class", "markerline");

          interactiveMarker.attr("d", function(d) {
            return line(d.lineData); 
          }).attr("opacity", 0)
            .style("stroke", function(d) {
            return d.color;
          }).style("stroke-width", function(d) {
            return d.strokeWidth;
          });

          interactiveMarker.exit().remove();

          // bind event handlers to our mouseover box to track what point of the LOD curve should be highlighted.
          scope.alleleMouseover.on("mouseout", function() {
            tip.hide();
            interactiveMarker.attr("opacity", 0);
          }).on("mousemove", function() {
            // get the x svg coordinate of the mouse
            var xCoordinate = d3.mouse(this)[0];

            // translate it into our domain coordinates
            var translatedCoordinate = x.invert(xCoordinate);

            markerLine[0].lineData = [
              {x: translatedCoordinate, y: y.domain()[0]}, 
              {x: translatedCoordinate, y: y.domain()[1]}
            ];

            // update data and line position
            interactiveMarker.data(markerLine)
            .attr("d", function(d) {
              return line(d.lineData); 
            }).attr("opacity", 1);

            var targetPoint = {
              x: Number.MIN_VALUE,
              delta: Number.MAX_VALUE, 
              i: -1
            };

            // get closest data point to the mouse's x coordinate
            for (var i = 0; i < xValues.length; i++) {
              var delta = Math.abs(xValues[i] - translatedCoordinate);

              if (delta < targetPoint.delta) {
                targetPoint.x = xValues[i];
                targetPoint.i = i;
                targetPoint.delta = delta;
              }
            }

            // now get values for tooltip html
            var tooltipValues = [
              { strain: "A/J", alleleEffect: alleleValues[0].alleleEffects[targetPoint.i], color: colors[0] },
              { strain: "C57BL/6J", alleleEffect: alleleValues[1].alleleEffects[targetPoint.i], color: colors[1] },
              { strain: "129S1/SvImJ", alleleEffect: alleleValues[2].alleleEffects[targetPoint.i], color: colors[2] },
              { strain: "NOD/ShiLtJ", alleleEffect: alleleValues[3].alleleEffects[targetPoint.i], color: colors[3] },
              { strain: "NZO/LtJ", alleleEffect: alleleValues[4].alleleEffects[targetPoint.i], color: colors[4] },
              { strain: "CAST/EiJ", alleleEffect: alleleValues[5].alleleEffects[targetPoint.i], color: colors[5] },
              { strain: "PWK/PhJ", alleleEffect: alleleValues[6].alleleEffects[targetPoint.i], color: colors[6] },
              { strain: "WSB/EiJ", alleleEffect: alleleValues[7].alleleEffects[targetPoint.i], color: colors[7] }
            ];

            // define the inner HTML of the tooltip
            tip.html(function () {
              var formattedStrains = "";

              for (var i = 0; i < 8; i++) {

                formattedStrains += "<strong style='color: " + tooltipValues[i].color +  "'>&nbsp;&nbsp;&nbsp;&nbsp;" + tooltipValues[i].strain + ": </strong> ";
                formattedStrains += "<span style='color: #e8e8e8'>" + d3.format(".4f")(tooltipValues[i].alleleEffect) + "</span>"

                if (i < 7) {
                  formattedStrains += "<br>";
                }
              }

              let tipText = "<strong style='color: #31c4ae'>Position:</strong> <span style='color: #e8e8e8'>" + scope.formatPosition(targetPoint.x) + " </span><br><br>"
                              + "<strong style='color: #31c4ae'>Mice Strain Allele Effects:</strong><br>"
                              + formattedStrains;

              return tipText;
            });

            tip.show(markerLine,interactiveMarker[0][0]);
          });

          scope.container.selectAll("g.xAllele").attr("transform", "translate(0, " + svgSize.height + ")").call(alleleXAxis);
          scope.container.selectAll("g.yAllele").call(alleleYAxis);
        } else {
					// no data yet. just render axes.

          x = d3.scale.linear().domain([0, 0]).range([ 0, svgSize.width - svgSize.width * svgSize.padding]);
          y = d3.scale.linear().domain([0, 0]).range([ svgSize.height, 0]);

          alleleXAxis = d3.svg.axis().scale(x).orient("bottom").ticks(5)
            .tickFormat(function(d) { 
              return d3.format("s")(d) + "bp";
            });
          alleleYAxis = d3.svg.axis().scale(y).orient("left").ticks(5);
          xBorder = d3.svg.axis().scale(x).tickValues([]);
					yBorder = d3.svg.axis().scale(y).orient("left").tickValues([]);

          scope.container.selectAll("g.xAllele").attr("transform", "translate(0, " + svgSize.height + ")").call(alleleXAxis);
          scope.container.selectAll("g.yAllele").call(alleleYAxis);

          // dummy axes 
          scope.container.selectAll("g.xBorder").attr("transform", "translate(0, 0)").call(xBorder);
          scope.container.selectAll("g.yBorder").attr("transform", "translate(" + (svgSize.width - svgSize.width * svgSize.padding) +", 0)").call(yBorder);
        }        
      };
      
      /**
       * Watch model changes
       */
      scope.$watch('plotdata.alleleEffectPlots', scope.redraw, true);
      scope.$watch('options', scope.setSvgSize);
       
      scope.initialize();
    };
     
    return directive; 
});

// allele effects and LOD curves
chartModule.directive("genes", function($log) {

    var directive = {
      restrict: 'AE',
      scope: {
        plotdata: '=?',
        svgsize: '=?'
      }
    };

    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-15, 0]);

    /**
    * @description Links the IPSA directive to the annotatedSpectrum HTML tag and retrieves the tag attributes.
    */
    directive.link = function(scope, elements, attr) {

      scope.getSvgSize = function () {
        return scope.svgsize;
      }

      scope.initialize = function() {
        var svgSize = scope.getSvgSize();

        // create svg element to hold charts
        scope.svg = d3.select(elements[0]).append("svg").attr("class", "chart");

        // main svg container to hold spectrum annotations
        scope.container = scope.svg.append("g");

        // invisible rectangle placed over the X axis and chart area used to catch zoom events.
        // place this first to make sure it doesn't prevent genes from catching events.
        scope.zoomX = scope.container.append("rect")
          .attr("id", "xZoom")
          .attr("fill", "none")
          .attr("x", "0")
          .attr("y", "0")
          .attr("pointer-events", "all")
          .attr('width', svgSize.width - svgSize.width * svgSize.padding)
          .attr('height', svgSize.height + svgSize.margin.bottom);

        scope.geneContainer = scope.container.append("g").attr("id", "geneContainer");
        
        scope.geneContainer.call(tip);

        scope.container.append("g")
          .attr("class", "xGene")
          .append("text")
          .attr("class", "xGeneLabel")
          .attr("transform","translate(" + (svgSize.width/2) + " ," + (svgSize.margin.bottom - 5) + ")")
          .text("Genomic Position");

        var axisHolder = scope.container.append("g")
          .attr("class", "yGene");

        axisHolder.append("text")
          .attr("class", "yGeneLabel")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - svgSize.margin.left)
          .attr("x", 0 - (svgSize.height * 1 / 2))
          .attr("dy", "2em")
          .text("Genes");

        axisHolder.append("text")
          .attr("class", "yGeneLabel")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - svgSize.margin.left)
          .attr("x", 0 - (svgSize.height * 1 / 2))
          .attr("dy", "3.2em")
          .text("(\u00B11.5 Mbp From QTL)");

        // dummy top axis
        scope.container.append("g")
          .attr("class", "xBorder")
          .append("text");

        scope.container.append("g")
          .attr("class", "yBorder");

        // place a clip mask over the annotated spectrum container to prevent svg elements from displaying out of the SVG when zooming. 
        scope.geneContainer.append("clipPath")
          .attr("id", "geneClippy")
          .append("rect")
          .attr("x", "0")
          .attr("y", "0")
          .attr('width', svgSize.width - svgSize.width * svgSize.padding)
          .attr('height', svgSize.height);

        scope.container.attr("transform", "translate(" + svgSize.margin.left + ", " + (svgSize.margin.top) +  ")")
        scope.geneContainer.attr("clip-path", "url(#geneClippy)");

        scope.setSvgSize();
      };
       
      scope.setSvgSize = function() {
        var svgSize = scope.getSvgSize();

        scope.svg.attr('viewBox','0 0 '+ (svgSize.width + svgSize.margin.left + svgSize.margin.right) + ' ' +
            (svgSize.height + svgSize.margin.top + svgSize.margin.bottom))
          //.attr('preserveAspectRatio','xMinYMin');
        scope.redraw();
      };

      scope.redraw = function() {
        scope.drawGroups();
      };

      scope.genomicResolution = function() {
        return 1500000;
      };

      scope.getXValues = function() {
        if (scope.plotdata.lodPlot.x.length == 0) {
          return [];
        } else {
          return scope.plotdata.lodPlot.x;
        }
      };

      scope.getGenes = function () {
        return scope.plotdata.genes;
      };

      scope.getSnps = function () {
        return scope.plotdata.snps;
      };

      scope.getQtl = function() {
        return scope.plotdata.qtl;
      }

      scope.filterGenes = function(genes, qtl) {
        var returnArray = [];

        genes.forEach(function(d) {
          if ((d.start < (qtl.position + scope.genomicResolution()) && d.start > (qtl.position - scope.genomicResolution())) || 
              (d.end <= (qtl.position + scope.genomicResolution()) && d.end >= (qtl.position - scope.genomicResolution()))) {
            returnArray.push(d);
          }
        });

        return returnArray;
      };

      scope.orderGenes = function(geneList) {
        if (geneList.length === 0) {
          return [];
        }

        var returnArray = [[geneList[0]]];

        for (var i = 1; i < geneList.length; i++) {
          var j = 0;

          while (true) {
            if (scope.collides(geneList[i], returnArray, j)) {
              j++;

              if (returnArray.length == j) {
                returnArray.push([]);
              }
            } else {
              returnArray[j].push(geneList[i]);
              break;
            }
          }
        }

        return returnArray;
      };

      scope.collides = function(gene, orderedList, level) {
        if (orderedList[level].length == 0) {
          return false;
        }

        var placedGene = orderedList[level].slice(-1)[0];

        if (gene.start <= placedGene.stop + 20000) {
          return true;
        } else {
          return false;
        }
      }

      scope.layerGenes = function(orderedGenes) {
        var returnArray = [];

        for (var i = 0; i < orderedGenes.length; i++) {
          orderedGenes[i].forEach(function(d) {
            returnArray.push({
              gene: d,
              level: i,
              snps: [],
              highlight: false
            });
          });
        }

        returnArray.sort(function(a, b) {
          return a.gene.start - b.gene.start;
        });

        return returnArray;
      }

      scope.getMaxLayer = function(layeredGenes) {
        var returnValue = 0;

        layeredGenes.forEach(function(d) {
          if (returnValue < d.level) {
            returnValue = d.level;
          }
        });

        return returnValue + 1.5;
      }

      scope.associateSnps = function(layeredGenes, snps) {
        snps.forEach(function(snp) {
          for (var i = 0; i < layeredGenes.length; i++) {
            var layer = layeredGenes[i];
            // too far. stop iterating
            if (snp.position < layer.gene.start) {
              break;
            } else {
              if (snp.position <= layer.gene.stop && scope.geneMatch(layer.gene, snp)) {
                layer.snps.push(snp);

                if (snp.highlight) {
                  layer.highlight = true;
                }
              }
            }
          };
        });
      }

      scope.geneMatch = function(gene, snp) {
        return gene.databaseCrossReference && gene.databaseCrossReference != "NA" && gene.databaseCrossReference.includes(snp.ensembl_gene);
      }

      scope.extractUniqueSnpDescriptions = function(snps) {
        var returnList = [];

        snps.forEach(function(snp) {
          var splitSnps = snp.csq.split(",");

          splitSnps.forEach(function(splitSnp){ 
            if (!returnList.includes(splitSnp) && splitSnp != "NA") {
              returnList.push(splitSnp);
            }
          });
        });

        return returnList;
      }

      scope.formatPosition = function(genePosition) {
        var prefix = d3.formatPrefix(genePosition);

        return d3.round(prefix.scale(genePosition), 3) + " " + prefix.symbol + "bp";
      }

      scope.drawGroups = function() {
        var x, y, geneXAxis, geneYAxis, xValues = scope.getXValues(), qtl = scope.getQtl(), genes = scope.filterGenes(scope.getGenes(), qtl), snps = scope.getSnps(),
          svgSize = scope.getSvgSize(), plottableGenes = scope.layerGenes(scope.orderGenes(genes)), maxLayer = scope.getMaxLayer(plottableGenes);

        scope.associateSnps(plottableGenes, snps);

        genes.sort(function(a, b) {
          return a.start - b.start;
        });

        // if we have data defined
        if (genes.length) {
          x = d3.scale.linear().domain([qtl.position - scope.genomicResolution(), qtl.position + scope.genomicResolution()]).range([ 0, svgSize.width - svgSize.width * svgSize.padding]);
          y = d3.scale.linear().domain([0, maxLayer]).range([0, svgSize.height]);

          geneXAxis = d3.svg.axis().scale(x).orient("bottom").ticks(10)
            .tickFormat(function(d) { 
              return d3.format("s")(d + " ") + "bp";
            });
          geneYAxis = d3.svg.axis().scale(y).orient("left").tickValues([]);
          xBorder = d3.svg.axis().scale(x).tickValues([]);
          yBorder = d3.svg.axis().scale(y).orient("left").tickValues([]);

          var plotData = genes;

          // dummy axes 
          scope.container.selectAll("g.xBorder").attr("transform", "translate(0, 0)").call(xBorder);
          scope.container.selectAll("g.yBorder").attr("transform", "translate(" + (svgSize.width - svgSize.width * svgSize.padding) +", 0)").call(yBorder);

          // set a line to mark QTL location
          var line = d3.svg.line()
          .x(function(d) { 
            return x(d.x); })
          .y(function(d) { 
            return y(d.y); 
          }).interpolate("linear");

          // Define the points
          var baseLine = [{
            lineData: 
              [
                {x: qtl.position, y: y.domain()[0]}, 
                {x: qtl.position, y: y.domain()[1]}
              ],
            color: "#777777",
            strokeWidth: 2
          }];

          // draw the zero line
          var qtlMarker = scope.geneContainer.selectAll(".zeroline").data(baseLine);
          qtlMarker.enter().append("path").attr("class", "zeroline");

          qtlMarker.attr("d", function(d) {
            return line(d.lineData); 
          }).attr("opacity", 0)
            .style("stroke", function(d) {
            return d.color;
          }).style("stroke-width", function(d) {
            return d.strokeWidth;
          }).transition()
            .duration(1500)
            .attr("opacity", 1);

          qtlMarker.exit().remove();

          var qtlText = scope.geneContainer.selectAll(".qtlLabel").data([qtl]);

          qtlText.enter().append("text").attr("class", "qtlLabel");

          qtlText.attr("opacity", 0)
            .attr("x", function(d) {
              return x(d.position + 5000); 
            }).attr("y", function(d) {
              return y(y.domain()[1] - .25); 
            }).text("QTL Position").transition()
            .duration(1500)
            .attr("opacity", 1);

          qtlText.exit().remove();

          geneDataset = scope.geneContainer.selectAll(".gene").data(plottableGenes);

          geneDataset.enter().append("rect").attr("class", "gene").attr("opacity", 0);

          geneDataset.attr("opacity", 0)
            .attr('fill', function(d) {
              if (d.highlight) {
                return "#de2d26";
              } else if (d.snps.length != 0) {
                return "#fc9272";
              } else {
                return "#727272";
              }
            }).attr("x", function(d) {
              return x(d.gene.start);
            }).attr("y", function(d, i) {
              return y(d.level + 0.5);
            }).attr("height", 15)
              .attr("width", function(d) {
              var width = x(d.gene.stop) - x(d.gene.start);
              if (width < 7.5) {
                return 7.5;
              } else {
                return width;
              }
            }).attr("rx", 5)
              .attr("ry",5)
              .transition()
              .duration(1500)
              .attr("opacity", 1);
          
          // remove unneeded lines
          geneDataset.exit().attr("opacity", 0).remove();

          scope.container.selectAll("g.xGene").attr("transform", "translate(0, " + svgSize.height + ")").call(geneXAxis);
          scope.container.selectAll("g.yGene").call(geneYAxis);

          geneDataset.on("mouseenter", function(d) {

            // highlight the peak that is being hovered over using a black stroke
            d3.select(this).style("stroke", function (d, i) {
              return "black";
            });

            // define the inner HTML of the tooltip
            tip.html(function () {
              var crossReferences = d.gene.databaseCrossReference.split(",");
              var formattedCrossReferences = "";

              for (var i = 0; i < crossReferences.length; i++) {

                formattedCrossReferences += "<span style='color: #e8e8e8'>&nbsp;&nbsp;&nbsp;&nbsp;" + crossReferences[i] + "</span>"; 

                if (i != crossReferences.length - 1) {
                  formattedCrossReferences += "<br>";
                }
              }


              let tipText = "<strong style='color: #31c4ae'>Gene Name:</strong> <span style='color: #e8e8e8'>" + d.gene.name + " </span><br><br>"
                              + "<strong style='color: #31c4ae'>Start:</strong> <span style='color: #e8e8e8'>" + scope.formatPosition(d.gene.start) + " </span>"
                              + "<strong style='color: #31c4ae'>Stop:</strong> <span style='color: #e8e8e8'>" + scope.formatPosition(d.gene.stop) + "</span><br><br>"
                              + "<strong style='color: #31c4ae'>Gene Length:</strong> <span style='color: #e8e8e8'>" + scope.formatPosition(d.gene.stop - d.gene.start) + "</span><br><br>"
                              + "<strong style='color: #31c4ae'>Gene Classification:</strong> <span style='color: #e8e8e8'>" + d.gene.bioType + "</span><br><br>"
                              + "<strong style='color: #31c4ae'>Database Cross-References:</strong><br>" + formattedCrossReferences + "<br>";
                              
              if (d.snps.length != 0) {
                var uniqueDescriptions = scope.extractUniqueSnpDescriptions(d.snps);
                var formattedDescriptions = "";

                for (var i = 0; i < uniqueDescriptions.length; i++) {

                  formattedDescriptions += "<span style='color: #e8e8e8'>&nbsp;&nbsp;&nbsp;&nbsp;" + uniqueDescriptions[i].replace(/_/g, " ") + "</span>"; 

                  if (i != uniqueDescriptions.length - 1) {
                    formattedDescriptions += "<br>";
                  }
                }

                tipText += "<br><strong style='color: #31c4ae'># SNPs:</strong> <span style='color: #e8e8e8'>" + d.snps.length + "</span><br><br>"
                 + "<strong style='color: #31c4ae'>SNP Associations:</strong><br>" + formattedDescriptions + "<br>";

              }
              return tipText;
            });

            // show the tooltip
            tip.show();
          });

          // remove the stroke added on mouse-in and hide the tooltip
          geneDataset.on("mouseleave", function() {
            d3.select(this).style("stroke", "none");
            tip.hide();
          });

          // define zoom functionality on the x-axis
          var zoomX = d3.behavior.zoom()
            .scaleExtent([1, 1000])
            .x(x)
            .on("zoom", function() {

              // define translation object to move svg elements from original to zoomed position on the svg
              var t = zoomX.translate(); 

              // get max range in svg space. not data
              var minX = d3.min(x.range());
              var maxX = d3.max(x.range());

              var tx0 = Math.max(Math.min(0, t[0]), - maxX * zoomX.scale());
              var tx1 = Math.min(Math.max(maxX, t[1]), - maxX  * zoomX.scale());

              // update translation to new coordinates. 
              zoomX.translate([ tx0, t[1] ]);

              // calling the x axes here seems to be necessary to get them to scale correctly. 
              scope.container.selectAll("g.xGene").call(geneXAxis);

              // using the new scale, update the spectral peak positions
              geneDataset.attr("opacity", 0)
                .attr("x", function(d) {
                  return x(d.gene.start);
                }).attr("height", 15)
                .attr("width", function(d) {
                  var width = x(d.gene.stop) - x(d.gene.start);
                  if (width < 7.5) {
                    return 7.5;
                  } else {
                    return width;
                  }
                }).attr("rx", 7.5)
                .attr("ry",7.5)
                .attr("opacity", 1);

              // redraw QTL marker
              qtlMarker.attr("d", function(d) {
                return line(d.lineData); 
              });

              qtlText.attr("x", function(d) {
                return x(d.position + 5000); 
              });
          });

          // give zooming behavior to your invisible zoom rectangles
          scope.zoomX.call(zoomX);

          // also pass zooming behavior onto the actual axis elements (ticks, axis labels ect.). Prevents unexpected page scrolling. 
          scope.container.selectAll("g.xGene").call(zoomX);

        } else {
          // no data yet. just render axes.

          x = d3.scale.linear().domain([0, 0]).range([0, svgSize.width - svgSize.width * svgSize.padding]);
          y = d3.scale.linear().domain([0, 0]).range([0, svgSize.height]);

          geneXAxis = d3.svg.axis().scale(x).orient("bottom").ticks(5)
            .tickFormat(function(d) { 
              return d3.format("s")(d) + "bp";
            });
          geneYAxis = d3.svg.axis().scale(y).orient("left").ticks(5);
          xBorder = d3.svg.axis().scale(x).tickValues([]);
          yBorder = d3.svg.axis().scale(y).orient("left").tickValues([]);

          scope.container.selectAll("g.xGene").attr("transform", "translate(0, " + svgSize.height + ")").call(geneXAxis);
          scope.container.selectAll("g.yGene").call(geneYAxis);

          // dummy axes 
          scope.container.selectAll("g.xBorder").attr("transform", "translate(0, 0)").call(xBorder);
          scope.container.selectAll("g.yBorder").attr("transform", "translate(" + (svgSize.width - svgSize.width * svgSize.padding) +", 0)").call(yBorder);
        }        
      };
      
      /**
       * Watch model changes
       */
      scope.$watch('plotdata.genes', scope.redraw, true);
      scope.$watch('options', scope.setSvgSize);
       
      scope.initialize();
    };
     
    return directive; 
});

