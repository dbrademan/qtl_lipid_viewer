/* Welcome to the Coon Lab Lipid QTL Viewer */
// TODO:
// Make it work

var myApp = angular.module('qtl-viewer', ['ngAnimate', 'ngSanitize', 'ui.bootstrap', 'ui.select', 'ngStorage', 'qtl.groups']);

// make select box appear similar to bootstrap
myApp.config(function(uiSelectConfig) {
  uiSelectConfig.theme = 'bootstrap';
});


/* Controllers can be used to create chunks of code which manage different parts of your webpage */
myApp.controller('GroupCtrl', function($scope, $uibModal, $log, $localStorage, $http, $element, $attrs, $transclude) {
  $scope.chromosomeNumber = "Select a QTL using the control panel"

  $scope.set = {
    groupData: {
      x: Array.from({length: 50}, () => Math.floor(Math.random() * 199700000) + 300000),
      y: Array.from({length: 50}, () => Math.floor(Math.random() * 59) + 1)
    },
    qtlData: {
      x: Array.from({length: 39}, () => Math.floor(Math.random() * 3000000) + 138500000),
      y: Array.from({length: 39}, () => Math.floor(Math.random() * 119) + 1)
    },
    consensusData: {
      alleleEffectPlots: {
        x: [],
        y: [],
        names: ["AJ", "B6", "129", "NOD", "NZO", "CAST", "PWK", "WSB"],
        colors: ["#FFDC00", "#888888", "#F08080", "#0064C9", "#7FDBFF", "#2ECC40", "#FF4136", "#B10DC9"]
      },
      lodPlot: {
        x: [],
        y: []
      },
      realLodPlot: {
        x: [],
        y: []
      },
      qtl: {},
      genes: [],
      snps: []
    },
    svgSizes: {
      lodSVG: {
        height: 120,
        width: 1120,
        margin: {
          top: 5,
          right: 15,
          bottom: 10,
          left: 55
        },
        padding: .02,
      },
      alleleEffectSVG: {
        height: 120,
        width: 1120,
        margin: {
          top: 5,
          right: 15,
          bottom: 45,
          left: 55
        },
        padding: .02,
      },
      geneSVG: {
        height: 180,
        width: 1120,
        margin: {
          top: 10,
          right: 15,
          bottom: 45,
          left: 55
        },
        padding: .02,
      }
    },
    colors: [
      {measurement: "Microbial", color: "#231F20"},
      {measurement: "Bile Acids", color: "#2BA7DF"},
      {measurement: "Transcript", color: "#FFCB04"},
      {measurement: "Lipid", color: "#63C29C"},
      {measurement: "Metabolite", color: "#955CA5"},
      {measurement: "Clinical", color: "#566977"},
      {measurement: "Protein", color: "#EC6B63"}
    ]
  };

  $scope.updateLodPlot = function(plottableObject) {
    $scope.chromosomeNumber = "Chromosome " + plottableObject.chromosome;
    $scope.set.consensusData.lodPlot.x = plottableObject.positions;
    $scope.set.consensusData.lodPlot.y = plottableObject.lods;
  };

  $scope.updateAlleleEffectPlot = function(plottableObjects) {
    $scope.set.consensusData.alleleEffectPlots.x = plottableObjects[0].positions;
    $scope.set.consensusData.alleleEffectPlots.y = plottableObjects;
  };

  $scope.updateGenePlot = function(plottableObjects) {
    $scope.set.consensusData.genes = plottableObjects.genes;
    $scope.set.consensusData.snps = plottableObjects.snps;
  };
});

myApp.controller('queryCtrl', function($scope, $uibModal, $log, $localStorage, $http, $element, $attrs, $transclude) {
  $scope.ids = [];
  $scope.isProcessing = false;

  // initialize Javascript object to store lookup params
  $scope.lipids = {
    selectedQtl: {
      lipid: null,
      qtl: null
    },
    filter: {
      class: "",
      tissue: "",
      precursorMz: "",
      rt: "",
      mzTolerance: 10,
      mzToleranceType: "Da",
    },
    options: {
      ids: [],
      classes: [],
      tissues: [],
      filteredIds: [],
      qtls: []
    }
  };

  // write custom filtering functions to strictly match lipid class, match tissue, and match a numerical range for precursorMz
  $scope.lipidFilter = function(lipid) {
    return ($scope.classFilter(lipid) && $scope.tissueFilter(lipid) && $scope.mzFilter(lipid));
  };

  // sub-filter specifically for matching lipid classes
  $scope.classFilter = function(lipid) {
    if (!$scope.lipids.filter.class.filterValue) {
      return true;
    }
    
    return lipid.newClass === $scope.lipids.filter.class.filterValue;
  };

  // sub-filter specifically for matching tissue of origin for lipid identifications
  $scope.tissueFilter = function(lipid) {
    if (!$scope.lipids.filter.tissue.filterValue) {
      return true;
    }
    
    return lipid.tissue === $scope.lipids.filter.tissue.filterValue;
  };

  // sub-filter specifically for matching lipids by precursor m/z within a mass tolerance.
  $scope.mzFilter = function(lipid) {
   // if no precursorMz is specified or is 0, don't filter.
    if (!$scope.lipids.filter.precursorMz) {
      return true;
    }

    var error = Number.MAX_VALUE;

    if ($scope.lipids.filter.mzToleranceType === "Da") {
      error = Math.abs(lipid.precursorMz - $scope.lipids.filter.precursorMz);
    } else {
      error = Math.abs((lipid.precursorMz - $scope.lipids.filter.precursorMz)/$scope.lipids.filter.precursorMz * 1000000);
    }

    if (error <= $scope.lipids.filter.mzTolerance) {
      return true;
    } else {
      return false;
    }
  };

  // format lipid class selectbox options 
  $scope.formatClassOption = function(id) {
    returnString = id.newAnalyteName + " " + id.precursorMz;
      
      return returnString;
  };

  // format lipid selectbox dropdown options
  $scope.formatLipidOption = function(id) {
    return "<b>Lipid Name: </b>" + id.newAnalyteName + "<br/>" 
      + "<b>Lipid Class: </b>" + id.newClass + "<br/>" 
      + "<b>Precursor <i>m</i>/<i>z</i>: </b>" + parseFloat(id.precursorMz).toFixed(4) + "<br/>" 
      + "<b>Polarity: </b>" + id.polarity + "<br/>" 
      + "<b>Sample Tissue: </b>" + id.tissue;
  };

  // format lipid selectbox selected item.
  $scope.formatSelectedLipid = function() {
    // return empty string as a base case
    if ($scope.lipids.selectedQtl.lipid == null) {
      return "";
    }

    return "<b>Lipid Name: </b>" + $scope.lipids.selectedQtl.lipid.newAnalyteName + "<br/>" 
      + "<b>Lipid Class: </b>" + $scope.lipids.selectedQtl.lipid.newClass + "<br/>"
      + "<b>Precursor <i>m</i>/<i>z</i>: </b>" + parseFloat($scope.lipids.selectedQtl.lipid.precursorMz).toFixed(4) + "<br/>"
      + "<b>Polarity: </b>" + $scope.lipids.selectedQtl.lipid.polarity + "<br/>" 
      + "<b>Sample Tissue: </b>" + $scope.lipids.selectedQtl.lipid.tissue;
  };

  // swaps ppm mass error to daltons
  $scope.swapMatchingType = function() {
    if ($scope.lipids.filter.mzToleranceType === "ppm") {
      $scope.lipids.filter.mzToleranceType = "Da"
    } else {
      $scope.lipids.filter.mzToleranceType = "ppm"
    }
  };

  $scope.formatSelectedQtl = function() {
    if ($scope.lipids.selectedQtl.qtl == null) {
      return "";
    }

    // Change chromosome 20 to X, just to make plotting easier
    if ($scope.lipids.selectedQtl.qtl.chromosome == 20) {
      $scope.lipids.selectedQtl.qtl.chromosome = "X";
    }

    return "<b>Chromosome:</b> " + $scope.lipids.selectedQtl.qtl.chromosome + "<br/>"
      + "<b>Position:</b> " + parseFloat($scope.lipids.selectedQtl.qtl.position / 1000000).toFixed(3) + " Mbp<br/>"
      + "<b>LOD score:</b> " + parseFloat($scope.lipids.selectedQtl.qtl.lod).toFixed(3);
  }

  $scope.formatQtlOption = function(qtl) {
    if (qtl == 20) {
      return "<b>Chromosome:</b> X<br/>"
        + "<b>Position:</b> " + parseFloat(qtl.position / 1000000).toFixed(3) + " Mbp<br/>" 
        + "<b>LOD score:</b> " + parseFloat(qtl.lod).toFixed(3);
    } else {
      return "<b>Chromosome:</b> " + qtl.chromosome + "<br/>" 
        + "<b>Position:</b> " + parseFloat(qtl.position / 1000000).toFixed(3) + " Mbp<br/>" 
        + "<b>LOD score:</b> " + parseFloat(qtl.lod).toFixed(3);
    }
  }

  $scope.logScope = function() {
    $log.log($scope.$parent)
  }

  var retrieveLipidIdentifications = function() {
    var url = "support/php/queryLipidIdentifications.php";
    
    // httpRequest to submit data to processing script. 
    $http.post(url)
      .then( function(response) {
        // if errors exist, alert user
        if (response.data.hasOwnProperty("error")) {
          alert(response.data.error);
        } else {
          $scope.lipids.options.ids = response.data.identifiedLipids;
          $scope.lipids.options.classes = response.data.lipidClasses;
          $scope.lipids.options.tissues = [
            {
              name: "No Filter",
              filterValue: "",
              id: 0
            },
            {
              name: "Plasma",
              filterValue: "plasma",
              id: 1
            },
            {
              name: "Liver",
              filterValue: "liver",
              id: 3
            }
          ];

          $scope.lipids.filter.class = $scope.lipids.options.classes[0];
          $scope.lipids.filter.tissue = $scope.lipids.options.tissues[0];
        }
    });
  };
  retrieveLipidIdentifications();

  // monitor filter property in $scope.lipids to refilter IDs and QTLs when filtering options change
  $scope.$watch('lipids.filter', function() {
    // 
    $scope.lipids.options.filteredIds = [];
    $scope.lipids.selectedQtl.lipid = null;
    $scope.lipids.selectedQtl.qtl = null;

    $scope.lipids.options.ids.forEach(function(lipid) {
      if ($scope.lipidFilter(lipid)) {
        $scope.lipids.options.filteredIds.push(lipid);
      };
    });
  }, true);

  // Define some watchers to trigger functionality 
  $scope.$watch('lipids.selectedQtl.lipid', function() {
    // reset selectedQtl to default
    $scope.lipids.options.qtls = [];
    $scope.lipids.selectedQtl.qtl = null;

    if ($scope.lipids.selectedQtl.lipid !== null) {
      var url = "support/php/queryQtls.php";
      
      // send selected lipid to server to query qtls is on.
      var data = $scope.lipids.selectedQtl.lipid;

      // httpRequest to submit data to processing script. 
      $http.post(url, data)
        .then( function(response) {
          // if errors exist, alert user
          if (response.data.hasOwnProperty("error")) {
            alert(response.data.error);
          } else {
            $scope.lipids.options.qtls = response.data;
          }
        });
    }
  });

  // monitor filter property in $scope.lipids to refilter IDs and QTLs when filtering options change
  $scope.$watch('lipids.selectedQtl.qtl', function() {
    // Query Lod Values for this QTL
    
    if ($scope.lipids.selectedQtl.qtl !== null) {
      var url = "support/php/queryLodValues.php";
      var data = $scope.lipids.selectedQtl.qtl.id;

      $http.post(url, data)
        .then( function(response) {
          // if errors exist, alert user
          if (response.data.hasOwnProperty("error")) {
            alert(response.data.error);
          } else {
            $scope.updateLodPlot(response.data);
            $scope.set.consensusData.qtl = $scope.lipids.selectedQtl.qtl;
          }
        });

      var url = "support/php/queryAlleleEffectValues.php";

      $http.post(url, data)
        .then( function(response) {
          // if errors exist, alert user
          if (response.data.hasOwnProperty("error")) {
            alert(response.data.error);
          } else {
            $scope.updateAlleleEffectPlot(response.data);
          }
        });

      var url = "support/php/queryGenes.php";
      var data = $scope.lipids.selectedQtl.qtl;

      $http.post(url, data)
        .then( function(response) {
          // if errors exist, alert user
          if (response.data.hasOwnProperty("error")) {
            alert(response.data.error);
          } else {
            $scope.updateGenePlot(response.data);
          }
        });
    }
  });
});

