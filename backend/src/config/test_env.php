<?php
require_once "../config/env.php";

echo json_encode([
    "host" => $_ENV['DB_HOST'],
    "db"   => $_ENV['DB_NAME'],
    "user" => $_ENV['DB_USER']
]);
