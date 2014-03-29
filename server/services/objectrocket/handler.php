<?php

// database
$db="havenly";

$collection = array();

//  Students collection
$collection['students']="students";

// api key
$apiKey="4e6eef5ecc7f40f8ae6159d28afa1e8d";

switch($collection)
{
	case 'STUDENT':
	break;
	default:
	break;
}

// api url
$url="https://api.objectrocket.com/db/".$db."/collection/".$collection['students']."/add";

// add
$studentArr = array(
	"_id"			=> "2341",
	"firstName"		=> "Johnny",
	"lastName"		=> "Rocket",		
	"number"		=> "9877",
	"classNumber"	=> "4"
	);

//delete 
$studentDeleteArray = array(
	"_id" => array("$eq" => "1234") 
);

// Define the HTTP POST parameters.
$params="api_key=".$apiKey."&doc=".json_encode($studentDelArray);

print_r("HTTP POST parameters: \n".$params."\n\n");

// Initialize curl.
$ch = curl_init( $url );

// Configure curl options.
$options = array(
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => 1,
    CURLOPT_HTTPHEADER => array('Content-type: application/x-www-form-urlencoded') ,
    CURLOPT_POSTFIELDS => $params
);

// Set curl options.
curl_setopt_array( $ch, $options );

// Execute the post and get results.
$result = curl_exec($ch);

print_r("CURL results: \n".$result."\n\n");

// Close curl.
curl_close($ch);

?>