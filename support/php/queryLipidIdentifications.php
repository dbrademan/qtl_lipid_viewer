<?php
	require("config.php");

	class ReturnObject {
		var $identifiedLipids;
		var $lipidClasses;

		function __construct() {
			$this->identifiedLipids = [];
			$this->lipidClasses = [];
		}

		function SetIdentifiedLipids($pdo) {
			$stmt = $pdo->prepare('SELECT data_name, new_data_name, category, class, new_class, rt, mz, polarity, analyte, new_analyte FROM new_lipid_identifications');
			$success = $stmt->execute();
			
			if(!$success)
			{
				echo (json_encode(array("error" => "Could not retrieve uploaded lipid identifications.")));
				die;
			} else {
				while($result = $stmt->fetch())
				{
					$this->identifiedLipids[] = new LipidIdentification($result[0], $result[1], $result[2], $result[3], $result[4], $result[5], $result[6], 
						$result[7], $result[8], $result[9]);
				}
			}
		}

		function SetLipidClasses($pdo) {
			$stmt = $pdo->prepare('SELECT DISTINCT new_class FROM new_lipid_identifications');
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
				
				usort($this->lipidClasses, array($this, "comparator"));
				array_unshift($this->lipidClasses, new LipidClass("No Filter", ""));
			}
		}

		function comparator($a, $b) {
			return strcmp($a->className, $b->className);
		}
	}

	class LipidIdentification {
		var $fullName;
		var $fullNewName;
		var $tissue;
		var $class;
		var $newClass;
		var $rt;
		var $precursorMz;
		var $polarity;
		var $analyteName;
		var $newAnalyteName;

		function __construct($fullName, $fullNewName, $tissue, $class, $newClass, $rt, $precursorMz, $polarity, $analyteName, $newAnalyteName) {
			$this->fullName = $fullName;
			$this->newFullName = $fullNewName;
			$this->tissue = explode(" ", $tissue)[0];
			$this->class = $class;
			$this->newClass = $newClass;
			$this->rt = $rt;
			$this->precursorMz = $precursorMz;
			$this->polarity = $polarity;
			$this->analyteName = $analyteName;
			$this->newAnalyteName = $newAnalyteName;
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