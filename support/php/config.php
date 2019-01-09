<?php
	$host = 'localhost';
	$db   = 'lipid_qtl_viewer';
	$username = 'root';
	$password = '';
	$charset = 'utf8';
	
	$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
	$opt = [
			PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
			PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_BOTH,
			PDO::ATTR_EMULATE_PREPARES   => false
	];
	$pdo = new PDO($dsn, $username, $password, $opt);
	$supportFolder = "C:/Software/XAMPP/htdocs/Projects/LipidQtlViewer/support/";
?>