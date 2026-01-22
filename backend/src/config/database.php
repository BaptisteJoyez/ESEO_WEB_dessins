<?php

function getPDO(): PDO
{
    $envPath = __DIR__ . '/../../.env';

    if (!file_exists($envPath)) {
        throw new Exception("Missing .env file");
    }

    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    foreach ($lines as $line) {
        if ($line === '' || str_starts_with(trim($line), '#')) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $_ENV[$key] = trim($value);
    }

    // echo json_encode([
    //     "DB_HOST" => $_ENV['DB_HOST'] ?? null,
    //     "DB_NAME" => $_ENV['DB_NAME'] ?? null,
    //     "DB_USER" => $_ENV['DB_USER'] ?? null,
    //     "DB_PASSWORD" => isset($_ENV['DB_PASSWORD']) ? '***SET***' : null
    // ]);
    // exit;

    if (
        !isset(
            $_ENV['DB_HOST'],
            $_ENV['DB_NAME'],
            $_ENV['DB_USER'],
            $_ENV['DB_PASSWORD']
        )
    ) {
        throw new Exception('Database env vars missing: host, name, user, password');
    }

    return new PDO(
        sprintf(
            "mysql:host=%s;dbname=%s;charset=utf8mb4",
            $_ENV['DB_HOST'],
            $_ENV['DB_NAME']
        ),
        $_ENV['DB_USER'],
        $_ENV['DB_PASSWORD'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
}
