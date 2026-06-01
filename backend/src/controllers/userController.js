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

