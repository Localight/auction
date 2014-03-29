<?php

ini_set("display_errors", 0);

if(isset($_REQUEST['m']))
{
	switch($_REQUEST['m'])
	{
		case 'p':
			// Define the url for the HTTP POST.
			$url="https://api.objectrocket.com/db/havenly/collection/items/post";
		break;
		case 'g':
			// Define the url for the HTTP POST.
			$url="https://api.objectrocket.com/db/havenly/collection/items/get";
		break;
		default:
		break;
	}	
} else {
	$url = 'ERROR';
}


// The api key of your ObjectRocket user.
$apiKey="4e6eef5ecc7f40f8ae6159d28afa1e8d";

// Define document query to get all items.
$document = json_encode(array("itemNumber" => array('$ne' => '')));

// Define the HTTP POST parameters.
$params="api_key=".$apiKey."&doc=".$document;

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

echo $result;

// Close curl.
curl_close($ch);

?>