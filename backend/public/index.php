<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . "/../src/services/SessionService.php";

header("Content-Type: application/json");

// CORS DEV (à ajuster plus tard)
header("Access-Control-Allow-Origin: http://eseo.tp.py12.fr");
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

if ($uri === "/api/authClient" && $_SERVER["REQUEST_METHOD"] === "GET") {
    require_once "../src/controllers/AuthController.php";
    (new AuthController())->userAcces();
    exit;
}

if ($uri === "/api/test-db" && $_SERVER["REQUEST_METHOD"] === "GET") {
    require_once __DIR__ . "/test-db.php";
    exit;
}

if ($uri === "api/user/logout" && $_SERVER["REQUEST_METHOD"] === "POST") {
    require_once "../src/services/SessionService.php";
    (new SessionService())->logout();
    exit;
}


if ($uri === "api/submit/drawing" && $_SERVER["REQUEST_METHOD"] === "POST") {
    require_once "../src/models/Drawing.php";
    (new DrawingController())->setDrawing();
    exit;
}

// 404 fallback
http_response_code(404);
echo json_encode(["message" => "Not found"]);
