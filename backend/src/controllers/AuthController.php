<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/SessionService.php';

class AuthController
{
    public function login(): void
    {
        session_start();
        header("Content-Type: application/json");

        // 🔹 Lecture du JSON envoyé par le frontend
        $data = json_decode(file_get_contents("php://input"), true);

        if (
            !$data ||
            !isset($data['login'], $data['password'])
        ) {
            http_response_code(400);
            echo json_encode([
                "verified" => false,
                "message" => "Missing credentials"
            ]);
            return;
        }

        try {
            // ✅ Connexion DB
            $pdo = getPDO();

	$sql = "
    		SELECT 
        		u.user_id,
        		u.first_name,
        		u.last_name,
        		u.role,
        		u.password, 
        		c.club_name
    			FROM users u
    			LEFT JOIN club c ON c.club_id = u.club_id
    			WHERE u.login = :login
    			LIMIT 1
		";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                "login" => $data['login']
            ]);

            $user = $stmt->fetch();

            // ❌ Utilisateur inexistant ou mot de passe invalide
            if (!$user || !password_verify($data['password'], $user['password'])) {
                http_response_code(401);
                echo json_encode([
                    "verified" => false,
                    "message" => "Invalid credentials"
                ]);
                return;
            }

            // ✅ Auth OK → stockage session (MINIMUM utile)
            $_SESSION["user"] = [
                "id"        => $user['user_id'],
                "firstName" => $user['first_name'],
                "lastName"  => $user['last_name'],
                "role"      => $user['role'],
                "club"      => $user['club_name']
            ];

            echo json_encode([
                "verified" => true,
                "user" => $_SESSION["user"]
            ]);

        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode([
                "verified" => false,
                "message" => "Server error",
                "error" => $e->getMessage() // ⚠️ à retirer en prod
            ]);
        }
    }

    public function userAcces(): void
    {
        header("Content-Type: application/json");

        if (SessionService::isAuthenticated()) {
            echo json_encode([
                "access" => true,
                "user" => SessionService::getUser()
            ]);
        } else {
            http_response_code(401);
            echo json_encode([
                "access" => false,
                "message" => "User not authenticated"
            ]);
        }
    }
}
