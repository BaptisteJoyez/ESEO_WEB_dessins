<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/SessionService.php';

class AuthController
{
    public function register(): void
    {
        SessionService::start();
        header("Content-Type: application/json");

        $data = json_decode(file_get_contents("php://input"), true);

        $required = ['nom', 'prenom', 'login', 'password'];
        foreach ($required as $field) {
            if (!is_array($data) || !isset($data[$field]) || trim((string)$data[$field]) === '') {
                http_response_code(400);
                echo json_encode([
                    "success" => false,
                    "message" => "Champ manquant: $field"
                ]);
                return;
            }
        }

        $nom = trim((string)$data['nom']);
        $prenom = trim((string)$data['prenom']);
        $login = trim((string)$data['login']);
        $password = (string)$data['password'];
        $age = isset($data['age']) && $data['age'] !== '' ? (int)$data['age'] : null;
        $sexe = isset($data['sexe']) && $data['sexe'] !== '' ? (string)$data['sexe'] : null;
        $adresse = isset($data['adresse']) ? trim((string)$data['adresse']) : null;
        $numClub = isset($data['numClub']) && $data['numClub'] !== '' ? (int)$data['numClub'] : null;

        if ($sexe !== null && !in_array($sexe, ['H', 'F'], true)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Valeur invalide pour sexe"
            ]);
            return;
        }

        try {
            $pdo = getPDO();
            $pdo->beginTransaction();

            $checkStmt = $pdo->prepare("SELECT 1 FROM Utilisateur WHERE login = :login LIMIT 1");
            $checkStmt->execute(["login" => $login]);
            if ($checkStmt->fetchColumn()) {
                $pdo->rollBack();
                http_response_code(409);
                echo json_encode([
                    "success" => false,
                    "message" => "Login déjà utilisé"
                ]);
                return;
            }

            $hash = password_hash($password, PASSWORD_DEFAULT);

            $insertUserSql = "
                INSERT INTO Utilisateur (nom, prenom, age, sexe, adresse, login, motDePasse, numClub)
                VALUES (:nom, :prenom, :age, :sexe, :adresse, :login, :motDePasse, :numClub)
            ";
            $insertUserStmt = $pdo->prepare($insertUserSql);
            $insertUserStmt->execute([
                "nom" => $nom,
                "prenom" => $prenom,
                "age" => $age,
                "sexe" => $sexe,
                "adresse" => $adresse,
                "login" => $login,
                "motDePasse" => $hash,
                "numClub" => $numClub,
            ]);

            $userId = (int)$pdo->lastInsertId();

            // Every registered user acts as a competitor by default.
            $insertCompetiteurSql = "
                INSERT INTO Competiteur (numCompetiteur, datePremParticipation, niveau)
                VALUES (:numCompetiteur, CURRENT_DATE, :niveau)
            ";
            $insertCompetiteurStmt = $pdo->prepare($insertCompetiteurSql);
            $insertCompetiteurStmt->execute([
                "numCompetiteur" => $userId,
                "niveau" => $data['niveau'] ?? 'debutant',
            ]);

            $clubName = null;
            if ($numClub) {
                $clubStmt = $pdo->prepare("SELECT nomClub FROM Club WHERE numClub = :numClub LIMIT 1");
                $clubStmt->execute(["numClub" => $numClub]);
                $clubRow = $clubStmt->fetch(PDO::FETCH_ASSOC);
                $clubName = $clubRow['nomClub'] ?? null;
            }

            $pdo->commit();

            $_SESSION["user"] = [
                "id" => $userId,
                "firstName" => $prenom,
                "lastName" => $nom,
                "club" => $clubName,
                "login" => $login,
                "isAdmin" => false,
                "role" => "competiteur",
            ];

            http_response_code(201);
            echo json_encode([
                "success" => true,
                "user" => $_SESSION["user"]
            ]);
        } catch (Throwable $e) {
            if (isset($pdo) && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Server error",
                "error" => $e->getMessage()
            ]);
        }
    }

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
                    u.login,
                    c.nomClub,
                    (a.numAdministrateur IS NOT NULL) AS isAdmin
                FROM Utilisateur u
                LEFT JOIN Club c ON c.numClub = u.numClub
                LEFT JOIN Administrateur a ON a.numAdministrateur = u.numUtilisateur
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
                "club"      => $user['nomClub'],
                "login"     => $user['login'],
                "isAdmin"   => (bool)$user['isAdmin'],
                "role"      => $user['isAdmin'] ? "admin" : "competiteur"
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
