<?php
	require("config.php");

	class ReturnObject {
		var $identifiedLipids;
		var $lipidClasses;

		function __construct() {
			$this->identifiedLipids = [];
			$this->lipidClasses = [new LipidClass("No Filter", "")];
		}

		function SetIdentifiedLipids($pdo) {
			$stmt = $pdo->prepare('SELECT data_name, category, class, rt, mz, polarity, analyte FROM lipid_identifications');
			$success = $stmt->execute();
			
			if(!$success)
			{
				echo (json_encode(array("error" => "Could not retrieve uploaded lipid identifications.")));
				die;
			} else {
				while($result = $stmt->fetch())
				{
					$this->identifiedLipids[] = new LipidIdentification($result[0], $result[1], $result[2], $result[3], $result[4], $result[5], $result[6]);
				}
			}
		}

		function SetLipidClasses($pdo) {
			$stmt = $pdo->prepare('SELECT DISTINCT class FROM lipid_identifications');
			$success = $stmt->execute();
			
			if(!$success)
			{
				echo (json_encode(array("error" => "Could not retrieve uploaded lipid identifications.")));
				die;
			} else {
				while($result = $stmt->fetch())
				{
					$this->lipidClasses[] = new LipidClass($result[0]);
				}
			}
		}
	}

	class LipidIdentification {
		var $fullName;
		var $tissue;
		var $class;
		var $rt;
		var $precursorMz;
		var $polarity;
		var $analyteName;

		function __construct($fullName, $tissue, $class, $rt, $precursorMz, $polarity, $analyteName) {
			$this->fullName = $fullName;
			$this->tissue = explode(" ", $tissue)[0];
			$this->class = $class;
			$this->rt = $rt;
			$this->precursorMz = $precursorMz;
			$this->polarity = $polarity;
			$this->analyteName = $analyteName;
		}
	}

	class LipidClass {
		var $className;
		var $filterValue;

		function __construct($className, $filterValue = null) {
			$this->className = $className;

			if (isset($filterValue)) {
				$this->filterValue = $filterValue;
			} else {
				$this->filterValue = $className;
			}
			
		}
	}

	$returnObject = new ReturnObject();
	$returnObject->SetIdentifiedLipids($pdo);
	$returnObject->SetLipidClasses($pdo);

	echo json_encode($returnObject);
?>