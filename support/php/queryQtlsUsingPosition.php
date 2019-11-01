<?php
	require("config.php");

	// query qtls that have 
	class QTL {
		var $id;
		var $compound_name;
		var $measurement;
		var $tissueName;
		var $chromosome;
		var $position;
		var $lod;

		function __construct($id, $compound_name, $measurement, $tissue, $chromosome, $position, $lod, $tissueName) {
			$this->id = $id;
			$this->compound_name = $compound_name;
			$this->measurement = $measurement;
			$this->tissue = $tissue;
			$this->tissueName = $tissueName;
			$this->chromosome = $chromosome;
			$this->position = $position;
			$this->lod = $lod;
		}
	}

	$data = json_decode(file_get_contents("php://input"));
	$returnArray = [];

	// gonna query QTLs where measurement = lipidomics and tissue = plasma or liver
	$stmt = $pdo->prepare('SELECT * FROM qtls JOIN tissues ON tissues.id = qtls.tissue WHERE qtls.measurement = 1 AND (qtls.tissue = 1 OR qtls.tissue = 3) AND qtls.chromosome = :chromosome AND qtls.position >= :minWindow AND qtls.position <= :maxWindow');
	$success = $stmt->execute([':chromosome' => $data->chromosome, ':minWindow' => ($data->position - $data->window) * 1000000, ':maxWindow' => ($data->position + $data->window) * 1000000]);
	
	if(!$success)
	{
		echo (json_encode(array("error" => "Could not retrieve uploaded qtls.")));
		die;
	} else {
		while($result = $stmt->fetch())
		{
			$returnArray[] = new QTL($result[0], $result[1], $result[2], $result[3], $result[4], $result[5], $result[6], $result[8]);
		}
	}

	echo json_encode($returnArray);
?>