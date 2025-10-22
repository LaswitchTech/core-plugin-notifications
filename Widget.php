<!-- ======= Notification ======= -->
<?php if($this->Auth->isAuthenticated()): ?>
    <div class="nav-item" id="widgetNotifications"></div>
    <script>
        (function () {
            $(document).ready(function(){
                builder.Widget('widgetNotifications', '#widgetNotifications');
            });
        })();
    </script>
<?php endif; ?>
<!-- ======= End Notification ======= -->
