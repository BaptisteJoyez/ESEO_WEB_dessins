<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../src/config/env.php';

try {
    $dsn = sprintf(
        "mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4",
        $_ENV['DB_HOST'],
        $_ENV['DB_PORT'],
        $_ENV['DB_NAME']
    );

    $pdo = new PDO(
        $dsn,
        $_ENV['DB_USER'],
        $_ENV['DB_PASSWORD'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]
    );

    $stmt = $pdo->query("SELECT DATABASE()");
    $db = $stmt->fetchColumn();

    echo json_encode([
        "status" => "OK",
        "connected_to" => $db
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "ERROR",
        "message" => $e->getMessage()
    ]);
}
