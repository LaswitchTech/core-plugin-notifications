builder.add('widgets','widgetNotifications', class extends builder.ComponentClass {

    _init(){
        this._properties = {
            class: {
                component: null,
            },
            priority: 1,
            interval: 10000,
            autoStart: true,
            callback: {},
        };
        this._priority = -1;
        this._notifications = {};
        this._interval = null;
    }

    _create(){

        // Set Self
        const self = this;

        // Create Component
        this._component = $(document.createElement('div')).attr({
            'id': 'notifications' + this._id,
            'class': 'notifications-menu dropdown',
        });
        this._component.id = this._component.attr('id');

        // Add class to the component
        if(this._properties.class.component){
            this._component.addClass(this._properties.class.component);
        }

        // Create the button
        this._component.btn = $(document.createElement('button')).attr({
            'class': 'nav-link text-decoration-none py-2 animate-pulse-hover',
            'type': 'button',
            'data-bs-toggle': 'dropdown',
            'data-bs-auto-close': 'outside',
            'aria-expanded': 'false',
            'data-bs-placement': 'bottom',
            'data-bs-title': self._builder.Locale.get('Notifications'),
        }).appendTo(this._component);
        this._component.btn.animate = $(document.createElement('div')).appendTo(this._component.btn);
        this._component.btn.icon = $(document.createElement('i')).attr({
            'class': 'fs-4 bi bi-bell',
        }).appendTo(this._component.btn.animate);
        this._component.btn.badge = $(document.createElement('span')).attr({
            'class': 'position-absolute top-25 start-75 translate-middle border border-light rounded-circle text-bg-pink',
        }).appendTo(this._component.btn);

        // Create the dropdown menu
        this._component.menu = $(document.createElement('ul')).attr({
            'class': 'dropdown-menu dropdown-menu-end shadow pb-0',
        }).appendTo(this._component);

        // Create a header
        this._component.menu.header = $(document.createElement('div')).addClass('header').appendTo(this._component.menu);
        this._component.menu.header.title = $(document.createElement('h5')).attr({
            'class': 'py-2 px-3 m-0 cursor-default d-flex justify-content-center align-items-center',
        }).appendTo(this._component.menu.header);
        this._component.menu.header.title.text(self._builder.Locale.get('Notifications'));
        this._component.menu.header.title.count = $(document.createElement('span')).attr({
            'class': 'badge rounded-pill ms-2 text-bg-primary',
        }).appendTo(this._component.menu.header.title);

        // Create the notifications list container
        this._component.menu.list = $(document.createElement('div')).attr({
            'class': 'notifications-list',
        }).appendTo(this._component.menu);

        // Create a footer
        this._component.menu.footer = $(document.createElement('div')).attr({
            'class': 'footer px-3 py-2 border-top d-flex gap-2 align-items-center',
        }).appendTo(this._component.menu);
        this._component.menu.footer.switch = $(document.createElement('div')).attr({
            'class': 'form-check form-switch mb-0',
        }).appendTo(this._component.menu.footer);
        this._component.menu.footer.switch.input = $(document.createElement('input')).attr({
            'class': 'form-check-input',
            'type': 'checkbox',
            'id': 'toggleHideLow'+this._id,
        }).appendTo(this._component.menu.footer.switch).on('change', function(){
            self._priority = this.checked ? self._properties.priority : -1;
            localStorage.setItem(
                'notificationsMenuHideLowPriority',
                this.checked ? '1' : '0'
            );
            self.count();
        });
        if(localStorage.getItem('notificationsMenuHideLowPriority') === '1'){
            this._component.menu.footer.switch.input.prop('checked', true);
            this._priority = this._properties.priority;
        }
        this._component.menu.footer.switch.label = $(document.createElement('label')).attr({
            'for': 'toggleHideLow'+this._id,
            'class': 'form-check-label small',
        }).appendTo(this._component.menu.footer.switch);
        this._component.menu.footer.switch.label.text(self._builder.Locale.get('Hide low priority'));
        this._component.menu.footer.link = $(document.createElement('a')).attr({
            'href': '/plugin/notifications',
            'class': 'btn btn-link btn-sm link-primary text-decoration-none ms-auto',
        }).html('<i class="bi bi-list-ul me-2"></i>'+self._builder.Locale.get('View all')).appendTo(this._component.menu.footer);

        // Check if autoStart is enabled
        if(self._properties.autoStart){

            // Start
            self.start();
        }
    }

    load(records = null){

        // Set Self
        const self = this;

        // Check if records are provided
        if(records !== null && Object.entries(records).length > 0){

            // Loop through the records
            for(const [key, record] of Object.entries(records)){
                this.add(record);
            }
            return this;
        }

        // Retrieve Notifications
        API.endpoint('/notifications/fetchAll').data({
            conditions: [
                {key: 'assignedTo', operator: '=', value: USER_ID},
                {key: 'isDissmissed', operator: '<>', value: 1},
            ],
        }).execute(function(response){
            for(const [key, record] of Object.entries(response.records)){
                self.add(record);
            }
        });

        return this;
    }

    start(){

        // Set Self
        const self = this;

        // Check if the interval is already set
        if(this._interval){
            console.warn('Interval is already set, stopping the previous one.');
            clearInterval(this._interval);
        }

        // First Load
        this.load();

        // Set the interval to check for changes
        this._interval = setInterval(function(){
            self.load();
        }, this._properties.interval);
    }

    stop(){
        // Check if the interval is set
        if(this._interval){
            clearInterval(this._interval);
            this._interval = null;
        } else {
            console.warn('No interval is currently set.');
        }
    }

    count(){
        this._component.menu.header.title.count.text(
            this._component.menu.list.find('[data-type="notification"]').length
        );
        if(this._component.menu.list.find('[data-type="notification"]').length > 0){
            this._component.btn.badge.show();
            this._component.btn.animate.addClass('animate-wobble');
        } else {
            this._component.btn.badge.hide();
            this._component.btn.animate.removeClass('animate-wobble');
        }
    }

    delete(id = null){

        // Set Self
        const self = this;

        // remove the notification element
        if(this._notifications[id]){
            this._notifications[id].remove();
            delete this._notifications[id];
        }

        // Update the count
        this.count();

        return this;
    }

    sort(){

        // Set Self
        const self = this;

        // Get all notification elements and sort them by created date
        // Allways sort using the notification.data.created property
        // created date = null -> end of the list
        // order from oldest to newest
        const notifications = Object.values(this._notifications).sort((a, b) => {
            const dateA = a.data.created ? new Date(a.data.created) : new Date(8640000000000000);
            const dateB = b.data.created ? new Date(b.data.created) : new Date(8640000000000000);
            return dateA - dateB;
        });

        // Clear the list
        this._component.menu.list.empty();

        // Append the sorted notifications to the list
        notifications.forEach(notification => {
            notification.appendTo(self._component.menu.list).off('click').click(function(){
                self._builder.Widget('notification',{data: notification.data.id}).view();
            });
        });

        return this;
    }

    edit(record){

        // Set Self
        const self = this;

        // Check if the record exists
        if(typeof this._notifications[record.id] === 'undefined'){
            return this;
        }

        // Get the notification
        const notification = this._notifications[record.id];

        // Update the notification data
        notification.data = record;

        // Update the category
        notification.category.attr({
            'data-bs-title': record.category,
        }).text(self._builder.Locale.get(record.category));

        // Update the created date
        notification.created.attr({
            'data-bs-title': record.created ?? new Date().toISOString(),
        });
        notification.created.find('time').attr({
            'datetime': record.created ?? new Date().toISOString(),
        }).text('');
        new bootstrap.Tooltip(notification.created);
        notification.created.find('time').timeago();

        // Show or hide the created date
        if(record.created){
            notification.created.show();
        } else {
            notification.created.hide();
        }

        // Update the title and initials
        notification.title.text.text(self._builder.Locale.get(record.title));
        notification.icon.header.text(self.initials(record.title));

        // Update the content
        notification.content.html(self._builder.Locale.get(record.content));

        // Sort the notifications
        this.sort();

        // Update the count
        this.count();

        return this;
    }

    add(record){

        // Set Self
        const self = this;

        // Check if the record already exists
        if(this._notifications[record.id]){
            this.edit(record);
            return this;
        }

        // Set ID
        const id = this._component.id + 'notification' + record.id;

        // Create Notification Element
        let notification = $(document.createElement('div')).attr({
            'id': id,
            'class': 'list-group-item list-group-item-action notification-row',
            'data-type': 'notification',
            'data-notification-id': record.id,
        }).appendTo(this._component.menu.list);
        notification.id = id;
        notification.data = record;

        // Create the notification layout
        notification.flex = $(document.createElement('div')).attr({
            'class':'d-flex gap-2 align-items-start',
        }).appendTo(notification);

        // Create the notification icon
        notification.icon = $(document.createElement('div')).attr({
            'class':'my-2 ms-3 rounded-circle p-3 d-flex justify-content-center align-items-center text-bg-light',
            style: 'width: 48px; height: 48px;',
        }).appendTo(notification.flex);
        notification.icon.header = $(document.createElement('h3')).attr({
            'class':'m-0 fw-lighter',
        }).text(this.initials(record.title)).appendTo(notification.icon);

        // Create the notification layout
        notification.layout = $(document.createElement('div')).attr({
            'class':'flex-grow-1 min-w-0 my-2 me-3 position-relative',
        }).appendTo(notification.flex);

        // Create the notification meta container
        notification.meta = $(document.createElement('div')).attr({
            'class':'meta d-flex gap-2 justify-content-end',
        }).appendTo(notification.layout);

        // Insert the category
        notification.category = $(document.createElement('span')).attr({
            'class':'category',
            'data-bs-title': record.category,
        }).text(self._builder.Locale.get(record.category)).appendTo(notification.meta);

        // Insert the created date
        notification.created = $(document.createElement('span')).attr({
            'class':'created',
            'data-bs-title': record.created ?? new Date().toISOString(),
        }).appendTo(notification.meta);
        notification.created.append('<i class="bi bi-clock me-1"></i>');
        notification.created.append($(document.createElement('time')).attr({
            'datetime': record.created ?? new Date().toISOString(),
        }).text(''));
        new bootstrap.Tooltip(notification.created);
        notification.created.find('time').timeago();
        if(record.created){
            notification.created.show();
        } else {
            notification.created.hide();
        }

        // Insert the title
        notification.title = $(document.createElement('div')).attr({
            'class':'d-flex justify-content-between align-items-baseline',
        }).appendTo(notification.layout);
        notification.title.text = $(document.createElement('div')).attr({
            'class':'notification-title fw-semibold truncate-1',
        }).text(self._builder.Locale.get(record.title)).appendTo(notification.title);

        // Insert the content
        notification.content = $(document.createElement('div')).attr({
            'class':'notification-content text-truncate',
        }).html(self._builder.Locale.get(record.content)).appendTo(notification.layout);

        // Save the notification
        this._notifications[record.id] = notification;

        // Sort the notifications
        this.sort();

        // Update the count
        this.count();

        return this;
    }

    initials(string){
        // Split the string into words
        const words = string.trim().split(' ');
        // Get the first letter of the first two words
        let initials = '';
        for(let i = 0; i < Math.min(2, words.length); i++){
            initials += words[i].charAt(0).toUpperCase();
        }
        return initials;
    }
});
