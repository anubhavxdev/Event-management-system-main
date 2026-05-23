export const calculateRefund = (eventDate, amount) => {
    const now = new Date();
  
    const timeDifference = eventDate.getTime() - now.getTime();
  
    const hoursLeft = timeDifference / (1000 * 60 * 60);
    const daysLeft = timeDifference / (1000 * 60 * 60 * 24);
  
    // No refund within 24 hours
    if (hoursLeft < 24) {
      return {
        eligible: false,
        percentage: 0,
        refundAmount: 0,
        status: "not_applicable",
        message: "No refund available within 24 hours of event",
      };
    }
  
    // Full refund (> 7 days)
    if (daysLeft > 7) {
      return {
        eligible: true,
        percentage: 100,
        refundAmount: amount,
        status: "initiated",
        message: "Full refund applicable",
      };
    }
  
    // 50% refund (2–7 days)
    if (daysLeft >= 2 && daysLeft <= 7) {
      return {
        eligible: true,
        percentage: 50,
        refundAmount: amount * 0.5,
        status: "initiated",
        message: "50% refund applicable",
      };
    }
  
    return {
      eligible: false,
      percentage: 0,
      refundAmount: 0,
      status: "not_applicable",
      message: "Refund not applicable",
    };
  };