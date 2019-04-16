<?php
	require("config.php");

	// returnObject 
	class returnObject {
		var $genes;
		var $snps;

		function __construct() {
			$this->genes = [];
			$this->snps = [];
		}
	}

	// query qtls that have 
	class SNP {
		var $snp;
		var $chromosome;
		var $position;
		var $alleles;
		var $sdp;
		var $ensemble_gene;
		var $csq;
		var $analyte;
		var $tissue;

		function __construct($snp, $chromosome, $position, $alleles, $sdp, $ensembl_gene, $csq, $analyte, $tissue) {
			$this->snp = $snp;
			$this->chromosome = $chromosome;
			$this->position = floatval($position) * 1000000;
			$this->alleles = $alleles;
			$this->sdp = $sdp;
			$this->ensembl_gene = $ensembl_gene;
			$this->csq = $csq;
			$this->analyte = $analyte;
			$this->tissue = $tissue;
		}
	}

	// query qtls that have 
	class Gene {
		var $chromosome;
		var $type;
		var $start;
		var $stop;
		var $strand;
		var $name;
		var $databaseCrossReference;
		var $mgiName;
		var $bioType;

		function __construct($chromosome, $type, $start, $stop, $strand, $name, $databaseCrossReference, $mgiName, $bioType) {
			$this->chromosome = $chromosome;
			$this->type = $type;
			$this->start = $start;
			$this->stop = $stop;
			$this->strand = $strand;
			$this->name = $name;
			$this->databaseCrossReference = $databaseCrossReference;
			$this->mgiName = $mgiName;
			$this->bioType = $bioType;
		}
	}

	$data = json_decode(file_get_contents("php://input"));

	if ($data->tissue == 3) {
		$data->compound_name = str_replace("Lipids_", "", $data->compound_name);
	}

	$returnObject = new returnObject();
	
	// get snps from the range given and return all the snps for this qtl
	$stmt = $pdo->prepare('SELECT * FROM snps WHERE analyte = :analyte AND chr = :chr');
	$success = $stmt->execute(['analyte' => $data->compound_name, 'chr' => $data->chromosome]);

	if (!$success) {
		echo (json_encode(array("error" => "Could not retrieve snps from database.")));
		die;
	} else {
		while($result = $stmt->fetch())
		{
			$returnObject->snps[] = new SNP($result[0], $result[1], $result[2], $result[3], $result[4], $result[5], $result[6], $result[7], $result[8]);
		}
	}

	$stmt = $pdo->prepare('SELECT * FROM genes WHERE chr = :chromosome');
	$success = $stmt->execute(['chromosome' => $data->chromosome]);
	
	if(!$success)
	{
		echo (json_encode(array("error" => "Could not retrieve genes from database.")));
		die;
	} else {
		while($result = $stmt->fetch())
		{
			$returnObject->genes[] = new Gene($result[0], $result[2], $result[3], $result[4], $result[6], $result[9], $result[11], $result[12], $result[13]);
		}
	}

	echo json_encode($returnObject);
?>