<?php
	require("config.php");

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

	$returnArray = array();

	$stmt = $pdo->prepare('SELECT * FROM genes ORDER BY chr, start');
	$success = $stmt->execute();

	if (!$success) {
		echo (json_encode(array("error" => "Could not retrieve snps from database.")));
		die;
	} else {
		while($result = $stmt->fetch())
		{
			$returnArray[] = new Gene($result[0], $result[2], $result[3], $result[4], $result[6], $result[9], $result[11], $result[12], $result[13]);
		}
	}

	echo json_encode($returnArray);
?>