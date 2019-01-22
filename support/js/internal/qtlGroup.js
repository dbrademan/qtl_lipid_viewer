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

        scope.container.append("g")
          .attr("class", "xLod")
          .append("text")

        scope.container.append("g")
          .attr("class", "yLod")
          .append("text")
          .attr("class", "yLodLabel")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - svgSize.margin.left)
          .attr("x", 0 - (svgSize.height * 1 / 2))
          .attr("dy", "1em")
          .text("Logarithm of Odds");

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

          xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(10)
          .tickFormat(function(d) { 
            return d3.format("s")(d) + "bp";
          });

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

          scope.container.selectAll("g.xLod").attr("transform", "translate(0, " + svgSize.height + ")").call(xAxis);
          scope.container.selectAll("g.yLod").call(yAxis);
        }
      };

      /**
       * Watch model changes
       */
      scope.$watch('plotdata', scope.redraw, true);
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
      scope.$watch('plotdata', scope.redraw, true);
      scope.$watch('options', scope.setSvgSize);
       
      scope.initialize();
    };
     
    return directive; 
});

// allele effects and LOD curves
chartModule.directive("genes", function($log) {
    
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
          .text("(\u00B11 Mbp From QTL)");

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

      scope.getQtl = function() {
        return scope.plotdata.qtl;
      }

      scope.testFilter = function(genes, qtl) {
        var returnArray = [];

        genes.forEach(function(d) {
          if ((d.start < (qtl.position + 1000000) && d.start > (qtl.position - 1000000)) || (d.end <= (qtl.position + 1000000) && d.end >= (qtl.position - 1000000))) {
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
              level: i
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

      scope.formatPosition = function(genePosition) {
        var prefix = d3.formatPrefix(genePosition);

        return d3.round(prefix.scale(genePosition), 3) + " " + prefix.symbol + "bp";
      }

      scope.drawGroups = function() {
        var x, y, geneXAxis, geneYAxis, xValues = scope.getXValues(), qtl = scope.getQtl(), genes = scope.testFilter(scope.getGenes(), qtl), 
          svgSize = scope.getSvgSize(), plottableGenes = scope.layerGenes(scope.orderGenes(genes)), maxLayer = scope.getMaxLayer(plottableGenes);

        genes.sort(function(a, b) {
          return a.start - b.start;
        });

        // if we have data defined
        if (genes.length) {
          x = d3.scale.linear().domain([qtl.position - 1000000, qtl.position + 1000000]).range([ 0, svgSize.width - svgSize.width * svgSize.padding]);
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
            strokeWidth: 3
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

          geneDataset = scope.geneContainer.selectAll(".gene").data(plottableGenes);

          geneDataset.enter().append("rect").attr("class", "gene").attr("opacity", 0);

          geneDataset.attr("opacity", 0)
          .attr('fill', function(d) {
              if (d.gene.strand === "+") {
                return "#823030";
              } else {
                return "#675EA8";
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
            }).attr("rx", 7.5)
              .attr("ry",7.5)
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
              let tipText = "<strong style='color: #31c4ae'>Gene Name:</strong> <span style='color: #e8e8e8'>" + d.gene.name + " </span><br><br>"
                              + "<strong style='color: #31c4ae'>Start:</strong> <span style='color: #e8e8e8'>" + scope.formatPosition(d.gene.start) + " </span>"
                              + "<strong style='color: #31c4ae'>Stop:</strong> <span style='color: #e8e8e8'>" + scope.formatPosition(d.gene.stop) + "</span><br><br>"
                              + "<strong style='color: #31c4ae'>Gene Length:</strong> <span style='color: #e8e8e8'>" + scope.formatPosition(d.gene.stop - d.gene.start) + "</span><br><br>";
                          /*  
                              + "<strong style='color: #31c4ae'>Start:</strong> <span style='color: #e8e8e8'>" + d3.format("s")(d.start) + "bp </span>"
                              + "<strong style='color: #31c4ae'>Stop:</strong> <span style='color: #e8e8e8'>" + d3.format("s")(d.stop) + "bp</span><br><br>"
                              + "<strong style='color: #31c4ae'>Gene Length:</strong> <span style='color: #e8e8e8'>" + d3.format("s")(d.stop - d.start) + "bp</span><br><br>";
                          */
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
      scope.$watch('plotdata', scope.redraw, true);
      scope.$watch('options', scope.setSvgSize);
       
      scope.initialize();
    };
     
    return directive; 
});

