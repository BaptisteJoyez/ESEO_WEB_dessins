<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/SessionService.php';

class ClubsController
{
    public function listClubs(): void
    {
        header("Content-Type: application/json");

        if (!SessionService::isAuthenticated()) {
            $this->sendError(401, "Utilisateur non authentifie");
            return;
        }

        try {
            $pdo = getPDO();
            $sql = "
                SELECT
                    c.numClub,
                    c.nomClub,
                    c.ville,
                    c.departement,
                    c.region,
                    c.nombreAdherents,
                    COUNT(DISTINCT u.numUtilisateur) AS nbMembres,
                    COUNT(DISTINCT d.numDessin) AS nbDessins
                FROM Club c
                LEFT JOIN Utilisateur u ON u.numClub = c.numClub
                LEFT JOIN Competiteur comp ON comp.numCompetiteur = u.numUtilisateur
                LEFT JOIN Dessin d ON d.numCompetiteur = comp.numCompetiteur
                GROUP BY
                    c.numClub,
                    c.nomClub,
                    c.ville,
                    c.departement,
                    c.region,
                    c.nombreAdherents
                ORDER BY c.nomClub ASC, c.numClub ASC
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

    public function getClubDrawings(int $numClub): void
    {
        header("Content-Type: application/json");

        if (!SessionService::isAuthenticated()) {
            $this->sendError(401, "Utilisateur non authentifie");
            return;
        }

        try {
            $pdo = getPDO();

            $clubStmt = $pdo->prepare("SELECT numClub, nomClub, ville, departement, region FROM Club WHERE numClub = :numClub LIMIT 1");
            $clubStmt->execute(['numClub' => $numClub]);
            $club = $clubStmt->fetch(PDO::FETCH_ASSOC);

            if (!$club) {
                $this->sendError(404, "Club introuvable");
                return;
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
                    conc.theme,
                    conc.dateDebut,
                    conc.dateFin,
                    conc.etat,
                    conc.lieu,
                    u.numUtilisateur,
                    u.nom,
                    u.prenom,
                    u.login
                FROM Utilisateur u
                INNER JOIN Competiteur comp ON comp.numCompetiteur = u.numUtilisateur
                INNER JOIN Dessin d ON d.numCompetiteur = comp.numCompetiteur
                INNER JOIN Concours conc ON conc.numConcours = d.numConcours
                WHERE u.numClub = :numClub
                ORDER BY d.dateRemise DESC, d.numDessin DESC
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute(['numClub' => $numClub]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode([
                "success" => true,
                "club" => $club,
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
