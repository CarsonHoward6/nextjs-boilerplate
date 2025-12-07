-- Create function to notify admin when new users are created
CREATE OR REPLACE FUNCTION notify_admin_new_user()
RETURNS TRIGGER AS $$
DECLARE
    admin_id UUID;
    admin_email TEXT := 'carsonhoward6@gmail.com';
BEGIN
    -- Find the admin user ID
    SELECT id INTO admin_id
    FROM auth.users
    WHERE email = admin_email
    LIMIT 1;

    -- If admin exists, create notification
    IF admin_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, message, notification_type, related_user_id)
        VALUES (
            admin_id,
            'New user registered: ' || COALESCE(NEW.email, 'Unknown email'),
            'user_created',
            NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS trigger_notify_admin_new_user ON auth.users;
CREATE TRIGGER trigger_notify_admin_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_new_user();

-- Create function to notify admin when users log in (first login of the day)
CREATE OR REPLACE FUNCTION notify_admin_user_login()
RETURNS TRIGGER AS $$
DECLARE
    admin_id UUID;
    admin_email TEXT := 'carsonhoward6@gmail.com';
    last_notification TIMESTAMP;
BEGIN
    -- Only trigger if last_sign_in_at changed (user logged in)
    IF (NEW.last_sign_in_at IS NOT NULL) AND
       (OLD.last_sign_in_at IS NULL OR NEW.last_sign_in_at > OLD.last_sign_in_at) THEN

        -- Find the admin user ID
        SELECT id INTO admin_id
        FROM auth.users
        WHERE email = admin_email
        LIMIT 1;

        -- Check if we already notified about this user today
        SELECT created_at INTO last_notification
        FROM notifications
        WHERE user_id = admin_id
          AND notification_type = 'user_login'
          AND related_user_id = NEW.id
          AND created_at > NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC
        LIMIT 1;

        -- If admin exists and we haven't notified in the last 24 hours, create notification
        IF admin_id IS NOT NULL AND last_notification IS NULL THEN
            INSERT INTO notifications (user_id, message, notification_type, related_user_id)
            VALUES (
                admin_id,
                'User logged in: ' || COALESCE(NEW.email, 'Unknown email'),
                'user_login',
                NEW.id
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user login
DROP TRIGGER IF EXISTS trigger_notify_admin_user_login ON auth.users;
CREATE TRIGGER trigger_notify_admin_user_login
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_user_login();
