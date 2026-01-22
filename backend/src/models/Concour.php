<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/SessionService.php';
require_once __DIR__ . '/../models/Drawing.php';



class ConcourController
{
    public function getConcour(): void
    {

        // 🔹 Lecture du JSON envoyé par le frontend
        $data = json_decode(file_get_contents("php://input"), true);

        if (
            !$data ||
            !isset($data['drawing'], $data['login'], $data['commentaire'], $data['format'], $data['technique'], $data['numConcours'])
        ) {
            http_response_code(response_code: 400);
            echo json_encode([
                "verified" => false,
                "message" => "Missing credentials"
            ]);
            return;
        }

        try {
            // ✅ Connexion DB
            $pdo = getPDO();

            $sql = `
		`;
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
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode([
                "verified" => false,
                "message" => "Server error",
                "error" => $e->getMessage() // ⚠️ à retirer en prod
            ]);
        }
    }
}
