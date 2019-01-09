<?php
	require("config.php");

	class AlleleEffectPlot {
		var $qtl;
		var $strain;
		var $chromosome;
		var $positions;
		var $alleleEffects;

		function __construct($qtl, $strain, $chromosome, $positionString, $allelEffectString) {
			$this->qtl = $qtl;
			$this->strain = $strain;

			if ($chromosome == 20) {
				$this->chromosome = "X";
			} else {
				$this->chromosome = $chromosome;
			}
			$this->positions = explode(",", $positionString);
			$this->alleleEffects = explode(",", $allelEffectString);

			// cast all strings to double
			for ($i = 0; $i < count($this->positions); $i++) {
				$this->positions[$i] = floatval($this->positions[$i]);
				$this->alleleEffects[$i] = floatval($this->alleleEffects[$i]);
			}
		}
	}

	$data = json_decode(file_get_contents("php://input"));
	$returnArray = [];

	//$stmt = $pdo->prepare('SELECT * FROM qtls WHERE compound_name = :fullName AND (tissue = 3)');
	$stmt = $pdo->prepare('SELECT allele_effect_plots.qtl, founder_strains.name, allele_effect_plots.chromosome, allele_effect_plots.position, allele_effect_plots.qtl_effect FROM allele_effect_plots JOIN founder_strains ON founder_strains.id = allele_effect_plots.strain WHERE allele_effect_plots.qtl = :qtl');
	$success = $stmt->execute(['qtl' => $data]);
	
	if(!$success)	{
		echo (json_encode(array("error" => "Could not retrieve requested QTL data. Please reload the page or try again later.")));
		die;
	} else {
		while($result = $stmt->fetch())
		{
			$returnArray[] = new AlleleEffectPlot($result[0], $result[1], $result[2], $result[3], $result[4]);
		}
	}

	echo json_encode($returnArray);
?>