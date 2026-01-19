<?php
 
require_once __DIR__ . "/../models/UserModel.php";
 
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
    
        // MOCK USER (TEMPORAIRE)

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

            "received" => $data // pour debug

        ]);

    }
}