<?php

// Import additionnal class into the global namespace
use \LaswitchTech\Core\Base\BaseEndpoint;

class NotificationsEndpoint extends BaseEndpoint {

    /**
     * Constructor
     */
    public function __construct()
    {
        // Call the parent constructor
        parent::__construct();

        // Initialize the Endpoint
        $this->init('notifications');

        // Set Properties
        $this->required = ['assignedTo','title','content'];

        // Set Properties
        switch($this->Request->getNamespace()){
            case "/notifications/notify":
                $this->Public = false;
                $this->Level = 2;
                break;
        }
    }

    /**
     * Create a Notification
     */
    public function notifyAction(): array
    {

        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Retrieve the notifications's id and new stage
        $assignedTo = $this->Request->getParams('REQUEST','assignedTo') ?? $this->Auth->user()->id;
        $title = $this->Request->getParams('REQUEST','title');
        $content = $this->Request->getParams('REQUEST','content');
        $link = $this->Request->getParams('REQUEST','link');
        $category = $this->Request->getParams('REQUEST','category');

        // Check if the parameter exists
        if(empty($assignedTo) || is_null($assignedTo)){
            $message = ["status" => 400, "message" => "Bad Request", "data" => "The 'assignedTo' parameter is required."];
        }
        if(empty($title) || is_null($title)){
            $message = ["status" => 400, "message" => "Bad Request", "data" => "The 'title' parameter is required."];
        }
        if(empty($content) || is_null($content)){
            $message = ["status" => 400, "message" => "Bad Request", "data" => "The 'content' parameter is required."];
        }

        // Check if we can proceed
        if($message['status'] == 200){

            // Check the request method
            if($this->Request->getMethod() == "POST"){

                // Create the notification
                if($this->Model->{$this->name}->notify((int)$assignedTo, (string)$title, (string)$content, (string)$link, (string)$category) > 0){
                    $message['data'] = "The user has been notified successfully.";
                } else {
                    $message = ["status" => 500, "message" => "Internal Server Error", "data" => "An error occurred while creating the notification."];
                }
            } else {
                $message = ["status" => 405, "message" => "Method Not Allowed", "data" => "The method is not allowed for the requested URL."];
            }
        }

        // Return the message
        return $message;
    }
}
