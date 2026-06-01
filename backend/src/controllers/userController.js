import User from "../models/User.js";
import Event from "../models/Event.js";


export const toggleSaveEvent = async (req, res) => {

    try {

        const userId = req.user.id;
        const { eventId } = req.params;
        //    check the Event Present or not
        const event = await Event.findById(eventId);
        if (!event) {return res.status(404).json({ success: false, message: "Event not found" }); }
        // finding the user
        const user = await User.findById(userId);
        if (!user) {return res.status(404).json({success: false,message: "User not found"});}
      //    check the already saved event or not
        const issavedEvent = user.savedEvents.some((id) => id.toString() === eventId);
        let updatedUser;
        // Unsave the event if already saved, otherwise save it
        if (issavedEvent) {updatedUser = await User.findByIdAndUpdate(userId, {$pull: {savedEvents: eventId } },{ new: true });
        return res.status(200).json({success: true,message: "Event removed successfully",savedEvents: updatedUser.savedEvents});}
     // save the event
        updatedUser = await User.findByIdAndUpdate(userId, {$addToSet: {savedEvents: eventId}},{new: true});
        return res.status(200).json({success: true,message: "Event saved successfully", savedEvents: updatedUser.savedEvents});

    } catch (error) {
        return res.status(500).json({success: false,message: "Internal server error"});
    }
};


// Get All Saved Events for a User
export const getSavedEvents = async (req, res) => {

    try {
        const userId = req.user.id;
        const updatedUser = await User.findById(userId).populate("savedEvents");

        if (!updatedUser) {return res.status(404).json({success: false,message: "No Saved Events Found"});}

        return res.status(200).json({success: true,message: "Saved Events retrieved successfully",savedEvents: updatedUser.savedEvents.filter(event => event.status === "approved")});

    } catch (error) {
        return res.status(500).json({success: false,message: "Internal server error"});
    }
};

// Update Privacy Settings
export const updatePrivacySettings = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { showAttendanceToFriends, allowFriendRequests } = req.body;

        // Validate allowFriendRequests if provided
        if (allowFriendRequests && !['everyone', 'mutual_events', 'none'].includes(allowFriendRequests)) {
            return res.status(400).json({
                message: "Invalid allowFriendRequests value. Must be 'everyone', 'mutual_events', or 'none'"
            });
        }

        // Validate showAttendanceToFriends if provided
        if (showAttendanceToFriends !== undefined && typeof showAttendanceToFriends !== 'boolean') {
            return res.status(400).json({
                message: "showAttendanceToFriends must be a boolean"
            });
        }

        // Build update object with only provided fields
        const updateData = {};
        if (showAttendanceToFriends !== undefined) {
            updateData['privacySettings.showAttendanceToFriends'] = showAttendanceToFriends;
        }
        if (allowFriendRequests !== undefined) {
            updateData['privacySettings.allowFriendRequests'] = allowFriendRequests;
        }

        // If no valid fields to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                message: "No valid privacy settings provided"
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "Privacy settings updated successfully",
            privacySettings: updatedUser.privacySettings
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Internal server error"
        });
    }
};

