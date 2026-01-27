<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/SessionService.php';

class ResultsController
{
    public function getMyResults(): void
    {
        header("Content-Type: application/json");

        if (!SessionService::isAuthenticated()) {
            $this->sendError(401, "Utilisateur non authentifie");
            return;
        }

        $user = SessionService::getUser();
        $login = $user['login'] ?? null;
        if (!$login) {
            $this->sendError(401, "Session invalide (login manquant)");
            return;
        }

        try {
            $pdo = getPDO();

            $sql = "
                SELECT
                    d.numDessin,
                    d.commentaire,
                    d.classement,
                    d.dateRemise,
                    d.format,
                    d.technique,
                    d.numConcours,
                    c.theme,
                    c.dateDebut,
                    c.dateFin,
                    c.etat,
                    c.lieu,
                    AVG(e.note) AS noteMoyenne,
                    COUNT(e.note) AS nbEvaluations,
                    MAX(e.dateEvaluation) AS derniereEvaluation
                FROM Dessin d
                INNER JOIN Concours c ON c.numConcours = d.numConcours
                INNER JOIN Competiteur comp ON comp.numCompetiteur = d.numCompetiteur
                INNER JOIN Utilisateur u ON u.numUtilisateur = comp.numCompetiteur
                LEFT JOIN Evaluation e ON e.numDessin = d.numDessin
                WHERE u.login = :login
                GROUP BY
                    d.numDessin,
                    d.commentaire,
                    d.classement,
                    d.dateRemise,
                    d.format,
                    d.technique,
                    d.numConcours,
                    c.theme,
                    c.dateDebut,
                    c.dateFin,
                    c.etat,
                    c.lieu
                ORDER BY d.dateRemise DESC, d.numDessin DESC
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute(['login' => $login]);
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
