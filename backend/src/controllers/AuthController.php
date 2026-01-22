<?php

class AuthController
{
    public function login()
    {
        session_start();
        header("Content-Type: application/json");

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

        require_once __DIR__ . "/../../config/database.php";

        $sql = "
            SELECT 
                u.user_id,
                u.first_name,
                u.last_name,
                u.role,
                u.password,
                c.club_name
            FROM users u
            LEFT JOIN club c ON c.num_club = u.club_id
            WHERE u.login = :login
            LIMIT 1
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            "login" => $data['login']
        ]);

        $user = $stmt->fetch();

        // ❌ utilisateur inexistant OU mauvais mot de passe
        if (!$user || !password_verify($data['password'], $user['password'])) {
            http_response_code(401);
            echo json_encode([
                "verified" => false,
                "message" => "Invalid credentials"
            ]);
            return;
        }

        // ✅ OK → on stocke UNIQUEMENT ce qui est utile
        $_SESSION["user"] = [
            "id" => $user['user_id'],
            "firstName" => $user['first_name'],
            "lastName" => $user['last_name'],
            "role" => $user['role'],
            "club" => $user['club_name']
        ];

        echo json_encode([
            "verified" => true,
            "user" => $_SESSION["user"]
        ]);
    }

    public function userAcces()
    {
        require_once __DIR__ . "/../services/SessionService.php";

        if (SessionService::isAuthenticated()) {
            $user = SessionService::getUser();
            echo json_encode([
                "access" => true,
                "user" => $user
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
