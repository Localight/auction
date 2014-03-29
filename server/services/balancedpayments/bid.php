<?php

ini_set("display_errors", 1);

require("../../scripts/vendor/autoload.php");

Httpful\Bootstrap::init();
RESTful\Bootstrap::init();
Balanced\Bootstrap::init();

// Create new API key
print "Create a new API key\n";
$key = new Balanced\APIKey();
$key->save();
print "Our secret is " . $key->secret . "\n";

// Configure with new API key
print "Configure with API key secret " . $key->secret . "\n";
Balanced\Settings::$api_key = $key->secret;

// Create Marketplace for new API key
print "Create a marketplace for the new API key secret\n";
$marketplace = new Balanced\Marketplace();
$marketplace->save();

// Marketplace
print "Balanced\Marketplace::mine(): " . Balanced\Marketplace::mine()->uri . "\n";
print "Marketplace name: " . $marketplace->name . "\n";
print "Changing marketplace name to TestFooey\n";
$marketplace->name = "TestFooey";
$marketplace->save();
print "Marketplace name is now " . $marketplace->name . "\n";

if ($marketplace->name != "TestFooey") {
   throw new Exception("Marketplace name is NOT TestFooey");
}

?>