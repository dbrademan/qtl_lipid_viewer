<?php
	require("config.php");

	class LodPlot {
		var $qtl;
		var $chromosome;
		var $positions;
		var $lods;

		function __construct($qtl, $chromosome, $positionString, $lodString) {
			$this->qtl = $qtl;
			if ($chromosome == 20) {
				$this->chromosome = "X";
			} else {
				$this->chromosome = $chromosome;
			}
			$this->positions = explode(",", $positionString);
			$this->lods = explode(",", $lodString);

			// cast all strings to double
			for ($i = 0; $i < count($this->positions); $i++) {
				$this->positions[$i] = floatval($this->positions[$i]);
				$this->lods[$i] = floatval($this->lods[$i]);
			}
		}
	}

	$data = json_decode(file_get_contents("php://input"));
	$returnObject = null;

	//$stmt = $pdo->prepare('SELECT * FROM qtls WHERE compound_name = :fullName AND (tissue = 3)');
	$stmt = $pdo->prepare('SELECT * FROM lod_plots WHERE qtl = :qtl');
	$success = $stmt->execute(['qtl' => $data]);
	
	if(!$success)	{
		echo (json_encode(array("error" => "Could not retrieve requested QTL data. Please reload the page or try again later.")));
		die;
	} else {
		while($result = $stmt->fetch())
		{
			$returnObject = new LodPlot($result[0], $result[1], $result[2], $result[3]);
		}
	}

	echo json_encode($returnObject);
?>