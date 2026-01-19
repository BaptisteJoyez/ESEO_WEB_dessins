<?php
// backend/src/services/SessionService.php

class SessionService
{
    public static function start(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public static function login(array $user): void
    {
        self::start();
        $_SESSION["user"] = $user;
    }

    public static function logout(): void
    {
        self::start();
        $_SESSION = [];
        session_destroy();
    }

    public static function isAuthenticated(): bool
    {
        self::start();
        return isset($_SESSION["user"]);
    }

    public static function getUser(): ?array
    {
        self::start();
        return $_SESSION["user"] ?? null;
    }
}
