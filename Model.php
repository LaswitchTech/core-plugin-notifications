<?php

// Import additionnal class into the global namespace
use \LaswitchTech\Core\Base\BaseModel;

class NotificationsModel extends BaseModel {

    /**
     * Constructor
     */
    public function __construct()
    {
        // Call the parent constructor
        parent::__construct();

        // Initialize the Model
        $this->init('notifications');
    }

    /**
     * Apply Joins to the Query
     *
     * @param Query $Query
     * @return Query
     */
    protected function joins(object $Query): object
    {
        // Apply Joins
        $Query->join('assignedTo', 'users', 'id');

        return $Query;
    }

    /**
     * Create a Notification
     *
     * @param string $name
     * @param int $assignedTo
     * @param string $title
     * @param string $content
     * @param string|null $link
     * @param string $category
     * @return int
     */
    public function notify(string $name, int $assignedTo, string $title, string $content, ?string $link = null, string $category = "System"): int
    {
        // Import Global Variables
        global $CONFIG, $REQUEST, $SMTP, $AUTH;

        // Initialize Status
        $status = 0;

        // Import the Users Model
        require_once $CONFIG->root() . '/lib/plugins/users/Model.php';

        // Initialize the Users Model
        $Model = new UsersModel();

        // Retrieve the Assigned User
        $user = $Model->fetch($assignedTo);

        // Retrieve the Notification Settings
        $settings = $user['settings']['notifications'] ?? [];

        // Check if the notification settings exist
        if (!isset($settings[$name])) {
            $settings[$name] = [
                'email' => false,
                'sms' => false,
                'push' => true
            ];
            $Model->update($assignedTo, [
                'settings' => json_encode(array_merge($user['settings'], [
                    'notifications' => $settings
                ]))
            ]);
        }

        // Allowed Notifications
        $allowed = $settings[$name] ?? [];

        // Set the Notification
        $notification = [
            'assignedTo' => $assignedTo,
            'title'      => $title,
            'content'    => $content,
            'link'       => $link,
            'category'   => $category,
        ];

        // Check if we can create the notification
        if(in_array('push', $allowed) && $allowed['push']){

            // Created Notification
            if($this->create($notification)){
                $status += 1;
            }
        }

        // Check if we can send the notification via email
        if(in_array('email', $allowed) && $allowed['email']){

            // Connect to the smtp server
            $SMTP->connect();

            // Check if the smtp server is connected
            if($SMTP->isConnected()){

                // Authenticate to the SMTP Server
                $SMTP->authenticate();

                // Check if the SMTP Server is authenticated
                if($SMTP->isAuthenticated()){

                    // Write the email
                    $body = '';
                    $body .= '<p>This is an automated <strong>'.$category.'</strong> notification.</p>';
                    $body .= '<p>'.$content.'</p>';
                    if($link){
                        $body .= '<p style="text-align:center;margin-top: 40px;margin-bottom:40px;">';
                        $body .= '<a href="'.$REQUEST->getHostAddress().$link.'" target="_blank" style="margin-left: 6px; margin-right: 6px; text-decoration:none; background-color: #528fb3;color: #fff;font-size: 24px;padding: 20px 40px;text-align: center;margin: 20px 20px;border-radius: 8px;">View Details</a>';
                        $body .= '</p>';
                    }
                    $body .= '<p>If you did not expect this message, please ignore it.</p>';

                    // Create a new message
                    $eml = $SMTP->message()
                        ->to($user['username'])
                        ->from($AUTH->user()->organization()->email ?? $CONFIG->get('smtp','username'))
                        ->subject($category.' - '.$title)
                        ->body($body)
                        ->var('greetings', "Sincerely,<br>".$AUTH->user()->organization()->name."'s Team");

                    // Send the message
                    $eml->send();

                    // Check if the message was sent
                    if($eml->status()){

                        // Save the message
                        $eml->save();

                        // Update status
                        $status += 1;
                    }
                }
            }
        }

        // Check if we can send the notification via sms
        if(in_array('sms', $allowed) && $allowed['sms']){
            // Send SMS Notification
            // (SMS sending logic would go here)
        }

        // Return status
        return $status;
    }
}
