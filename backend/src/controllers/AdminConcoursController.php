<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/SessionService.php';

class AdminConcoursController
{
    private const ALLOWED_ETATS = ['pas commence', 'en cours', 'attente', 'resultat', 'evalue'];

    public function handle(): void
    {
        header("Content-Type: application/json");

        if (!SessionService::isAuthenticated() || !SessionService::isAdmin()) {
            $this->sendError(403, "Acces reserve aux administrateurs");
            return;
        }

        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        switch ($method) {
            case 'GET':
                $this->listConcours();
                return;
            case 'POST':
                $this->createConcours();
                return;
            case 'PUT':
                $this->updateConcours();
                return;
            case 'DELETE':
                $this->deleteConcours();
                return;
            default:
                $this->sendError(405, "Methode non autorisee");
        }
    }

    private function listConcours(): void
    {
        try {
            $pdo = getPDO();
            $sql = "
                SELECT
                    c.numConcours,
                    c.theme,
                    c.dateDebut,
                    c.dateFin,
                    c.etat,
                    c.lieu,
                    c.numPresident,
                    u.nom AS presidentNom,
                    u.prenom AS presidentPrenom
                FROM Concours c
                LEFT JOIN President p ON p.numPresident = c.numPresident
                LEFT JOIN Utilisateur u ON u.numUtilisateur = p.numPresident
                ORDER BY c.dateDebut DESC, c.numConcours DESC
            ";

            $stmt = $pdo->query($sql);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode([
                "success" => true,
                "data" => $rows,
                "count" => count($rows),
            ]);
        } catch (Throwable $e) {
            $this->sendError(500, "Erreur serveur", $e->getMessage());
        }
    }

    private function createConcours(): void
    {
        $data = $this->readJson();
        if ($data === null) {
            $this->sendError(400, "JSON invalide");
            return;
        }

        $validation = $this->validateConcoursPayload($data, false);
        if ($validation !== null) {
            $this->sendError(400, $validation);
            return;
        }

        try {
            $pdo = getPDO();

            $sql = "
                INSERT INTO Concours (theme, dateDebut, dateFin, etat, lieu, numPresident)
                VALUES (:theme, :dateDebut, :dateFin, :etat, :lieu, :numPresident)
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'theme' => $data['theme'],
                'dateDebut' => $data['dateDebut'],
                'dateFin' => $data['dateFin'],
                'etat' => $data['etat'],
                'lieu' => $data['lieu'],
                'numPresident' => $this->nullableInt($data['numPresident'] ?? null),
            ]);

            http_response_code(201);
            echo json_encode([
                "success" => true,
                "numConcours" => (int)$pdo->lastInsertId(),
            ]);
        } catch (Throwable $e) {
            $this->sendError(500, "Erreur serveur", $e->getMessage());
        }
    }

    private function updateConcours(): void
    {
        $data = $this->readJson();
        if ($data === null) {
            $this->sendError(400, "JSON invalide");
            return;
        }

        if (!isset($data['numConcours'])) {
            $this->sendError(400, "numConcours manquant");
            return;
        }

        $validation = $this->validateConcoursPayload($data, true);
        if ($validation !== null) {
            $this->sendError(400, $validation);
            return;
        }

        try {
            $pdo = getPDO();
            $sql = "
                UPDATE Concours
                SET theme = :theme,
                    dateDebut = :dateDebut,
                    dateFin = :dateFin,
                    etat = :etat,
                    lieu = :lieu,
                    numPresident = :numPresident
                WHERE numConcours = :numConcours
                LIMIT 1
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'theme' => $data['theme'],
                'dateDebut' => $data['dateDebut'],
                'dateFin' => $data['dateFin'],
                'etat' => $data['etat'],
                'lieu' => $data['lieu'],
                'numPresident' => $this->nullableInt($data['numPresident'] ?? null),
                'numConcours' => (int)$data['numConcours'],
            ]);

            if ($stmt->rowCount() === 0) {
                $this->sendError(404, "Concours introuvable");
                return;
            }

            http_response_code(200);
            echo json_encode(["success" => true]);
        } catch (Throwable $e) {
            $this->sendError(500, "Erreur serveur", $e->getMessage());
        }
    }

    private function deleteConcours(): void
    {
        $data = $this->readJson();
        if ($data === null) {
            $this->sendError(400, "JSON invalide");
            return;
        }

        if (!isset($data['numConcours'])) {
            $this->sendError(400, "numConcours manquant");
            return;
        }

        $numConcours = (int)$data['numConcours'];

        try {
            $pdo = getPDO();

            // Avoid FK violations by checking dependent rows first.
            $checks = [
                ['sql' => 'SELECT COUNT(*) FROM Dessin WHERE numConcours = :numConcours', 'label' => 'dessins'],
                ['sql' => 'SELECT COUNT(*) FROM ParticipeCompetiteur WHERE numConcours = :numConcours', 'label' => 'participants'],
                ['sql' => 'SELECT COUNT(*) FROM Jury WHERE numConcours = :numConcours', 'label' => 'jury'],
                ['sql' => 'SELECT COUNT(*) FROM ParticipeClub WHERE numConcours = :numConcours', 'label' => 'clubs'],
            ];

            foreach ($checks as $check) {
                $stmt = $pdo->prepare($check['sql']);
                $stmt->execute(['numConcours' => $numConcours]);
                if ((int)$stmt->fetchColumn() > 0) {
                    $this->sendError(409, "Suppression impossible: {$check['label']} existant(s)");
                    return;
                }
            }

            $stmt = $pdo->prepare('DELETE FROM Concours WHERE numConcours = :numConcours LIMIT 1');
            $stmt->execute(['numConcours' => $numConcours]);

            if ($stmt->rowCount() === 0) {
                $this->sendError(404, "Concours introuvable");
                return;
            }

            http_response_code(200);
            echo json_encode(["success" => true]);
        } catch (Throwable $e) {
            $this->sendError(500, "Erreur serveur", $e->getMessage());
        }
    }

    private function validateConcoursPayload(array $data, bool $isUpdate): ?string
    {
        $required = ['theme', 'dateDebut', 'dateFin', 'etat', 'lieu'];
        foreach ($required as $field) {
            if (!isset($data[$field]) || trim((string)$data[$field]) === '') {
                return "Champ manquant: $field";
            }
        }

        $etat = (string)$data['etat'];
        if (!in_array($etat, self::ALLOWED_ETATS, true)) {
            return "Etat invalide";
        }

        return null;
    }

    private function readJson(): ?array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        return is_array($data) ? $data : null;
    }

    private function nullableInt($value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }
        return (int)$value;
    }

    private function sendError(int $code, string $message, ?string $details = null): void
    {
        http_response_code($code);
        $response = [
            "success" => false,
            "message" => $message,
        ];

        if ($details && getenv('APP_ENV') !== 'production') {
            $response['error'] = $details;
        }

        echo json_encode($response);
    }
}
