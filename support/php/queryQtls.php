<?php
	require("config.php");

	// query qtls that have 
	class QTL {
		var $id;
		var $compound_name;
		var $measurement;
		var $tissue;
		var $chromosome;
		var $position;
		var $lod;

		function __construct($id, $compound_name, $measurement, $tissue, $chromosome, $position, $lod) {
			$this->id = $id;
			$this->compound_name = $compound_name;
			$this->measurement = $measurement;
			$this->tissue = $tissue;
			$this->chromosome = $chromosome;
			$this->position = $position;
			$this->lod = $lod;
		}
	}

	$data = json_decode(file_get_contents("php://input"));
	$returnArray = [];

	// gonna query twice because i'm too lazy to reformat some database entries
	$stmt = $pdo->prepare('SELECT * FROM qtls WHERE compound_name = :fullName AND (tissue = 1)');
	$success = $stmt->execute(['fullName' => $data->fullName]);
	
	if(!$success)
	{
		echo (json_encode(array("error" => "Could not retrieve uploaded qtls.")));
		die;
	} else {
		while($result = $stmt->fetch())
		{
			$returnArray[] = new QTL($result[0], $result[1], $result[2], $result[3], $result[4], $result[5], $result[6]);
		}
	}

	$stmt = $pdo->prepare('SELECT * FROM qtls WHERE compound_name = :fullName AND (tissue = 3)');
	$success = $stmt->execute(['fullName' => "Lipids_" . $data->fullName]);
	
	if(!$success)
	{
		echo (json_encode(array("error" => "Could not retrieve uploaded qtls.")));
		die;
	} else {
		while($result = $stmt->fetch())
		{
			$returnArray[] = new QTL($result[0], $result[1], $result[2], $result[3], $result[4], $result[5], $result[6]);
		}
	}

	echo json_encode($returnArray);
?>