<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/SessionService.php';

class AuthController
{
    public function login(): void
    {
        SessionService::start();
        header("Content-Type: application/json");

        $data = json_decode(file_get_contents("php://input"), true);

        if (!$data || !isset($data['login'], $data['password'])) {
            http_response_code(400);
            echo json_encode([
                "verified" => false,
                "message" => "Missing credentials"
            ]);
            return;
        }

        try {
            $pdo = getPDO();

            $sql = "
                SELECT
                    u.numUtilisateur,
                    u.prenom,
                    u.nom,
                    u.motDePasse,
                    c.nomClub
                FROM Utilisateur u
                LEFT JOIN Club c ON c.numClub = u.numClub
                WHERE u.login = :login
                LIMIT 1
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                "login" => $data['login']
            ]);

            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user || !password_verify($data['password'], $user['motDePasse'])) {
                http_response_code(401);
                echo json_encode([
                    "verified" => false,
                    "message" => "Invalid credentials"
                ]);
                return;
            }

            // ✅ Session cohérente avec la BDD
            $_SESSION["user"] = [
                "id"        => $user['numUtilisateur'],
                "firstName" => $user['prenom'],
                "lastName"  => $user['nom'],
                "club"      => $user['nomClub']
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
                "error" => $e->getMessage() // à enlever en prod
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
