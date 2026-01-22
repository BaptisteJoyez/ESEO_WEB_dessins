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
