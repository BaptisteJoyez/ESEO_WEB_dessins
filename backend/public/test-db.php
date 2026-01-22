<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . "/../src/config/database.php";

try {
    $pdo = getPDO(); // 🔑 LIGNE MANQUANTE

    $stmt = $pdo->query("SELECT 1");

    echo json_encode([
        "status" => "ok",
        "message" => "PHP connected to DB"
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
