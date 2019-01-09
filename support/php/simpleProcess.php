<?php
	$data = json_decode(file_get_contents("php://input"));

	$data++;
	
	echo json_encode(array("count" => $data));
?>