<?php

class AuthController
{
    public function login()
    {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!$data) {
            http_response_code(400);
            echo json_encode([
                "verified" => false,
                "message" => "No JSON received"
            ]);
            return;
        }

        // MOCK USER
        $_SESSION["user"] = [
            "id" => 1,
            "firstName" => "John",
            "lastName" => "Doe",
            "role" => "competitor",
            "club" => "Mock Club"
        ];

        echo json_encode([
            "verified" => true,
            "user" => $_SESSION["user"],
            "received" => $data
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
