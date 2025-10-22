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
     * @param int $assignedTo
     * @param string $title
     * @param string $content
     * @param string|null $link
     * @param string $category
     * @return int
     */
    public function notify(int $assignedTo, string $title, string $content, string $link = null, string $category = "System"): int
    {
        return $this->create([
            'assignedTo' => $assignedTo,
            'title'      => $title,
            'content'    => $content,
            'link'       => $link,
            'category'   => $category,
        ]);
    }
}
