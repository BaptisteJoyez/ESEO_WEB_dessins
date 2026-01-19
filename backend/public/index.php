<?php
 
session_start();
header("Content-Type: application/json");
 
// CORS DEV (à ajuster plus tard)
header("Access-Control-Allow-Origin: http://localhost:8080");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
 
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
 
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
 
// ROUTING SIMPLE
if ($uri === "/api/user/login" && $_SERVER["REQUEST_METHOD"] === "POST") {
    require_once "../src/controllers/AuthController.php";
    (new AuthController())->login();
    exit;
}
 
// 404 fallback
http_response_code(404);
echo json_encode(["message" => "Not found"]);