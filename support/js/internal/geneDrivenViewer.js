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

  // initialize Javascript object to store gene lookup params
  $scope.genes = {
    selectedGene: {
      gene: null,
      qtl: null
    },
    filter: {
      chromosome: null,
      position: 0
    },
    options: {
      genes: [],
      chromosomes: [
        { id: 1, name: "1", start: 3, stop: 196 },
        { id: 2, name: "2", start: 3, stop: 183 },
        { id: 3, name: "3", start: 3, stop: 161 },
        { id: 4, name: "4", start: 3, stop: 157 },
        { id: 5, name: "5", start: 3, stop: 152 },
        { id: 6, name: "6", start: 3, stop: 150 },
        { id: 7, name: "7", start: 3, stop: 146 },
        { id: 8, name: "8", start: 3, stop: 130 },
        { id: 9, name: "9", start: 3, stop: 125 },
        { id: 10, name: "10", start: 3, stop: 131 },
        { id: 11, name: "11", start: 3, stop: 123 },
        { id: 12, name: "12", start: 3, stop: 121 },
        { id: 13, name: "13", start: 3, stop: 121 },
        { id: 14, name: "14", start: 3, stop: 125 },
        { id: 15, name: "15", start: 3, stop: 105 },
        { id: 16, name: "16", start: 3, stop: 98 },
        { id: 17, name: "17", start: 3, stop: 95 },
        { id: 18, name: "18", start: 3, stop: 91 },
        { id: 19, name: "19", start: 3, stop: 62 },
        { id: 20, name: "X", start: 3, stop: 170 },
      ],
      qtls: []
    }
  };

  // format gene selectedbox option
  $scope.formatGene = function(gene) {
    if (!gene) {
      return "";
    } else {
      return "<b>Gene Name: </b>" + gene.name + "<br/>" 
      + "<b>MGI Name: </b>" + gene.mgiName + "<br/>"
      + "<b>Chromosome: </b>" + gene.chromosome + "<br/>"
      + "<b>Start: </b>" + $scope.formatGeneLocation(gene.start) + "<br/>" 
      + "<b>Stop: </b>" + $scope.formatGeneLocation(gene.stop);
    }
  };

  $scope.formatGeneLocation = function(number) {
    return (number / 1000000).toFixed(3) + " Mbp";
  };

  // format gene selectedbox option
  $scope.formatChromosome = function(chromosome) {
    if (!chromosome) {
      return "";
    } else {
      return "<b>Chromosome: </b>" + chromosome.name + "<br/>";
    }
  };

  $scope.formatSelectedQtl = function() {
    if ($scope.genes.selectedGene.qtl == null) {
      return "";
    }

    // Change chromosome 20 to X, just to make plotting easier
    if ($scope.genes.selectedGene.qtl.chromosome == 20) {
      $scope.genes.selectedGene.qtl.chromosome = "X";
    }

    return "<b>Analyte: </b> " + $scope.genes.selectedGene.qtl.compound_name + "<br/>"
      + "<b>Tissue: </b> " + $scope.genes.selectedGene.qtl.tissueName + "<br/>"
      + "<b>Position: </b> " + parseFloat($scope.genes.selectedGene.qtl.position / 1000000).toFixed(3) + " Mbp<br/>"
      + "<b>LOD score: </b> " + parseFloat($scope.genes.selectedGene.qtl.lod).toFixed(3);
  };

  $scope.formatQtlOption = function(qtl) {
    return "<b>Analyte: </b> " + qtl.compound_name + "<br/>"
      + "<b>Tissue: </b> " + qtl.tissueName + "<br/>"
      + "<b>Position: </b> " + parseFloat(qtl.position / 1000000).toFixed(3) + " Mbp<br/>"
      + "<b>LOD score: </b> " + parseFloat(qtl.lod).toFixed(3);
  };

  $scope.logScope = function() {
    $log.log($scope.$parent)
  };

  var retrieveAllGenes = function() {
    var url = "support/php/queryAllGenes.php";
    
    // httpRequest to submit data to processing script. 
    $http.post(url)
      .then( function(response) {
        // if errors exist, alert user
        if (response.data.hasOwnProperty("error")) {
          alert(response.data.error);
        } else {
          $scope.genes.options.genes = response.data;
        }
    });
  };
  retrieveAllGenes();

  $scope.$watch('genes.selectedGene.gene', function() {
    if ($scope.genes.selectedGene.gene) {

      $scope.genes.options.chromosomes.forEach(function(chromosome) {
        if (chromosome.id == $scope.genes.selectedGene.gene.chromosome) {
          $scope.genes.filter.chromosome = chromosome;
          $scope.genes.filter.position = parseFloat((($scope.genes.selectedGene.gene.start + $scope.genes.selectedGene.gene.stop) / 2000000).toFixed(3));
        }
      });
    }
  }, true);

  $scope.$watch('genes.filter', function() {
    $scope.genes.options.qtls = [];
    $scope.genes.selectedQtl = null;

    if ($scope.genes.filter.chromosome != null) {
      if ($scope.genes.filter.position <= $scope.genes.filter.chromosome.start) {
        $scope.genes.filter.position = $scope.genes.filter.chromosome.start;
      } else if ($scope.genes.filter.position >= $scope.genes.filter.chromosome.stop) {
        $scope.genes.filter.position = $scope.genes.filter.chromosome.stop;
      }

      var url = "support/php/queryQTLsUsingPosition.php";

      // Query QTLs using chromosome & genomic position instead of using lipid IDs
      var data = {
        chromosome: $scope.genes.filter.chromosome.id,
        position: $scope.genes.filter.position,
        window: 2
      };

      // httpRequest to submit data to processing script. 
      $http.post(url, data)
        .then( function(response) {
          // if errors exist, alert user
          if (response.data.hasOwnProperty("error")) {
            alert(response.data.error);
          } else {
            $log.log(response.data);
            $scope.genes.options.qtls = response.data;
          }
        });
    }
  }, true);

  // monitor filter property in $scope.lipids to refilter IDs and QTLs when filtering options change
  $scope.$watch('genes.selectedGene.qtl', function() {
    // Query Lod Values for this QTL
    
    if ($scope.genes.selectedGene.qtl !== null) {
      var url = "support/php/queryLodValues.php";
      var data = $scope.genes.selectedGene.qtl.id;

      $http.post(url, data)
        .then( function(response) {
          // if errors exist, alert user
          if (response.data.hasOwnProperty("error")) {
            alert(response.data.error);
          } else {
            $scope.updateLodPlot(response.data);
            $scope.set.consensusData.qtl = $scope.genes.selectedGene.qtl;
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
      var data = $scope.genes.selectedGene.qtl;

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

