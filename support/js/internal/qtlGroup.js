   /**
   * @classdesc The visualization generation of IPSA is driven by the AngularJS directive coded below. This directive will embed an SVG element into a <div>
   *    Javascript objects are listed as attributes to the div tag and provide the script with the variables needed to generated the interactive annotated spectrum
   * @example <div annotated-spectrum plotdata="set.plotData" peptide="set.peptide" settings="set.settings" class="content"></div>
   */
var chartModule = angular.module("qtl.groups", []);


// QTL groups
chartModule.directive("qtlGroups", function($log) {
    
    /**
    * @description The directive variable used to the initiate the 2-way binding between this template and the controller
    * @property {string} directive.restrict - Restricts the directive to attribute and elements only
    * @property {object} directive.scope - Holds objects containing spectral data, peptide data, and visualization settings
    * @property {object} directive.scope.plotdata - Contains the numerical, ordinal, and categorical data required to generate the visualization
    * @property {object} directive.scope.peptide - Contains ms2 scan number, peptide sequence, precursor mz, charge, and modifications
    * @property {object} directive.scope.settings - Contains tolerance type (ppm/Da), tolerance threshold, and ionization mode
    */
    let directive = {
      restrict: 'AE',
      scope: {
        plotdata: '=?',
        svgsize: '=?',
        colors: '=?'
      }
    };

    /**
    * @description Links the IPSA directive to the annotatedSpectrum HTML tag and retrieves the tag attributes.
    */
    directive.link = function(scope, elements, attr) {

      var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0]);

      scope.getSvgSize = function () {
        return scope.svgsize;
      }

      scope.initialize = function() {
        var svgSize = scope.getSvgSize();

        // create svg element to hold charts
        scope.svg = d3.select(elements[0]).append("svg").attr("class", "chart");

        // main svg container to hold spectrum annotations
        scope.container = scope.svg.append("g");

        scope.plotContainer = scope.container.append("g").attr("id", "groupContainer");

        scope.container.append("g")
          .attr("class", "xAnnotation")
          .append("text")
          .attr("class", "xAnnotationLabel")
          .attr("transform","translate(" + (svgSize.width/2) + " ," + (svgSize.margin.bottom - 5) + ")")
          .text("Position");

        scope.container.append("g")
          .attr("class", "yAnnotation")
          .append("text")
          .attr("class", "yAnnotationLabel")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - svgSize.margin.left)
          .attr("x", 0 - (svgSize.height / 2))
          .attr("dy", "1em")
          .text("QTLs in Group");

        /*
        scope.container.append("text")
          .attr("x", (svgSize.width / 2))             
          .attr("y", 0 - (svgSize.margin.top / 2))
          .attr("text-anchor", "middle")  
          .style("font-size", "16px")  
          .text("QTL Groups");
        */

        scope.container.attr("transform", "translate(" + svgSize.margin.left + ", " + (svgSize.margin.top) +  ")")

        scope.setSvgSize();
      };
       
      scope.setSvgSize = function() {
        var svgSize = scope.getSvgSize();

        scope.svg.attr('viewBox','0 0 '+ (svgSize.width + svgSize.margin.left + svgSize.margin.right) + ' ' +
            (svgSize.height + svgSize.margin.top + svgSize.margin.bottom))
          .attr('preserveAspectRatio','xMinYMin');
        scope.redraw();
      };

      scope.redraw = function() {
        scope.drawGroups();
      };

      scope.getX = function () {
        return scope.plotdata.x;
      };

      scope.getY = function() {
        return scope.plotdata.y;
      };

      scope.getColors = function() {
        return "#F05232";
      }

      scope.drawGroups = function() {
        var x, y, xAxis, yAxis, circleDataset, xValues = scope.getX(), yValues = scope.getY(), colors = scope.getColors(), svgSize = scope.getSvgSize();

        if (isNaN(d3.max(xValues))) {
          xValues = [0];
        }
        if (isNaN(d3.max(yValues))) {
          yValues = [0];
        }

        if (xValues && yValues) {
          shiftFactor = 1;

          var xScaleFudgeFactor = (d3.max(xValues) - d3.min(xValues)) * .025;
          var yScaleFudgeFactor = d3.max(yValues) * .1;

          x = d3.scale.linear().domain([d3.min(xValues) - xScaleFudgeFactor, d3.max(xValues) + xScaleFudgeFactor]).range([ 0, svgSize.width], 0);
          y = d3.scale.linear().domain([0 - yScaleFudgeFactor, d3.max(yValues) + yScaleFudgeFactor]).range([ svgSize.height, 0]);
          xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(10)
          .tickFormat(function(d) { 
            return d3.format("s")(d) + "bp";
          });
          yAxis = d3.svg.axis().scale(y).orient("left").ticks(5);

          var plotData = [];

          for (var i = 0; i < xValues.length; i++) {          
            plotData.push({
              x: xValues[i],
              y: yValues[i],
              color: colors,
            });
          }

          var delay = 1250/ plotData.length;
          scope.container.selectAll("g.xAnnotation").attr("transform", "translate(0, " + svgSize.height + ")").call(xAxis);
          scope.container.selectAll("g.yAnnotation").call(yAxis);

          scope.plotContainer.call(tip);

          circleDataset = scope.plotContainer.selectAll(".masserror").data(plotData);
          circleDataset.enter().append("circle").attr("class", "masserror");

          circleDataset.attr("cy", function (d) {
            return y(0);
          }).style("fill", function(d) {
            return d.color;
          }).attr("cx", function (d) {
            return x(d.x);
          }).attr("r", function (d) {
            return 7.5;
          }).attr("opacity", 0).transition().delay(function(d, i) {
            return i * delay;
          }).duration(1250).attr("cy", function (d) {
            return y(d.y);
          }).attr("opacity", 1);

          // remove unneeded circles
          circleDataset.exit().remove();

          circleDataset.on("mouseenter", function(d) {
            d3.select(this).style("stroke", function (d, i) {
              return "black";
            }).attr("r", function () {
              return 10;
            });

            tip.html(function () {
              return "<strong>Group center:</strong> <span style='color:red'>" + d.x + " </span><br><br>"
                + "<strong>QTLs in Group:</strong> <span style='color:red'>" + d.y + "</span><br><br>"
                + "<strong>Color (to be filled later):</strong> <span style='color:red'>" + d.color + "</span>";
            });
            tip.show();
          });

          circleDataset.on("mouseleave", function(d) {
            d3.select(this).style("stroke", "none").attr("r", function(d) {
              return 7.5;
            });
            tip.hide();
          });
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

// Individual QTLs and associated genes
chartModule.directive("groupInspector", function($log) {
    
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
        svgsize: '=?',
        colors: '=?'
      }
    };

    /**
    * @description Links the IPSA directive to the annotatedSpectrum HTML tag and retrieves the tag attributes.
    */
    directive.link = function(scope, elements, attr) {

      var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0]);

      scope.getSvgSize = function () {
        return scope.svgsize;
      }

      scope.initialize = function() {
        var svgSize = scope.getSvgSize();

        // create svg element to hold charts
        scope.svg = d3.select(elements[0]).append("svg").attr("class", "chart");

        // main svg container to hold spectrum annotations
        scope.container = scope.svg.append("g");

        scope.qtlContainer = scope.container.append("g").attr("id", "qtlContainer");
        scope.geneContainer = scope.container.append("g").attr("id", "geneContainer");

        scope.container.append("g")
          .attr("class", "xQTL");

        scope.container.append("g")
          .attr("class", "yQTL")
          .append("text")
          .attr("class", "yQTLLabel")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - svgSize.margin.left)
          .attr("x", 0 - (svgSize.height * 3 / 8))
          .attr("dy", "1em")
          .text("QTL LOD Score");

        scope.container.append("g")
          .attr("class", "xGene")
          .append("text")
          .attr("class", "xAnnotationLabel")
          .attr("transform","translate(" + (svgSize.width / 2) + " ," + (svgSize.margin.bottom - 5) + ")")
          .text("Position");

        scope.container.append("g")
          .attr("class", "yGene")
          .append("text")
          .attr("class", "yGeneLabel")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - svgSize.margin.left)
          .attr("x", 0 - (svgSize.height * 7 / 8))
          .attr("dy", "1em")
          .text("Genes");

        /*
        scope.container.append("text")
          .attr("x", (svgSize.width / 2))             
          .attr("y", 0 - (svgSize.margin.top / 2))
          .attr("text-anchor", "middle")  
          .style("font-size", "16px") 
          .text("QTL Inspector");
        */

        scope.container.attr("transform", "translate(" + svgSize.margin.left + ", " + (svgSize.margin.top) +  ")")

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
        return scope.plotdata.x;
      };

      scope.getY = function() {
        return scope.plotdata.y;
      };

      scope.getColors = function() {
        return scope.colors;
      }

      scope.drawGroups = function() {
        var x, y, geneY, qtlXAxis, qtlYAxis, geneXAxis, geneYAxis, circleDataset, xValues = scope.getX(), yValues = scope.getY(), colors = scope.getColors(), svgSize = scope.getSvgSize();

        if (isNaN(d3.max(xValues))) {
          xValues = [0];
        }
        if (isNaN(d3.max(yValues))) {
          yValues = [0];
        }

        if (xValues && yValues) {
          shiftFactor = 1;

          var xScaleFudgeFactor = (d3.max(xValues) - d3.min(xValues)) * .025;
          var yScaleFudgeFactor = d3.max(yValues) * .1;

          x = d3.scale.linear().domain([d3.min(xValues) - xScaleFudgeFactor, d3.max(xValues) + xScaleFudgeFactor]).range([ 0, svgSize.width], 0);
          y = d3.scale.linear().domain([0 - yScaleFudgeFactor, d3.max(yValues) + yScaleFudgeFactor]).range([ svgSize.height * 0.75, 0]);
          geneY = d3.scale.linear().domain([0 - yScaleFudgeFactor, d3.max(yValues) + yScaleFudgeFactor]).range([ svgSize.height, svgSize.height * 0.75]);

          qtlXAxis = d3.svg.axis().scale(x).orient("bottom").tickValues([]).tickSize(0);
          qtlYAxis = d3.svg.axis().scale(y).orient("left").ticks(5);
          geneXAxis = d3.svg.axis().scale(x).orient("bottom").ticks(10)
          .tickFormat(function(d) { 
            return d3.format("s")(d) + "bp";
          });
          geneYAxis = d3.svg.axis().scale(geneY).orient("left").tickValues([]).tickSize(0);

          var plotData = [];

          for (var i = 0; i < xValues.length; i++) {
            plotData.push({
              x: xValues[i],
              y: yValues[i],
              color: colors[Math.floor(Math.random() * colors.length)].color,
              radius: 5
            });
          }

          var delay = 1250/ plotData.length;
          scope.container.selectAll("g.xQTL").attr("transform", "translate(0, " + svgSize.height * 0.75 + ")").call(qtlXAxis);
          scope.container.selectAll("g.yQTL").call(qtlYAxis);
          scope.container.selectAll("g.xGene").attr("transform", "translate(0, " + svgSize.height + ")").call(geneXAxis);
          scope.container.selectAll("g.yGene").call(geneYAxis);

          circleDataset = scope.qtlContainer.selectAll(".masserror").data(plotData);
          circleDataset.enter().append("circle").attr("class", "masserror");

          circleDataset.attr("cy", function (d) {
            return y(0);
          }).style("fill", function(d) {
            return d.color;
          }).attr("cx", function (d) {
            return x(d.x);
          }).attr("r", function (d) {
            return 7.5;
          }).attr("opacity", 0).transition().delay(function(d, i) {
            return i * delay;
          }).duration(1250).attr("cy", function (d) {
            return y(d.y);
          }).attr("opacity", 1);

          // remove unneeded circles
          circleDataset.exit().remove();

          circleDataset.on("mouseenter", function(d) {
            d3.select(this).style("stroke", function (d, i) {
              return "black";
            }).attr("r", function () {
              return 10;
            });

            tip.html(function () {
              return "<strong style='font-style:italic;'>m/z:</strong> <span style='color:red'>" + d3.format(",.4f")(d.mz) + " </span><br><br>"
                + "<strong>Relative Abundance:</strong> <span style='color:red'>" + d3.format("0.2f")(d.percentBasePeak) + "%</span><br><br>"
                + "<strong>% TIC:</strong> <span style='color:red'>" + d3.format("0.2%")(d.intensity) + "</span>";
            });
            tip.show();
          });

          circleDataset.on("mouseleave", function(d) {
            d3.select(this).style("stroke", "none").attr("r", function(d) {
              return 7.5;
            });
            //tip.hide();
          });
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
          .attr("class", "xLodLabel")
          .attr("transform","translate(" + (svgSize.width/2) + " ," + (svgSize.margin.bottom - 5) + ")")
          .text("Genomic Position");

          $log.log(scope);

        scope.container.append("g")
          .attr("class", "yLod")
          .append("text")
          .attr("class", "yLodLabel")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - svgSize.margin.left)
          .attr("x", 0 - (svgSize.height * 1 / 2))
          .attr("dy", "1em")
          .text("Logarithm of Odds");

        /*
        scope.container.append("text")
          .attr("x", (svgSize.width / 2))             
          .attr("y", 0 - (svgSize.margin.top / 2))
          .attr("text-anchor", "middle")  
          .style("font-size", "16px") 
          .text("Consensus Plots");
        */

        scope.container.attr("transform", "translate(" + svgSize.margin.left + ", " + (svgSize.margin.top) +  ")")

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
        return scope.plotdata.realLodPlot.x;
      };

      scope.getLodValues = function() {
        return scope.plotdata.realLodPlot.y;
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
          svgSize = scope.getSvgSize(); /*names = scope.getNames()*/

        if (isNaN(d3.max(xValues))) {
          xValues = [0];
        }
        if (isNaN(d3.max(lodValues))) {
          lodValues = [0];
        }

        if (xValues && lodValues) {
          var xScaleFudgeFactor = (d3.max(xValues) - d3.min(xValues)) * .025;
          var lodYScaleFudgeFactor = (d3.max(lodValues) - d3.min(lodValues)) * .1;

          x = d3.scale.linear().domain([d3.min(xValues) - xScaleFudgeFactor, d3.max(xValues) + xScaleFudgeFactor]).range([ 0, svgSize.width - svgSize.width * svgSize. padding]);
          y = d3.scale.linear().domain([d3.min(lodValues) - lodYScaleFudgeFactor, d3.max(lodValues) + lodYScaleFudgeFactor]).range([ svgSize.height, 0 ]);

          xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(5)
          .tickFormat(function(d) { 
            return d3.format("s")(d) + "bp";
          });

          yAxis = d3.svg.axis().scale(y).orient("left").ticks(5);

          scope.container.selectAll("g.xLod").attr("transform", "translate(0, " + svgSize.height + ")").call(xAxis);
          scope.container.selectAll("g.yLod").call(yAxis);

          line = d3.svg.line()
          .x(function(d) { 
            return x(d.x); })
          .y(function(d) { 
            return y(d.y); 
          }).interpolate("linear");
          // convert all lines to points;
          var lodPoints = [];

          lodPoints.push(scope.formatLines(xValues, lodValues));

          plotData = scope.convertToPlotData(lodPoints, ["LOD"], ["#675EA8"]); 

          lodDataset = scope.lodContainer.selectAll("path").attr("class", "line").data(plotData);
          lodDataset.enter().append("path");

          lodDataset.attr("d", function (d) {
            return line(d.points);
          }).attr('stroke-width', function(d) { 
            return 2; 
          }).attr('stroke', function(d) {
            return d.color; 
          });

          // remove unneeded lines
          lodDataset.exit().remove();
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
chartModule.directive("consensusRegressions", function($log) {
    
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
          .text("Position");

        scope.container.append("g")
          .attr("class", "yAllele")
          .append("text")
          .attr("class", "yAlleleLabel")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - svgSize.margin.left)
          .attr("x", 0 - (svgSize.height * 1 / 2))
          .attr("dy", "1em")
          .text("Allele Effect");          

        scope.container.attr("transform", "translate(" + svgSize.margin.left + ", " + (svgSize.margin.top) +  ")")

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
        return scope.plotdata.realAlleleEffectPlots.x;
      };

      scope.getAlleleValues = function() {
        return scope.plotdata.realAlleleEffectPlots.y;
      };

      scope.getNames = function() {
        return scope.plotdata.realAlleleEffectPlots.names;
      };

      scope.getColors = function() {
        return scope.plotdata.realAlleleEffectPlots.colors;
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
          svgSize = scope.getSvgSize(), names = scope.getNames();

        // if we have data defined
        if (xValues.length && alleleValues.length) {
          var xScaleFudgeFactor = (d3.max(xValues) - d3.min(xValues)) * .025;
          //var yScaleFudgeFactor = scope.getRange(alleleValues) * .1;
          var yDomain = d3.max([scope.getMax(alleleValues), Math.abs(scope.getMin(alleleValues))]);

          var yScaleFudgeFactor = yDomain * .1;

          x = d3.scale.linear().domain([d3.min(xValues) - xScaleFudgeFactor, d3.max(xValues) + xScaleFudgeFactor]).range([ 0, svgSize.width - svgSize.width * svgSize. padding]);
          y = d3.scale.linear().domain([-yDomain - yScaleFudgeFactor, yDomain + yScaleFudgeFactor]).range([ svgSize.height, 0]);

          // max and min functions are busted as fuck

          alleleXAxis = d3.svg.axis().scale(x).orient("bottom").ticks(5)
            .tickFormat(function(d) { 
              return d3.format("s")(d) + "bp";
            });
          alleleYAxis = d3.svg.axis().scale(y).orient("left").ticks(5);

          var line = d3.svg.line()
          .x(function(d) { 
            return x(d.x); })
          .y(function(d) { 
            return y(d.y); 
          }).interpolate("linear");

          // convert all lines to points;
          var allelePoints = [];

          alleleValues.forEach( function(effectPlot) {
            allelePoints.push(scope.formatLines(xValues, effectPlot.alleleEffects));
          });

          var plotData = scope.convertToPlotData(allelePoints, names, colors); 

          scope.container.selectAll("g.xAllele").attr("transform", "translate(0, " + svgSize.height + ")").call(alleleXAxis);
          scope.container.selectAll("g.yAllele").call(alleleYAxis);

          alleleDataset = scope.alleleContainer.selectAll("path").attr("class", "line").data(plotData);
          alleleDataset.enter().append("path");

          alleleDataset.attr("d", function (d) {
            return line(d.points);
          }).attr('stroke-width', function(d) { 
            return 2; 
          }).attr('stroke', function(d) {
            return d.color; 
          }).style('fill', "none");

          // remove unneeded lines
          alleleDataset.exit().remove();
        } else {

          x = d3.scale.linear().domain([0, 0]).range([ 0, svgSize.width - svgSize.width * svgSize. padding]);
          y = d3.scale.linear().domain([0, 0]).range([ svgSize.height, 0]);

          alleleXAxis = d3.svg.axis().scale(x).orient("bottom").ticks(5)
            .tickFormat(function(d) { 
              return d3.format("s")(d) + "bp";
            });
          alleleYAxis = d3.svg.axis().scale(y).orient("left").ticks(5);

          scope.container.selectAll("g.xAllele").attr("transform", "translate(0, " + svgSize.height + ")").call(alleleXAxis);
          scope.container.selectAll("g.yAllele").call(alleleYAxis);
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
