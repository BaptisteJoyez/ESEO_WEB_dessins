<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/SessionService.php';

class ConcoursController
{
    /**
     * Récupère les concours d'un utilisateur
     */
    public function getConcours(): void
    {
        // Lecture des données JSON
        $data = json_decode(file_get_contents("php://input"), true);

        // Validation : seul le login est nécessaire pour récupérer les concours
        if (!isset($data['login'])) {
            $this->sendError(400, "Login manquant");
            return;
        }

        try {
            $pdo = getPDO();

            // Récupération des concours de l'utilisateur
            $sql = "
                SELECT DISTINCT
                    c.numConcours,
                    c.theme AS description_concours,
                    c.dateDebut,
                    c.dateFin,
                    c.etat,
                    c.lieu
                FROM Concours c
                JOIN ParticipeCompetiteur pc ON c.numConcours = pc.numConcours
                JOIN Utilisateur u ON pc.numCompetiteur = u.numUtilisateur
                WHERE u.login = :login
                AND c.etat IN ('pas commence', 'en cours', 'attente')
                ORDER BY c.dateDebut ASC
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute(['login' => $data['login']]);

            $concours = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // ✅ Succès (même si aucun concours trouvé)
            http_response_code(200);
            echo json_encode([
                "success" => true,
                "data" => $concours,
                "count" => count($concours)
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

        if ($details && getenv('APP_ENV') !== 'production') {
            $response['error'] = $details;
        }

        echo json_encode($response);
    }
}
