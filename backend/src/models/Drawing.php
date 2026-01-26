<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/SessionService.php';
require_once __DIR__ . '/../models/Drawing.php';

class DrawingController
{
    public function setDrawing(): void
    {
        // Lecture des données JSON
        $data = json_decode(file_get_contents("php://input"), true);

        // Validation des champs requis
        $requiredFields = ['drawing', 'login', 'commentaire', 'format', 'technique', 'numConcours'];

        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                $this->sendError(400, "Champ manquant: $field");
                return;
            }
        }

        try {
            $pdo = getPDO();

            // Insertion du dessin
            $sql = "
                INSERT INTO Dessin (
                    commentaire, 
                    classement, 
                    dateRemise, 
                    format, 
                    technique, 
                    numConcours, 
                    leDessin, 
                    numCompetiteur
                ) 
                SELECT 
                    :commentaire,
                    :classement,
                    CURRENT_DATE,
                    :format,
                    :technique,
                    :numConcours,
                    :leDessin,
                    c.numCompetiteur
                FROM Competiteur c 
                INNER JOIN Utilisateur u ON c.numCompetiteur = u.numUtilisateur 
                WHERE u.login = :login
                LIMIT 1
            ";

            $stmt = $pdo->prepare($sql);
            $success = $stmt->execute([
                'commentaire' => $data['commentaire'],
                'classement' => $data['classement'] ?? null,
                'format' => $data['format'],
                'technique' => $data['technique'],
                'numConcours' => $data['numConcours'],
                'leDessin' => $data['drawing'],
                'login' => $data['login']
            ]);

            // Vérifier si l'insertion a réussi
            if (!$success || $stmt->rowCount() === 0) {
                $this->sendError(404, "Compétiteur introuvable ou insertion échouée");
                return;
            }

            // ✅ Succès
            http_response_code(201);
            echo json_encode([
                "success" => true,
                "message" => "Dessin enregistré avec succès",
                "drawingId" => $pdo->lastInsertId()
            ]);
        } catch (Throwable $e) {
            $this->sendError(500, "Erreur serveur", $e->getMessage());
        }
    }

    public function getUserDrawings(): void
    {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!is_array($data) || !isset($data['login'])) {
            $this->sendError(400, "Login manquant");
            return;
        }

        $login = $data['login'];
        $year = isset($data['year']) && $data['year'] !== "" ? (int)$data['year'] : null;
        $numConcours = isset($data['numConcours']) && $data['numConcours'] !== "" ? (int)$data['numConcours'] : null;

        try {
            $pdo = getPDO();

            $conditions = ["u.login = :login"];
            $params = ['login' => $login];

            if ($year) {
                $conditions[] = "YEAR(d.dateRemise) = :year";
                $params['year'] = $year;
            }

            if ($numConcours) {
                $conditions[] = "d.numConcours = :numConcours";
                $params['numConcours'] = $numConcours;
            }

            $sql = "
                SELECT
                    d.numDessin,
                    d.commentaire,
                    d.classement,
                    d.dateRemise,
                    d.format,
                    d.technique,
                    d.leDessin,
                    d.numConcours,
                    c.theme,
                    c.dateDebut,
                    c.dateFin,
                    c.etat,
                    c.lieu
                FROM Dessin d
                INNER JOIN Concours c ON d.numConcours = c.numConcours
                INNER JOIN Competiteur comp ON d.numCompetiteur = comp.numCompetiteur
                INNER JOIN Utilisateur u ON comp.numCompetiteur = u.numUtilisateur
                WHERE " . implode(" AND ", $conditions) . "
                ORDER BY d.dateRemise DESC, d.numDessin DESC
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $drawings = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode([
                "success" => true,
                "data" => $drawings,
                "count" => count($drawings)
            ]);
        } catch (Throwable $e) {
            $this->sendError(500, "Erreur serveur", $e->getMessage());
        }
    }

    /**
     * Envoie une réponse d'erreur JSON
     */
    private function sendError(int $code, string $message, ?string $details = null): void
    {
        http_response_code($code);
        $response = [
            "success" => false,
            "message" => $message
        ];

        // ⚠️ N'afficher les détails qu'en développement
        if ($details && getenv('APP_ENV') !== 'production') {
            $response['error'] = $details;
        }

        echo json_encode($response);
    }
};
